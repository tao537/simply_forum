import { Router } from 'express';
import { notificationController } from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, notificationController.list);
router.get('/unread', requireAuth, notificationController.unread);
router.post('/:id/read', requireAuth, notificationController.markRead);

export default router;
