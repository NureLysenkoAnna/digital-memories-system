const express = require('express');
const GroupController = require('../controllers/groupController');
const GroupMemberController = require('../controllers/groupMemberController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/invite/:token/verify', GroupMemberController.verifyInvite);

router.use(authMiddleware);

router.post('/invite/:token/accept', authMiddleware, GroupMemberController.acceptInvite);

router.post('/', GroupController.createGroup);
router.get('/', GroupController.getUserGroups);
router.get('/:groupId', GroupController.getGroupDetails);
router.put('/:groupId', GroupController.updateGroup);
router.delete('/:groupId', GroupController.deleteGroup);
router.patch('/:groupId/favorite', GroupController.toggleFavorite);

module.exports = router;