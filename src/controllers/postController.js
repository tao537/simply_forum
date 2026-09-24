import { postService } from '../services/postService.js';

export const postController = {
  list(req, res) {
    const page = Number(req.query.page) || 1;
    const size = Math.min(Number(req.query.size) || 10, 100);
    const keyword = req.query.keyword || '';
    res.json(postService.list({ page, size, keyword }));
  },

  detail(req, res) {
    const post = postService.findById(Number(req.params.id));
    if (!post) return res.status(404).json({ message: '帖子不存在' });
    res.json(post);
  },

  create(req, res) {
    const post = postService.create(req.body);
    res.status(201).json(post);
  },

  remove(req, res) {
    const ok = postService.remove(Number(req.params.id));
    if (!ok) return res.status(404).json({ message: '帖子不存在' });
    res.status(204).end();
  },
};
