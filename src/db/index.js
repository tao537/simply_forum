import mysql from 'mysql2/promise';
import 'dotenv/config';

// MySQL 连接池：从环境变量读取连接参数
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  // DATETIME/TIMESTAMP 以字符串返回，保持原 API 中 created_at 的 'YYYY-MM-DD HH:MM:SS' 格式
  dateStrings: true,
  // JSON 列以字符串返回（而非自动解析成对象），保持原 API 中 images 字段的字符串格式
  jsonStrings: true,
});

export default pool;
