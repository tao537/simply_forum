import db from '../db/index.js';

export const commentService = {
  create(postId, { content, author_name }) {
    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
    if (!post) return null;

    const info = db.prepare(
      'INSERT INTO comments (post_id, content, author_name) VALUES (?, ?, ?)'
    ).run(postId, content, author_name || '匿名');

    return db.prepare('SELECT * FROM comments WHERE id = ?').get(info.lastInsertRowid);
  },

  remove(id) {
    return db.prepare('DELETE FROM comments WHERE id = ?').run(id).changes > 0;
  },
};
