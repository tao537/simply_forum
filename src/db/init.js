import db from './index.js';

db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    title        TEXT    NOT NULL,
    content      TEXT    NOT NULL,
    author_name  TEXT    NOT NULL DEFAULT '匿名',
    views        INTEGER NOT NULL DEFAULT 0,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at   TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS comments (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id      INTEGER NOT NULL,
    content      TEXT    NOT NULL,
    author_name  TEXT    NOT NULL DEFAULT '匿名',
    created_at   TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_posts_created  ON posts(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_comments_post  ON comments(post_id);
`);

console.log('✅ 论坛数据库初始化完成');
