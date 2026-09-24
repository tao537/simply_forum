import { Router } from 'express';
import { z } from 'zod';
import { postController } from '../controllers/postController.js';
import { commentController } from '../controllers/commentController.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const postSchema = z.object({
  title: z.string().trim().min(2, '标题至少 2 字').max(100, '标题最多 100 字'),
  content: z.string().trim().min(1, '内容不能为空').max(10000, '内容过长'),
  author_name: z.string().trim().max(30, '昵称最多 30 字').optional(),
});

const commentSchema = z.object({
  content: z.string().trim().min(1, '评论不能为空').max(1000, '评论过长'),
  author_name: z.string().trim().max(30).optional(),
});

router.get('/',       postController.list);
router.get('/:id',    postController.detail);
router.post('/',      validate(postSchema), postController.create);
router.delete('/:id', postController.remove);
router.post('/:id/comments', validate(commentSchema), commentController.create);

export default router;
