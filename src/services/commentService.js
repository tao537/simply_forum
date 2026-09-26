import db from '../db/index.js';

export const commentService = {
  async create(postId, { content, author_id, author_name }) {
    const [postRows] = await db.query('SELECT id FROM posts WHERE id = ?', [postId]);
    const post = postRows[0];
    if (!post) return null;

    const [r] = await db.query(`
      INSERT INTO comments (post_id, content, author_id, author_name)
      VALUES (?, ?, ?, ?)
    `, [postId, content, author_id || null, author_name || '匿名']);

    const [rows] = await db.query('SELECT * FROM comments WHERE id = ?', [r.insertId]);
    return rows[0];
  },

  async remove(id, userId, isAdmin) {
    const [commentRows] = await db.query('SELECT * FROM comments WHERE id = ?', [id]);
    const comment = commentRows[0];
    if (!comment) return { status: 404 };
    if (!isAdmin && comment.author_id && comment.author_id !== userId) {
      return { status: 403 };
    }
    await db.query('DELETE FROM comments WHERE id = ?', [id]);
    return { status: 200 };
  },

  async toggleLike(id, userId) {
    const [commentRows] = await db.query('SELECT id FROM comments WHERE id = ?', [id]);
    const comment = commentRows[0];
    if (!comment) return null;
    const [existingRows] = await db.query(
      'SELECT 1 AS found FROM comment_likes WHERE comment_id = ? AND user_id = ?',
      [id, userId]
    );
    const existing = existingRows[0];
    if (existing) {
      await db.query('DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?', [id, userId]);
      await db.query('UPDATE comments SET upvotes = upvotes - 1 WHERE id = ?', [id]);
      return { liked: false };
    } else {
      await db.query('INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)', [id, userId]);
      await db.query('UPDATE comments SET upvotes = upvotes + 1 WHERE id = ?', [id]);
      return { liked: true };
    }
  },
};
