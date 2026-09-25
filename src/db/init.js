import db from './index.js';

function addColumnIfMissing(table, column, ddl) {
  const cols = db.pragma(`table_info(${table})`).map(c => c.name);
  if (!cols.includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl};`);
    console.log(`→ ${table} 表新增列: ${column}`);
  }
}

addColumnIfMissing('posts', 'author_id', 'author_id INTEGER');
addColumnIfMissing('posts', 'images',   "images TEXT NOT NULL DEFAULT '[]'");
addColumnIfMissing('posts', 'upvotes',  'upvotes INTEGER NOT NULL DEFAULT 0');
addColumnIfMissing('posts', 'pinned',   'pinned INTEGER NOT NULL DEFAULT 0');
addColumnIfMissing('posts', 'featured', 'featured INTEGER NOT NULL DEFAULT 0');
addColumnIfMissing('posts', 'category', "category TEXT NOT NULL DEFAULT ''");
addColumnIfMissing('comments', 'author_id', 'author_id INTEGER');
addColumnIfMissing('comments', 'upvotes',  'upvotes INTEGER NOT NULL DEFAULT 0');
addColumnIfMissing('users', 'role',     "role TEXT NOT NULL DEFAULT 'user'");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    nickname      TEXT    NOT NULL DEFAULT '',
    avatar         TEXT    NOT NULL DEFAULT '',
    role          TEXT    NOT NULL DEFAULT 'user',
    created_at    TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS post_likes (
    post_id   INTEGER NOT NULL,
    user_id   INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    PRIMARY KEY (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS comment_likes (
    comment_id INTEGER NOT NULL,
    user_id    INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    PRIMARY KEY (comment_id, user_id),
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    type         TEXT    NOT NULL,
    from_user_id INTEGER,
    from_name    TEXT    NOT NULL DEFAULT '',
    post_id      INTEGER,
    comment_id   INTEGER,
    content      TEXT    NOT NULL DEFAULT '',
    is_read      INTEGER NOT NULL DEFAULT 0,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_posts_created  ON posts(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_comments_post  ON comments(post_id);
  CREATE INDEX IF NOT EXISTS idx_posts_upvotes  ON posts(upvotes DESC);
  CREATE INDEX IF NOT EXISTS idx_posts_pinned   ON posts(pinned DESC);
  CREATE INDEX IF NOT EXISTS idx_notify_user    ON notifications(user_id, is_read);
`);

console.log('✅ 论坛数据库初始化完成');
