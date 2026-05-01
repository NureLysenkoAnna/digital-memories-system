const GroupService = require('../services/groupService');
const { sendSafeError } = require('../utils/errorHandler');

class GroupController {
  static async createGroup(req, res) {
    try {
      const { name, description, coverImageUrl } = req.body;
      const userId = req.user.id;

      if (!name) {
        return res.status(400).json({ error: 'GROUP_NAME_REQUIRED' });
      }

      const newGroup = await GroupService.createGroup(name, description, coverImageUrl, userId);
      res.status(201).json(newGroup);
    } catch (error) {
      console.error('Group creation error:', error);
      res.status(500).json({ error: 'GROUP_CREATE_FAILED' });
    }
  }

  static async getUserGroups(req, res) {
    try {
      const userId = req.user.id;
      const groups = await GroupService.getUserGroups(userId);
      res.json(groups);
    } catch (error) {
      console.error('Group fetch error:', error);
      res.status(500).json({ error: 'GROUP_FETCH_FAILED' });
    }
  }

  static async toggleFavorite(req, res) {
    try {
      const { groupId } = req.params;
      const userId = req.user.id;

      const updatedStatus = await GroupService.toggleFavorite(userId, groupId);
      res.json(updatedStatus);
    } catch (error) {
      sendSafeError(res, error, 400);
    }
  }

  static async getGroupDetails(req, res) {
    try {
      const { groupId } = req.params;
      const userId = req.user.id;

      const groupDetails = await GroupService.getGroupDetails(groupId, userId);
      res.json(groupDetails);
    } catch (error) {
      if (error.message === 'GROUP_NOT_FOUND_OR_NO_ACCESS') {
        return res.status(403).json({ error: error.message });
      }
      
      sendSafeError(res, error, 400);
    }
  }

  static async updateGroup(req, res) {
    try {
      const { groupId } = req.params;
      const { name, description, coverImageUrl } = req.body;
      const userId = req.user.id;

      if (!name) {
        return res.status(400).json({ error: 'GROUP_NAME_REQUIRED' });
      }

      const updatedGroup = await GroupService.updateGroup(groupId, userId, name, description, coverImageUrl);
      res.json(updatedGroup);
    } catch (error) {
      if (error.message === 'GROUP_ADMIN_ROLE_REQUIRED') {
        return res.status(403).json({ error: error.message });
      }
      
      sendSafeError(res, error, 400);
    }
  }

  static async deleteGroup(req, res) {
    try {
      const { groupId } = req.params;
      const userId = req.user.id;

      await GroupService.deleteGroup(groupId, userId);

      // WebSockets сповіщення про видалення групи
      const io = req.app.get('io');
      io.emit('group_deleted', { groupId });
      
      res.json({ message: 'GROUP_DELETED_SUCCESS' });
    } catch (error) {
      console.error('Group deletion error:', error);
      if (error.message === 'GROUP_ADMIN_ROLE_REQUIRED') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'GROUP_DELETE_FAILED' });
    }
  }
}

module.exports = GroupController;