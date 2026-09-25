import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { postController } from '../controllers/postController.js';
import { commentController } from '../controllers/commentController.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, optionalAuth, requireAdmin } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(png|jpe?g|gif|webp|bmp|svg\+xml)$/i.test(file.mimetype);
    cb(ok ? null : new Error('仅支持图片文件'), ok);
  },
});

const router = Router();

const CATEGORIES = ['', '壁纸', '资源', '求助', '闲聊'];

const postSchema = z.object({
  title: z.string().trim().min(2, '标题至少 2 字').max(100, '标题最多 100 字'),
  content: z.string().trim().min(1, '内容不能为空').max(10000, '内容过长'),
  images: z.array(z.string().refine(
    v => /^https?:\/\//.test(v) || v.startsWith('/'),
    '图片地址必须是 URL 或 / 开头的路径'
  )).max(9).optional(),
  category: z.string().trim().max(20).optional(),
});

const commentSchema = z.object({
  content: z.string().trim().min(1, '评论不能为空').max(1000, '评论过长'),
});

router.get('/',          optionalAuth, postController.list);
router.get('/featured',  optionalAuth, postController.listFeatured);
router.get('/:id',       optionalAuth, postController.detail);
router.post('/',         requireAuth, validate(postSchema), postController.create);
router.put('/:id',       requireAuth, validate(postSchema), postController.update);
router.post('/:id/like', requireAuth, postController.toggleLike);
router.post('/:id/pin',  requireAuth, requireAdmin, postController.togglePin);
router.post('/:id/feature', requireAuth, requireAdmin, postController.toggleFeatured);
router.delete('/:id',    optionalAuth, postController.remove);
router.post('/:id/comments',    requireAuth, validate(commentSchema), commentController.create);
router.post('/:id/comments/:cid/like', requireAuth, commentController.toggleLike);
router.post('/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: '未收到文件' });
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

export { CATEGORIES };
export default router;
