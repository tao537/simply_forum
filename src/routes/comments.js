import { Router } from 'express';
import { commentController } from '../controllers/commentController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();
router.delete('/:id', optionalAuth, commentController.remove);
export default router;
