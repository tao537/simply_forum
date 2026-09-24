import db from '../db/index.js';

export const postService = {
  list({ page = 1, size = 10, keyword = '' }) {
    const offset = (page - 1) * size;
    const like = `%${keyword}%`;

    const rows = db.prepare(`
      SELECT p.id, p.title, p.author_name, p.views, p.created_at,
             substr(p.content, 1, 120) AS summary,
             (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
      FROM posts p
      WHERE p.title LIKE ? OR p.content LIKE ?
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
    `).all(like, like, size, offset);

    const { total } = db.prepare(`
      SELECT COUNT(*) AS total FROM posts
      WHERE title LIKE ? OR content LIKE ?
    `).get(like, like);

    return { rows, total, page, size };
  },

  findById(id) {
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
    if (!post) return null;

    db.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').run(id);

    const comments = db.prepare(
      'SELECT * FROM comments WHERE post_id = ? ORDER BY id ASC'
    ).all(id);

    return { ...post, views: post.views + 1, comments };
  },

  create({ title, content, author_name }) {
    const info = db.prepare(
      'INSERT INTO posts (title, content, author_name) VALUES (?, ?, ?)'
    ).run(title, content, author_name || '匿名');
    return db.prepare('SELECT * FROM posts WHERE id = ?').get(info.lastInsertRowid);
  },

  remove(id) {
    return db.prepare('DELETE FROM posts WHERE id = ?').run(id).changes > 0;
  },
};
