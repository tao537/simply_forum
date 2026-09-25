import { Router } from 'express';
import { z } from 'zod';
import { userController } from '../controllers/userController.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

const registerSchema = z.object({
  username: z.string().trim().min(2, '用户名至少 2 字').max(30, '用户名最多 30 字')
    .regex(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, '用户名只能包含字母、数字、下划线或中文'),
  password: z.string().min(6, '密码至少 6 位').max(72, '密码最多 72 位'),
  nickname: z.string().trim().max(30, '昵称最多 30 字').optional(),
});

const loginSchema = z.object({
  username: z.string().trim().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
});

const roleSchema = z.object({
  role: z.enum(['admin', 'user']),
});

router.post('/register', validate(registerSchema), userController.register);
router.post('/login', validate(loginSchema), userController.login);
router.get('/me', requireAuth, userController.me);
router.get('/:id/profile', userController.profile);
router.get('/', requireAuth, requireAdmin, userController.list);
router.patch('/:id/role', requireAuth, requireAdmin, validate(roleSchema), userController.setRole);
router.delete('/:id', requireAuth, requireAdmin, userController.deleteUser);
router.post('/batch-delete', requireAuth, requireAdmin, userController.deleteUsersBatch);

export default router;
