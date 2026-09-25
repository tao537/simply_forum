import db from '../db/index.js';

export const commentService = {
  create(postId, { content, author_id, author_name }) {
    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
    if (!post) return null;

    const info = db.prepare(`
      INSERT INTO comments (post_id, content, author_id, author_name)
      VALUES (?, ?, ?, ?)
    `).run(postId, content, author_id || null, author_name || '匿名');

    return db.prepare('SELECT * FROM comments WHERE id = ?').get(info.lastInsertRowid);
  },

  remove(id, userId, isAdmin) {
    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
    if (!comment) return { status: 404 };
    if (!isAdmin && comment.author_id && comment.author_id !== userId) {
      return { status: 403 };
    }
    db.prepare('DELETE FROM comments WHERE id = ?').run(id);
    return { status: 200 };
  },

  toggleLike(id, userId) {
    const comment = db.prepare('SELECT id FROM comments WHERE id = ?').get(id);
    if (!comment) return null;
    const existing = db.prepare(
      'SELECT 1 FROM comment_likes WHERE comment_id = ? AND user_id = ?'
    ).get(id, userId);
    if (existing) {
      db.prepare('DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?').run(id, userId);
      db.prepare('UPDATE comments SET upvotes = upvotes - 1 WHERE id = ?').run(id);
      return { liked: false };
    } else {
      db.prepare('INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)').run(id, userId);
      db.prepare('UPDATE comments SET upvotes = upvotes + 1 WHERE id = ?').run(id);
      return { liked: true };
    }
  },
};
