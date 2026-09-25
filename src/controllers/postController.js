import db from '../db/index.js';
import { postService } from '../services/postService.js';
import { notificationService, extractMentions } from '../services/notificationService.js';

export const postController = {
  list(req, res) {
    const page = Number(req.query.page) || 1;
    const size = Math.min(Number(req.query.size) || 10, 100);
    const keyword = req.query.keyword || '';
    const sort = req.query.sort || 'new';
    const category = req.query.category || '';
    res.json(postService.list({ page, size, keyword, sort, category, userId: req.user?.id }));
  },

  listFeatured(req, res) {
    res.json({ rows: postService.listFeatured(req.user?.id) });
  },

  detail(req, res) {
    const post = postService.findById(Number(req.params.id), req.user?.id);
    if (!post) return res.status(404).json({ message: '帖子不存在' });
    res.json(post);
  },

  create(req, res) {
    const body = req.body;
    const images = (body.images || []).filter(Boolean).slice(0, 9);
    const post = postService.create({
      title: body.title,
      content: body.content,
      author_id: req.user?.id,
      author_name: req.user?.nickname || req.user?.username || body.author_name,
      images,
      category: body.category || '',
    });
    // @提及通知
    for (const u of extractMentions(body.content + ' ' + body.title)) {
      notificationService.create({
        userId: u.id,
        type: 'mention',
        fromUserId: req.user.id,
        fromName: req.user.nickname || req.user.username,
        postId: post.id,
        content: `${req.user.nickname || req.user.username} 在帖子「${body.title}」中提到了你`,
      });
    }
    res.status(201).json(post);
  },

  update(req, res) {
    const result = postService.update(
      Number(req.params.id), req.body, req.user?.id, req.user?.role === 'admin'
    );
    if (result.status === 404) return res.status(404).json({ message: '帖子不存在' });
    if (result.status === 403) return res.status(403).json({ message: '无权编辑该帖子' });
    const post = postService.findById(Number(req.params.id), req.user?.id);
    res.json(post);
  },

  toggleLike(req, res) {
    const result = postService.toggleLike(Number(req.params.id), req.user.id);
    if (!result) return res.status(404).json({ message: '帖子不存在' });
    const post = db.prepare('SELECT upvotes, author_id FROM posts WHERE id = ?').get(Number(req.params.id));
    // 点赞通知（仅点赞时通知，取消赞不通知）
    if (result.liked && post.author_id && post.author_id !== req.user.id) {
      notificationService.create({
        userId: post.author_id,
        type: 'like',
        fromUserId: req.user.id,
        fromName: req.user.nickname || req.user.username,
        postId: Number(req.params.id),
        content: `${req.user.nickname || req.user.username} 赞了你的帖子`,
      });
    }
    res.json({ ...result, upvotes: post.upvotes });
  },

  togglePin(req, res) {
    const result = postService.togglePin(Number(req.params.id));
    if (!result) return res.status(404).json({ message: '帖子不存在' });
    res.json(result);
  },

  toggleFeatured(req, res) {
    const result = postService.toggleFeatured(Number(req.params.id));
    if (!result) return res.status(404).json({ message: '帖子不存在' });
    res.json(result);
  },

  remove(req, res) {
    const result = postService.remove(Number(req.params.id), req.user?.id, req.user?.role === 'admin');
    if (result.status === 404) return res.status(404).json({ message: '帖子不存在' });
    if (result.status === 403) return res.status(403).json({ message: '无权删除该帖子' });
    res.status(204).end();
  },
};
