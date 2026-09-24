import { commentService } from '../services/commentService.js';

export const commentController = {
  create(req, res) {
    const postId = Number(req.params.id);
    const comment = commentService.create(postId, req.body);
    if (!comment) return res.status(404).json({ message: '帖子不存在' });
    res.status(201).json(comment);
  },

  remove(req, res) {
    const ok = commentService.remove(Number(req.params.id));
    if (!ok) return res.status(404).json({ message: '评论不存在' });
    res.status(204).end();
  },
};
