const PostService = require('../services/postService');

class PostController {
  static async createPost(req, res) {
    try {
      const { groupId, content, tags, eventDate, imageUrls } = req.body;
      const authorId = req.user.id;

      if (!groupId) {
        return res.status(400).json({ error: 'ID групи є обов\'язковим' });
      }

      const newPost = await PostService.createPost(
        groupId, 
        authorId, 
        content, 
        tags, 
        eventDate, 
        imageUrls
      );

      // Відправка сповіщення через WebSockets
      const io = req.app.get('io');
      io.emit('new_post', { groupId: groupId });

      res.status(201).json(newPost);
    } catch (error) {
      console.error('Помилка створення публікації:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async togglePin(req, res) {
    try {
      const { postId } = req.params;
      const { groupId } = req.body;
      const userId = req.user.id;

      if (!groupId) {
        return res.status(400).json({ error: 'ID групи є обов\'язковим для цієї дії' });
      }

      const isPinned = await PostService.togglePin(postId, groupId, userId);
      
      res.json({ 
        isPinned, 
        message: isPinned ? 'Публікацію закріплено' : 'Публікацію відкріплено' 
      });
    } catch (error) {
      console.error('Помилка закріплення публікації:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async getGroupPosts(req, res) {
    try {
      const { groupId } = req.params;
      const { sortBy, search, limit, offset } = req.query

      const parsedLimit = parseInt(limit) || 10;
      const parsedOffset = parseInt(offset) || 0;

      const posts = await PostService.getGroupPosts(groupId, sortBy, search, parsedLimit, parsedOffset);
      res.json(posts);
    } catch (error) {
      console.error('Помилка отримання публікацій:', error);
      res.status(500).json({ error: 'Помилка сервера' });
    }
  }

  static async deletePost(req, res) {
    try {
      const { postId } = req.params;
      const { groupId } = req.body; 
      const userId = req.user.id;

      await PostService.deletePost(postId, userId, groupId);
      res.json({ message: 'Публікацію успішно видалено' });
    } catch (error) {
      console.error('Помилка видалення публікації:', error);
      res.status(403).json({ error: error.message });
    }
  }

  static async getComments(req, res) {
    try {
      const comments = await PostService.getComments(req.params.postId);
      res.json(comments);
    } catch (error) { res.status(500).json({ error: error.message }); }
  }

  static async addComment(req, res) {
    try {
      const newComment = await PostService.addComment(req.params.postId, req.user.id, req.body.content);
      res.status(201).json(newComment);
    } catch (error) { res.status(400).json({ error: error.message }); }
  }

  static async toggleReaction(req, res) {
    try {
      const result = await PostService.toggleReaction(req.params.postId, req.user.id, req.body.reaction);
      res.json(result);
    } catch (error) { res.status(400).json({ error: error.message }); }
  }

  static async getMemoriesData(req, res) {
    try {
      const { groupId } = req.params;
      const { role } = req.query;
      const userId = req.user.id;

      // обидва сервіси паралельно виконуються
      const [milestones, calendarMemories] = await Promise.all([
        PostService.getPersonalMilestones(groupId, userId, role),
        PostService.getCalendarMemories(groupId)
      ]);

      res.json({
        milestones: milestones,
        calendarMemories: calendarMemories
      });

    } catch (error) {
      console.error('Помилка отримання спогадів:', error);
      res.status(500).json({ error: 'Помилка сервера' });
    }
  }
}

module.exports = PostController;