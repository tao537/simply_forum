import { notificationService } from '../services/notificationService.js';

export const notificationController = {
  async list(req, res) {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const items = await notificationService.listFor(req.user.id, { limit });
    res.json({ items });
  },

  async unread(req, res) {
    res.json({ count: await notificationService.unreadCount(req.user.id) });
  },

  async markRead(req, res) {
    await notificationService.markRead(req.user.id, req.params.id);
    res.json({ ok: true, unread: await notificationService.unreadCount(req.user.id) });
  },
};
