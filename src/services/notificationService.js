import db from '../db/index.js';

export const notificationService = {
  create({ userId, type, fromUserId, fromName, postId, commentId, content }) {
    if (!userId || userId === fromUserId) return; // 不给自己发通知
    db.prepare(`
      INSERT INTO notifications (user_id, type, from_user_id, from_name, post_id, comment_id, content)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, type, fromUserId || null, fromName || '', postId || null, commentId || null, content || '');
  },

  listFor(userId, { limit = 50 } = {}) {
    return db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC, id DESC
      LIMIT ?
    `).all(userId, limit);
  },

  unreadCount(userId) {
    return db.prepare(
      'SELECT COUNT(*) c FROM notifications WHERE user_id = ? AND is_read = 0'
    ).get(userId).c;
  },

  markRead(userId, id) {
    if (id === 'all') {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
      return;
    }
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND id = ?')
      .run(userId, Number(id));
  },
};

// 解析文本中的 @用户名，返回提及的用户 id 列表
export function extractMentions(text) {
  const names = [...new Set(String(text || '').match(/@([\u4e00-\u9fa5\w]{2,30})/g) || [])]
    .map(m => m.slice(1));
  if (!names.length) return [];
  const placeholders = names.map(() => '?').join(',');
  return db.prepare(`SELECT id, username, nickname FROM users WHERE username IN (${placeholders})`)
    .all(...names);
}
