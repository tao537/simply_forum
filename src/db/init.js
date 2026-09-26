import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pool from './index.js';

// ========== 第 1 步：建表（幂等；新库一步到位）==========
// 每句独立执行（避免 multipleStatements），统一 InnoDB + utf8mb4
const createStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    username      VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nickname      VARCHAR(255) NOT NULL DEFAULT '',
    avatar        TEXT NOT NULL DEFAULT '',
    role          VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS posts (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    title       VARCHAR(255) NOT NULL,
    content     TEXT NOT NULL,
    author_name VARCHAR(255) NOT NULL DEFAULT '匿名',
    author_id   INT NULL,
    views       INT NOT NULL DEFAULT 0,
    images      JSON NOT NULL DEFAULT ('[]'),
    upvotes     INT NOT NULL DEFAULT 0,
    pinned      INT NOT NULL DEFAULT 0,
    category    VARCHAR(255) NOT NULL DEFAULT '',
    featured    INT NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS comments (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    post_id     INT NOT NULL,
    content     TEXT NOT NULL,
    author_name VARCHAR(255) NOT NULL DEFAULT '匿名',
    author_id   INT NULL,
    upvotes     INT NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS post_likes (
    post_id    INT NOT NULL,
    user_id    INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS comment_likes (
    comment_id INT NOT NULL,
    user_id    INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (comment_id, user_id),
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS notifications (
    id           INT PRIMARY KEY AUTO_INCREMENT,
    user_id      INT NOT NULL,
    type         VARCHAR(50) NOT NULL,
    from_user_id INT NULL,
    from_name    VARCHAR(255) NOT NULL DEFAULT '',
    post_id      INT NULL,
    comment_id   INT NULL,
    content      TEXT NOT NULL DEFAULT '',
    is_read      INT NOT NULL DEFAULT 0,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_posts_upvotes ON posts(upvotes DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_posts_pinned  ON posts(pinned DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id)`,
  `CREATE INDEX IF NOT EXISTS idx_notify_user   ON notifications(user_id, is_read)`,
];

// ========== 第 2 步：补列（只对"老库"生效；新库全部跳过）==========
// 说明：table/column 都是硬编码，无 SQL 注入风险
async function addColumnIfMissing(table, column, ddl) {
  const [rows] = await pool.query(
    `SELECT 1 AS found FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  if (rows.length) return; // 列已存在，跳过
  await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN ${ddl}`);
  console.log(`→ ${table} 表新增列: ${column}`);
}

const patchColumns = [
  ['users', 'nickname', `nickname VARCHAR(255) NOT NULL DEFAULT ''`],
  ['users', 'avatar', `avatar TEXT NOT NULL DEFAULT ''`],
  ['users', 'role', `role VARCHAR(50) NOT NULL DEFAULT 'user'`],
  ['posts', 'author_id', `author_id INT NULL`],
  ['posts', 'images', `images JSON NOT NULL DEFAULT ('[]')`],
  ['posts', 'upvotes', `upvotes INT NOT NULL DEFAULT 0`],
  ['posts', 'pinned', `pinned INT NOT NULL DEFAULT 0`],
  ['posts', 'featured', `featured INT NOT NULL DEFAULT 0`],
  ['posts', 'category', `category VARCHAR(255) NOT NULL DEFAULT ''`],
  ['comments', 'author_id', `author_id INT NULL`],
  ['comments', 'upvotes', `upvotes INT NOT NULL DEFAULT 0`],
];

export async function initDb() {
  for (const stmt of createStatements) {
    await pool.query(stmt);
  }
  for (const [table, column, ddl] of patchColumns) {
    await addColumnIfMissing(table, column, ddl);
  }
  console.log('✅ 论坛数据库初始化完成');
}

// 直接运行 `node src/db/init.js` 时执行迁移
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  initDb()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('数据库初始化失败:', err.message);
      process.exit(1);
    });
}
