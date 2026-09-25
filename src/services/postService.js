import db from '../db/index.js';

const HOT_WINDOW_DAYS = 7;

export const postService = {
  list({ page = 1, size = 10, keyword = '', sort = 'new', category = '', userId = null }) {
    const offset = (page - 1) * size;
    const like = `%${keyword}%`;

    const conds = [];
    const params = [];
    if (keyword) {
      conds.push('(p.title LIKE ? OR p.content LIKE ?)');
      params.push(like, like);
    }
    if (category) {
      conds.push('p.category = ?');
      params.push(category);
    }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    let orderBy;
    switch (sort) {
      case 'hot':
        orderBy = `
          (p.upvotes * 4 + (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) * 3 + p.views * 0.5)
          / (1 + (julianday('now','localtime') - julianday(p.created_at)) / ${HOT_WINDOW_DAYS}) DESC,
          p.created_at DESC`;
        break;
      case 'top':
        orderBy = 'p.upvotes DESC, p.created_at DESC';
        break;
      default:
        orderBy = 'p.created_at DESC, p.id DESC';
    }

    const rows = db.prepare(`
      SELECT p.id, p.title, p.author_name, p.author_id, p.views, p.upvotes,
             p.images, p.created_at, p.pinned, p.featured, p.category,
             substr(p.content, 1, 120) AS summary,
             (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
             EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?) AS liked
      FROM posts p
      ${where}
      ORDER BY p.pinned DESC, ${orderBy}
      LIMIT ? OFFSET ?
    `).all(userId || -1, ...params, size, offset);

    const { total } = db.prepare(`
      SELECT COUNT(*) AS total FROM posts p
      ${where}
    `).get(...params);

    return { rows, total, page, size, sort };
  },

  findById(id, userId = null) {
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
    if (!post) return null;

    db.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').run(id);

    const liked = db.prepare(
      'SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?'
    ).get(id, userId || -1);

    const comments = db.prepare(`
      SELECT c.*,
             EXISTS(SELECT 1 FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = ?) AS liked
      FROM comments c
      WHERE c.post_id = ? ORDER BY c.id ASC
    `).all(userId || -1, id);

    return { ...post, views: post.views + 1, liked: !!liked, comments };
  },

  create({ title, content, author_id, author_name, images = [], category = '' }) {
    const info = db.prepare(`
      INSERT INTO posts (title, content, author_id, author_name, images, category)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(title, content, author_id || null, author_name || '匿名', JSON.stringify(images), category);
    return db.prepare('SELECT * FROM posts WHERE id = ?').get(info.lastInsertRowid);
  },

  update(id, { title, content, images, category }, userId, isAdmin) {
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
    if (!post) return { status: 404 };
    if (!isAdmin && post.author_id !== userId) return { status: 403 };
    db.prepare(`
      UPDATE posts SET title = ?, content = ?, images = ?, category = ?, updated_at = datetime('now','localtime')
      WHERE id = ?
    `).run(title, content, JSON.stringify(images || []), category || '', id);
    return { status: 200 };
  },

  remove(id, userId, isAdmin) {
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
    if (!post) return { status: 404 };
    if (!isAdmin && post.author_id && post.author_id !== userId) {
      return { status: 403 };
    }
    db.prepare('DELETE FROM posts WHERE id = ?').run(id);
    return { status: 200 };
  },

  listFeatured(userId = null) {
    const rows = db.prepare(`
      SELECT p.id, p.title, p.author_name, p.author_id, p.views, p.upvotes,
             p.images, p.created_at, p.pinned, p.featured, p.category,
             substr(p.content, 1, 160) AS summary,
             (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
             EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?) AS liked
      FROM posts p
      WHERE p.featured = 1
      ORDER BY p.updated_at DESC, p.created_at DESC
      LIMIT 6
    `).all(userId || -1);
    return rows;
  },

  toggleFeatured(id) {
    const post = db.prepare('SELECT id, featured FROM posts WHERE id = ?').get(id);
    if (!post) return null;
    const featured = post.featured ? 0 : 1;
    db.prepare("UPDATE posts SET featured = ?, updated_at = datetime('now','localtime') WHERE id = ?").run(featured, id);
    return { featured: !!featured };
  },

  togglePin(id) {
    const post = db.prepare('SELECT id, pinned FROM posts WHERE id = ?').get(id);
    if (!post) return null;
    const pinned = post.pinned ? 0 : 1;
    db.prepare('UPDATE posts SET pinned = ? WHERE id = ?').run(pinned, id);
    return { pinned: !!pinned };
  },

  toggleLike(id, userId) {
    const post = db.prepare('SELECT id, author_id FROM posts WHERE id = ?').get(id);
    if (!post) return null;
    const existing = db.prepare(
      'SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?'
    ).get(id, userId);
    if (existing) {
      db.prepare('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?').run(id, userId);
      db.prepare('UPDATE posts SET upvotes = upvotes - 1 WHERE id = ?').run(id);
      return { liked: false };
    } else {
      db.prepare('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)').run(id, userId);
      db.prepare('UPDATE posts SET upvotes = upvotes + 1 WHERE id = ?').run(id);
      return { liked: true };
    }
  },
};
