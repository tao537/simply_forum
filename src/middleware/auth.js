import jwt from 'jsonwebtoken';
import db from '../db/index.js';

const SECRET = process.env.JWT_SECRET || 'forum-dev-secret-change-me';

export function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: '7d' });
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    return res.status(401).json({ message: '请先登录' });
  }

  try {
    const payload = jwt.verify(token, SECRET);
    const user = db.prepare(
      'SELECT id, username, nickname, avatar, role, created_at FROM users WHERE id = ?'
    ).get(payload.id);
    if (!user) return res.status(401).json({ message: '登录状态无效' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: '登录已过期，请重新登录' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: '请先登录' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: '需要管理员权限' });
  }
  next();
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (token) {
    try {
      const payload = jwt.verify(token, SECRET);
      const user = db.prepare(
        'SELECT id, username, nickname, avatar, role, created_at FROM users WHERE id = ?'
      ).get(payload.id);
      if (user) req.user = user;
    } catch { /* 忽略无效 token */ }
  }
  next();
}
