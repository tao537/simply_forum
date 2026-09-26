import db from '../db/index.js';

const HOT_WINDOW_DAYS = 7;

export const postService = {
  async list({ page = 1, size = 10, keyword = '', sort = 'new', category = '', userId = null }) {
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
          / (1 + (DATEDIFF(NOW(), p.created_at)) / ${HOT_WINDOW_DAYS}) DESC,
          p.created_at DESC`;
        break;
      case 'top':
        orderBy = 'p.upvotes DESC, p.created_at DESC';
        break;
      default:
        orderBy = 'p.created_at DESC, p.id DESC';
    }

    const [rows] = await db.query(`
      SELECT p.id, p.title, p.author_name, p.author_id, p.views, p.upvotes,
             p.images, p.created_at, p.pinned, p.featured, p.category,
             substr(p.content, 1, 120) AS summary,
             (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
             EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?) AS liked
      FROM posts p
      ${where}
      ORDER BY p.pinned DESC, ${orderBy}
      LIMIT ? OFFSET ?
    `, [userId || -1, ...params, size, offset]);

    const [totalRows] = await db.query(`
      SELECT COUNT(*) AS total FROM posts p
      ${where}
    `, params);
    const total = Number(totalRows[0].total);

    return { rows, total, page, size, sort };
  },

  async findById(id, userId = null) {
    const [postRows] = await db.query('SELECT * FROM posts WHERE id = ?', [id]);
    const post = postRows[0];
    if (!post) return null;

    await db.query('UPDATE posts SET views = views + 1 WHERE id = ?', [id]);

    const [likedRows] = await db.query(
      'SELECT 1 AS found FROM post_likes WHERE post_id = ? AND user_id = ?',
      [id, userId || -1]
    );
    const liked = likedRows[0];

    const [comments] = await db.query(`
      SELECT c.*,
             EXISTS(SELECT 1 FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = ?) AS liked
      FROM comments c
      WHERE c.post_id = ? ORDER BY c.id ASC
    `, [userId || -1, id]);

    return { ...post, views: post.views + 1, liked: !!liked, comments };
  },

  async create({ title, content, author_id, author_name, images = [], category = '' }) {
    const [r] = await db.query(`
      INSERT INTO posts (title, content, author_id, author_name, images, category)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [title, content, author_id || null, author_name || '匿名', JSON.stringify(images), category]);
    const [rows] = await db.query('SELECT * FROM posts WHERE id = ?', [r.insertId]);
    return rows[0];
  },

  async update(id, { title, content, images, category }, userId, isAdmin) {
    const [postRows] = await db.query('SELECT * FROM posts WHERE id = ?', [id]);
    const post = postRows[0];
    if (!post) return { status: 404 };
    if (!isAdmin && post.author_id !== userId) return { status: 403 };
    await db.query(`
      UPDATE posts SET title = ?, content = ?, images = ?, category = ?, updated_at = NOW()
      WHERE id = ?
    `, [title, content, JSON.stringify(images || []), category || '', id]);
    return { status: 200 };
  },

  async remove(id, userId, isAdmin) {
    const [postRows] = await db.query('SELECT * FROM posts WHERE id = ?', [id]);
    const post = postRows[0];
    if (!post) return { status: 404 };
    if (!isAdmin && post.author_id && post.author_id !== userId) {
      return { status: 403 };
    }
    await db.query('DELETE FROM posts WHERE id = ?', [id]);
    return { status: 200 };
  },

  async listFeatured(userId = null) {
    const [rows] = await db.query(`
      SELECT p.id, p.title, p.author_name, p.author_id, p.views, p.upvotes,
             p.images, p.created_at, p.pinned, p.featured, p.category,
             substr(p.content, 1, 160) AS summary,
             (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
             EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?) AS liked
      FROM posts p
      WHERE p.featured = 1
      ORDER BY p.updated_at DESC, p.created_at DESC
      LIMIT 6
    `, [userId || -1]);
    return rows;
  },

  async toggleFeatured(id) {
    const [rows] = await db.query('SELECT id, featured FROM posts WHERE id = ?', [id]);
    const post = rows[0];
    if (!post) return null;
    const featured = post.featured ? 0 : 1;
    await db.query("UPDATE posts SET featured = ?, updated_at = NOW() WHERE id = ?", [featured, id]);
    return { featured: !!featured };
  },

  async togglePin(id) {
    const [rows] = await db.query('SELECT id, pinned FROM posts WHERE id = ?', [id]);
    const post = rows[0];
    if (!post) return null;
    const pinned = post.pinned ? 0 : 1;
    await db.query('UPDATE posts SET pinned = ? WHERE id = ?', [pinned, id]);
    return { pinned: !!pinned };
  },

  async toggleLike(id, userId) {
    const [rows] = await db.query('SELECT id, author_id FROM posts WHERE id = ?', [id]);
    const post = rows[0];
    if (!post) return null;
    const [existingRows] = await db.query(
      'SELECT 1 AS found FROM post_likes WHERE post_id = ? AND user_id = ?',
      [id, userId]
    );
    const existing = existingRows[0];
    if (existing) {
      await db.query('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [id, userId]);
      await db.query('UPDATE posts SET upvotes = upvotes - 1 WHERE id = ?', [id]);
      return { liked: false };
    } else {
      await db.query('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [id, userId]);
      await db.query('UPDATE posts SET upvotes = upvotes + 1 WHERE id = ?', [id]);
      return { liked: true };
    }
  },
};
