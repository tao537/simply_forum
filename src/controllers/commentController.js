import db from '../db/index.js';
import { commentService } from '../services/commentService.js';
import { notificationService, extractMentions } from '../services/notificationService.js';

export const commentController = {
  async create(req, res) {
    const postId = Number(req.params.id);
    const comment = await commentService.create(postId, {
      content: req.body.content,
      author_id: req.user?.id,
      author_name: req.user?.nickname || req.user?.username || req.body.author_name,
    });
    if (!comment) return res.status(404).json({ message: '帖子不存在' });

    const me = req.user?.nickname || req.user?.username || '匿名';
    const [postRows] = await db.query('SELECT author_id, title FROM posts WHERE id = ?', [postId]);
    const post = postRows[0];

    // 回复通知：评论者不是楼主时通知楼主
    if (post.author_id && post.author_id !== req.user?.id) {
      await notificationService.create({
        userId: post.author_id,
        type: 'reply',
        fromUserId: req.user?.id,
        fromName: me,
        postId,
        commentId: comment.id,
        content: `${me} 评论了你的帖子「${post.title}」：${req.body.content.slice(0, 50)}`,
      });
    }
    // @提及通知
    for (const u of await extractMentions(req.body.content)) {
      await notificationService.create({
        userId: u.id,
        type: 'mention',
        fromUserId: req.user?.id,
        fromName: me,
        postId,
        commentId: comment.id,
        content: `${me} 在评论中提到了你：${req.body.content.slice(0, 50)}`,
      });
    }

    res.status(201).json(comment);
  },

  async toggleLike(req, res) {
    const result = await commentService.toggleLike(Number(req.params.id), req.user.id);
    if (!result) return res.status(404).json({ message: '评论不存在' });
    const [commentRows] = await db.query('SELECT upvotes, author_id, post_id FROM comments WHERE id = ?', [Number(req.params.id)]);
    const comment = commentRows[0];
    if (result.liked && comment.author_id && comment.author_id !== req.user.id) {
      await notificationService.create({
        userId: comment.author_id,
        type: 'like',
        fromUserId: req.user.id,
        fromName: req.user.nickname || req.user.username,
        postId: comment.post_id,
        commentId: Number(req.params.id),
        content: `${req.user.nickname || req.user.username} 赞了你的评论`,
      });
    }
    res.json({ ...result, upvotes: comment.upvotes });
  },

  async remove(req, res) {
    const result = await commentService.remove(Number(req.params.id), req.user?.id, req.user?.role === 'admin');
    if (result.status === 404) return res.status(404).json({ message: '评论不存在' });
    if (result.status === 403) return res.status(403).json({ message: '无权删除他人的评论' });
    res.status(204).end();
  },
};
