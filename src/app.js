import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postRoutes from './routes/posts.js';
import commentRoutes from './routes/comments.js';
import userRoutes from './routes/users.js';
import notificationRoutes from './routes/notifications.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// 1. 基础中间件
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// 2. API 路由 (必须在静态资源之前或明确区分)
app.get('/api/test-route', (req, res) => res.json({ message: 'Route is working!' }));
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);

// === 页面便捷访问重定向 ===
app.get('/login', (req, res) => res.redirect('/login.html'));
app.get('/admin', (req, res) => res.redirect('/admin.html'));
app.get('/user', (req, res) => res.redirect('/user.html'));
// ========================

// 3. 静态资源挂载 (放在最后，避免拦截 /api 请求)
app.use(express.static(path.join(__dirname, '..', 'public')));

// 4. 兜底处理
app.get('/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));
app.use(notFound);
app.use(errorHandler);

export default app;
