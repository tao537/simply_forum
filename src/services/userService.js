import bcrypt from 'bcryptjs';
import db from '../db/index.js';

const SALT_ROUNDS = 10;

export const userService = {
  findByUsername(username) {
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  },

  publicUser(user) {
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname || user.username,
      avatar: user.avatar,
      role: user.role || 'user',
      created_at: user.created_at,
    };
  },

  register({ username, password, nickname }) {
    const hash = bcrypt.hashSync(password, SALT_ROUNDS);
    // 第一个注册的用户自动成为管理员
    const isFirst = db.prepare('SELECT COUNT(*) c FROM users').get().c === 0;
    const role = isFirst ? 'admin' : 'user';
    const info = db.prepare(
      'INSERT INTO users (username, password_hash, nickname, role) VALUES (?, ?, ?, ?)'
    ).run(username, hash, nickname || username, role);
    return db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  },

  verifyPassword(user, password) {
    return bcrypt.compareSync(password, user.password_hash);
  },

  deleteUser(id) {
    db.prepare('DELETE FROM comments WHERE author_id = ?').run(id);
    db.prepare('DELETE FROM posts WHERE author_id = ?').run(id);
    return db.prepare('DELETE FROM users WHERE id = ?').run(id);
  },

  deleteUsersBatch(ids) {
    const transaction = db.transaction(() => {
      for (const id of ids) {
        db.prepare('DELETE FROM comments WHERE author_id = ?').run(id);
        db.prepare('DELETE FROM posts WHERE author_id = ?').run(id);
        db.prepare('DELETE FROM users WHERE id = ?').run(id);
      }
    });
    return transaction();
  },
};
