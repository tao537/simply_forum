import Database from 'better-sqlite3';
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const dbPath = process.env.DB_PATH || './data/forum.db';
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;
