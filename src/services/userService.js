import bcrypt from 'bcryptjs';
import db from '../db/index.js';

const SALT_ROUNDS = 10;

export const userService = {
  async findByUsername(username) {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0];
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

  async register({ username, password, nickname }) {
    const hash = bcrypt.hashSync(password, SALT_ROUNDS);
    // 第一个注册的用户自动成为管理员
    const [cntRows] = await db.query('SELECT COUNT(*) AS c FROM users');
    const isFirst = Number(cntRows[0].c) === 0;
    const role = isFirst ? 'admin' : 'user';
    const [r] = await db.query(
      'INSERT INTO users (username, password_hash, nickname, role) VALUES (?, ?, ?, ?)',
      [username, hash, nickname || username, role]
    );
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [r.insertId]);
    return rows[0];
  },

  verifyPassword(user, password) {
    return bcrypt.compareSync(password, user.password_hash);
  },

  async deleteUser(id) {
    await db.query('DELETE FROM comments WHERE author_id = ?', [id]);
    await db.query('DELETE FROM posts WHERE author_id = ?', [id]);
    const [r] = await db.query('DELETE FROM users WHERE id = ?', [id]);
    return r; // r.affectedRows
  },

  async deleteUsersBatch(ids) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      for (const id of ids) {
        await conn.query('DELETE FROM comments WHERE author_id = ?', [id]);
        await conn.query('DELETE FROM posts WHERE author_id = ?', [id]);
        await conn.query('DELETE FROM users WHERE id = ?', [id]);
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },
};
