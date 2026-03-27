const express = require('express');
const router = express.Router({ mergeParams: true });
const GroupMemberController = require('../controllers/groupMemberController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, GroupMemberController.getMembers);
router.post('/invite', authMiddleware, GroupMemberController.inviteMember);
router.patch('/:userId/role', authMiddleware, GroupMemberController.updateRole);
router.delete('/:userId', authMiddleware, GroupMemberController.removeMember);

module.exports = router;