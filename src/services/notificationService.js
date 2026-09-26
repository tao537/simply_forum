import db from '../db/index.js';

export const notificationService = {
  async create({ userId, type, fromUserId, fromName, postId, commentId, content }) {
    if (!userId || userId === fromUserId) return; // 不给自己发通知
    await db.query(`
      INSERT INTO notifications (user_id, type, from_user_id, from_name, post_id, comment_id, content)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, type, fromUserId || null, fromName || '', postId || null, commentId || null, content || '']);
  },

  async listFor(userId, { limit = 50 } = {}) {
    const [rows] = await db.query(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC, id DESC
      LIMIT ?
    `, [userId, limit]);
    return rows;
  },

  async unreadCount(userId) {
    const [rows] = await db.query(
      'SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    return Number(rows[0].c);
  },

  async markRead(userId, id) {
    if (id === 'all') {
      await db.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
      return;
    }
    await db.query('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND id = ?', [userId, Number(id)]);
  },
};

// 解析文本中的 @用户名，返回提及的用户 id 列表
export async function extractMentions(text) {
  const names = [...new Set(String(text || '').match(/@([\u4e00-\u9fa5\w]{2,30})/g) || [])]
    .map(m => m.slice(1));
  if (!names.length) return [];
  const placeholders = names.map(() => '?').join(',');
  const [rows] = await db.query(
    `SELECT id, username, nickname FROM users WHERE username IN (${placeholders})`,
    names
  );
  return rows;
}
