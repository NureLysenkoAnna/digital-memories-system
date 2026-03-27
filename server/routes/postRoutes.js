const express = require('express');
const router = express.Router();
const PostController = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, PostController.createPost);
router.delete('/:postId', authMiddleware, PostController.deletePost);
router.patch('/:postId/pin', authMiddleware, PostController.togglePin);
router.get('/group/:groupId', authMiddleware, PostController.getGroupPosts);
router.get('/:postId/comments', authMiddleware, PostController.getComments);
router.post('/:postId/comments', authMiddleware, PostController.addComment);
router.post('/:postId/reactions', authMiddleware, PostController.toggleReaction);

module.exports = router;