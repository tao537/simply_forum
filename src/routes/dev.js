import { Router } from 'express';
import pool from '../db/index.js';

const router = Router();

// 危险接口：仅在 NODE_ENV !== 'production' 或设置了 ALLOW_DEV_SEED=1 时启用
router.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_SEED !== '1') {
    return res.status(403).json({ message: 'dev routes disabled in production' });
  }
  next();
});

router.post('/seed', async (req, res) => {
  const data = req.body || {};
  const order = ['users', 'posts', 'comments', 'post_likes', 'comment_likes', 'notifications'];
  const report = {};

  try {
    await pool.query('SET FOREIGN_KEY_CHECKS=0');
    for (const table of order) {
      const rows = data[table];
      if (!Array.isArray(rows) || !rows.length) {
        report[table] = 0;
        continue;
      }
      let inserted = 0;
      for (const row of rows) {
        const cols = Object.keys(row);
        const colSql = cols.map(c => '`' + c + '`').join(',');
        const placeholders = cols.map(() => '?').join(',');
        const vals = cols.map(c => row[c]);
        try {
          await pool.query(
            'INSERT IGNORE INTO `' + table + '` (' + colSql + ') VALUES (' + placeholders + ')',
            vals
          );
          inserted++;
        } catch (e) {
          console.warn('插入失败 [' + table + ']:', e.message, JSON.stringify(row).slice(0, 200));
        }
      }
      report[table] = inserted;
    }
    await pool.query('SET FOREIGN_KEY_CHECKS=1');
    res.json({ ok: true, inserted: report });
  } catch (err) {
    try { await pool.query('SET FOREIGN_KEY_CHECKS=1'); } catch {}
    res.status(500).json({ message: err.message });
  }
});

export default router;
