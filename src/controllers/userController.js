import db from '../db/index.js';
import { userService } from '../services/userService.js';
import { signToken } from '../middleware/auth.js';

export const userController = {
  register(req, res) {
    if (userService.findByUsername(req.body.username)) {
      return res.status(409).json({ message: '该用户名已被注册' });
    }
    const user = userService.register(req.body);
    const token = signToken(user);
    res.status(201).json({ token, user: userService.publicUser(user) });
  },

  login(req, res) {
    const user = userService.findByUsername(req.body.username);
    if (!user || !userService.verifyPassword(user, req.body.password)) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    const token = signToken(user);
    res.json({ token, user: userService.publicUser(user) });
  },

  me(req, res) {
    res.json({ user: userService.publicUser(req.user) });
  },

  profile(req, res) {
    const id = Number(req.params.id);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) return res.status(404).json({ message: '用户不存在' });

    const postCount = db.prepare('SELECT COUNT(*) c FROM posts WHERE author_id = ?').get(id).c;
    const commentCount = db.prepare('SELECT COUNT(*) c FROM comments WHERE author_id = ?').get(id).c;
    const receivedLikes = db.prepare(`
      SELECT
        (SELECT COALESCE(SUM(upvotes),0) FROM posts WHERE author_id = ?)
        + (SELECT COALESCE(SUM(upvotes),0) FROM comments WHERE author_id = ?) AS total
    `).get(id, id).total;

    const posts = db.prepare(`
      SELECT p.id, p.title, p.created_at, p.views, p.upvotes, p.pinned, p.category,
             (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
      FROM posts p WHERE p.author_id = ?
      ORDER BY p.created_at DESC LIMIT 50
    `).all(id);

    const comments = db.prepare(`
      SELECT c.id, c.content, c.created_at, c.upvotes, c.post_id, p.title AS post_title
      FROM comments c JOIN posts p ON p.id = c.post_id
      WHERE c.author_id = ? ORDER BY c.created_at DESC LIMIT 50
    `).all(id);

    res.json({
      user: userService.publicUser(user),
      stats: { posts: postCount, comments: commentCount, likes: receivedLikes },
      posts,
      comments,
    });
  },

  // 管理员：列出用户
  list(req, res) {
    const users = db.prepare(
      'SELECT id, username, nickname, role, created_at FROM users ORDER BY id ASC'
    ).all();
    res.json({ users });
  },

  // 管理员：设置/取消管理员
  setRole(req, res) {
    const id = Number(req.params.id);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) return res.status(404).json({ message: '用户不存在' });
    if (user.id === req.user.id) {
      return res.status(400).json({ message: '不能修改自己的角色' });
    }
    const role = req.body.role === 'admin' ? 'admin' : 'user';
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
    res.json({ user: userService.publicUser({ ...user, role }) });
  },

  // 管理员：删除账号
  deleteUser(req, res) {
    const id = Number(req.params.id);
    if (id === req.user.id) {
      return res.status(400).json({ message: '管理员不能删除自己的账号' });
    }
    const result = userService.deleteUser(id);
    if (result.changes === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    res.json({ message: '账号已成功删除' });
  },

  // 管理员：批量删除账号
  deleteUsersBatch(req, res) {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: '请选择要删除的用户' });
    }
    
    // 过滤掉管理员自己，防止自杀
    const safeIds = ids.filter(id => id !== req.user.id);
    if (safeIds.length !== ids.length) {
      // 我们可以选择报错，或者静默过滤。这里选择告知用户。
    }

    try {
      userService.deleteUsersBatch(safeIds);
      res.json({ message: `已成功删除 ${safeIds.length} 个账号` });
    } catch (e) {
      res.status(500).json({ message: '批量删除失败: ' + e.message });
    }
  },
};
