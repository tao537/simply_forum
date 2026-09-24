import { Router } from 'express';
import { commentController } from '../controllers/commentController.js';

const router = Router();
router.delete('/:id', commentController.remove);
export default router;
