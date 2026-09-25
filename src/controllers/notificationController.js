import { notificationService } from '../services/notificationService.js';

export const notificationController = {
  list(req, res) {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const items = notificationService.listFor(req.user.id, { limit });
    res.json({ items });
  },

  unread(req, res) {
    res.json({ count: notificationService.unreadCount(req.user.id) });
  },

  markRead(req, res) {
    notificationService.markRead(req.user.id, req.params.id);
    res.json({ ok: true, unread: notificationService.unreadCount(req.user.id) });
  },
};
