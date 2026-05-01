const GroupMemberService = require('../services/groupMemberService');
const { sendSafeError } = require('../utils/errorHandler');

class GroupMemberController {
  static async getMembers(req, res) {
    try {
      const { groupId } = req.params;
      const members = await GroupMemberService.getGroupMembers(groupId);
      res.json(members);
    } catch (error) {
      sendSafeError(res, error, 400);
    }
  }

  static async updateRole(req, res) {
    try {
      const { groupId, userId } = req.params;
      const { role } = req.body;
      const adminId = req.user.id;

      const updatedMember = await GroupMemberService.updateMemberRole(groupId, adminId, userId, role);
      res.json({ message: 'MEMBER_ROLE_UPDATED_SUCCESS', member: updatedMember });
    } catch (error) {
      sendSafeError(res, error, 403);
    }
  }

  static async removeMember(req, res) {
    try {
      const { groupId, userId } = req.params;
      const requesterId = req.user.id;

      const result = await GroupMemberService.removeMember(groupId, requesterId, userId);

      // WebSockets сповіщення про видалення учасника 
      const io = req.app.get('io');
      io.emit('member_removed', { groupId, removedUserId: userId });

      res.json(result);
    } catch (error) {
      sendSafeError(res, error, 403);
    }
  }

  static async inviteMember(req, res) {
    try {
      const { groupId } = req.params;
      const { email, role } = req.body;
      const adminId = req.user.id;

      if (!email) {
        return res.status(400).json({ error: 'INVITE_EMAIL_REQUIRED' });
      }

      const result = await GroupMemberService.sendInvitation(groupId, adminId, email, role || 'member');
      res.json(result);
    } catch (error) {
      sendSafeError(res, error, 400);
    }
  }

  static async verifyInvite(req, res) {
    try {
      const { token } = req.params;
      const inviteInfo = await GroupMemberService.verifyInvitation(token);
      res.json(inviteInfo);
    } catch (error) {
      sendSafeError(res, error, 400);
    }
  }

  static async acceptInvite(req, res) {
    try {
      const { token } = req.params;
      const userId = req.user.id;

      const result = await GroupMemberService.acceptInvitation(token, userId);
      res.json(result);
    } catch (error) {
      sendSafeError(res, error, 400);
    }
  }
}

module.exports = GroupMemberController;