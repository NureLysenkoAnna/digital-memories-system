const GroupMemberService = require('../services/groupMemberService');

class GroupMemberController {
  static async getMembers(req, res) {
    try {
      const { groupId } = req.params;
      const members = await GroupMemberService.getGroupMembers(groupId);
      res.json(members);
    } catch (error) {
      console.error('Помилка отримання учасників:', error);
      res.status(500).json({ error: error.message || 'Помилка сервера' });
    }
  }

  static async updateRole(req, res) {
    try {
      const { groupId, userId } = req.params;
      const { role } = req.body;
      const adminId = req.user.id;

      const updatedMember = await GroupMemberService.updateMemberRole(groupId, adminId, userId, role);
      res.json({ message: 'Роль успішно оновлено', member: updatedMember });
    } catch (error) {
      console.error('Помилка зміни ролі:', error);
      res.status(403).json({ error: error.message });
    }
  }

  static async removeMember(req, res) {
    try {
      const { groupId, userId } = req.params;
      const requesterId = req.user.id;

      const result = await GroupMemberService.removeMember(groupId, requesterId, userId);
      res.json(result);
    } catch (error) {
      console.error('Помилка видалення учасника:', error);
      res.status(403).json({ error: error.message });
    }
  }

  static async inviteMember(req, res) {
    try {
      const { groupId } = req.params;
      const { email, role } = req.body;
      const adminId = req.user.id;

      if (!email) {
        return res.status(400).json({ error: 'Email обов\'язковий' });
      }

      const result = await GroupMemberService.sendInvitation(groupId, adminId, email, role || 'member');
      res.json(result);
    } catch (error) {
      console.error('Помилка відправки запрошення:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async verifyInvite(req, res) {
    try {
      const { token } = req.params;
      const inviteInfo = await GroupMemberService.verifyInvitation(token);
      res.json(inviteInfo);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async acceptInvite(req, res) {
    try {
      const { token } = req.params;
      const userId = req.user.id;

      const result = await GroupMemberService.acceptInvitation(token, userId);
      res.json(result);
    } catch (error) {
      console.error('Помилка прийняття запрошення:', error);
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = GroupMemberController;