import db from '../db/index.js';
import { postService } from '../services/postService.js';
import { notificationService, extractMentions } from '../services/notificationService.js';

export const postController = {
  async list(req, res) {
    const page = Number(req.query.page) || 1;
    const size = Math.min(Number(req.query.size) || 10, 100);
    const keyword = req.query.keyword || '';
    const sort = req.query.sort || 'new';
    const category = req.query.category || '';
    res.json(await postService.list({ page, size, keyword, sort, category, userId: req.user?.id }));
  },

  async listFeatured(req, res) {
    res.json({ rows: await postService.listFeatured(req.user?.id) });
  },

  async detail(req, res) {
    const post = await postService.findById(Number(req.params.id), req.user?.id);
    if (!post) return res.status(404).json({ message: '帖子不存在' });
    res.json(post);
  },

  async create(req, res) {
    const body = req.body;
    const images = (body.images || []).filter(Boolean).slice(0, 9);
    const post = await postService.create({
      title: body.title,
      content: body.content,
      author_id: req.user?.id,
      author_name: req.user?.nickname || req.user?.username || body.author_name,
      images,
      category: body.category || '',
    });
    // @提及通知
    for (const u of await extractMentions(body.content + ' ' + body.title)) {
      await notificationService.create({
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

  async update(req, res) {
    const result = await postService.update(
      Number(req.params.id), req.body, req.user?.id, req.user?.role === 'admin'
    );
    if (result.status === 404) return res.status(404).json({ message: '帖子不存在' });
    if (result.status === 403) return res.status(403).json({ message: '无权编辑该帖子' });
    const post = await postService.findById(Number(req.params.id), req.user?.id);
    res.json(post);
  },

  async toggleLike(req, res) {
    const result = await postService.toggleLike(Number(req.params.id), req.user.id);
    if (!result) return res.status(404).json({ message: '帖子不存在' });
    const [postRows] = await db.query('SELECT upvotes, author_id FROM posts WHERE id = ?', [Number(req.params.id)]);
    const post = postRows[0];
    // 点赞通知（仅点赞时通知，取消赞不通知）
    if (result.liked && post.author_id && post.author_id !== req.user.id) {
      await notificationService.create({
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

  async togglePin(req, res) {
    const result = await postService.togglePin(Number(req.params.id));
    if (!result) return res.status(404).json({ message: '帖子不存在' });
    res.json(result);
  },

  async toggleFeatured(req, res) {
    const result = await postService.toggleFeatured(Number(req.params.id));
    if (!result) return res.status(404).json({ message: '帖子不存在' });
    res.json(result);
  },

  async remove(req, res) {
    const result = await postService.remove(Number(req.params.id), req.user?.id, req.user?.role === 'admin');
    if (result.status === 404) return res.status(404).json({ message: '帖子不存在' });
    if (result.status === 403) return res.status(403).json({ message: '无权删除该帖子' });
    res.status(204).end();
  },
};
