const PostService = require('../services/postService');
const { sendSafeError } = require('../utils/errorHandler');

class PostController {
  static async createPost(req, res) {
    try {
      const { groupId, content, tags, eventDate, imageUrls } = req.body;
      const authorId = req.user.id;

      if (!groupId) {
        return res.status(400).json({ error: 'POST_GROUP_ID_REQUIRED' });
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
      sendSafeError(res, error, 400);
    }
  }

  static async togglePin(req, res) {
    try {
      const { postId } = req.params;
      const { groupId } = req.body;
      const userId = req.user.id;

      if (!groupId) {
        return res.status(400).json({ error: 'POST_GROUP_ID_REQUIRED' });
      }

      const isPinned = await PostService.togglePin(postId, groupId, userId);
      
      res.json({ 
        isPinned, 
        message: isPinned ? 'POST_PINNED_SUCCESS' : 'POST_UNPINNED_SUCCESS' 
      });
    } catch (error) {
      sendSafeError(res, error, 400);
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
      console.error('Error fetching posts:', error);
      res.status(500).json({ error: 'POST_FETCH_FAILED' });
    }
  }

  static async deletePost(req, res) {
    try {
      const { postId } = req.params;
      const { groupId } = req.body; 
      const userId = req.user.id;

      await PostService.deletePost(postId, userId, groupId);
      res.json({ message: 'POST_DELETED_SUCCESS' });
    } catch (error) {
      sendSafeError(res, error, 403);
    }
  }

  static async getComments(req, res) {
    try {
      const comments = await PostService.getComments(req.params.postId);
      res.json(comments);
    } catch (error) { 
      sendSafeError(res, error, 400);
    }
  }

  static async addComment(req, res) {
    try {
      const newComment = await PostService.addComment(req.params.postId, req.user.id, req.body.content);
      res.status(201).json(newComment);
    } catch (error) { 
      sendSafeError(res, error, 400);
    }
  }

  static async toggleReaction(req, res) {
    try {
      const result = await PostService.toggleReaction(req.params.postId, req.user.id, req.body.reaction);
      res.json(result);
    } catch (error) { 
      sendSafeError(res, error, 400);
    }
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
      console.error('Error fetching memories:', error);
      res.status(500).json({ error: 'POST_MEMORIES_FETCH_FAILED' });
    }
  }
}

module.exports = PostController;