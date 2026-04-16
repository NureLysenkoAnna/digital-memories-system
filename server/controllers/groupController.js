const GroupService = require('../services/groupService');

class GroupController {
  static async createGroup(req, res) {
    try {
      const { name, description, coverImageUrl } = req.body;
      const userId = req.user.id;

      if (!name) {
        return res.status(400).json({ error: 'Назва групи є обов\'язковою' });
      }

      const newGroup = await GroupService.createGroup(name, description, coverImageUrl, userId);
      res.status(201).json(newGroup);
    } catch (error) {
      console.error('Помилка створення групи:', error);
      res.status(500).json({ error: 'Помилка сервера при створенні групи' });
    }
  }

  static async getUserGroups(req, res) {
    try {
      const userId = req.user.id;
      const groups = await GroupService.getUserGroups(userId);
      res.json(groups);
    } catch (error) {
      console.error('Помилка отримання груп:', error);
      res.status(500).json({ error: 'Помилка сервера при отриманні груп' });
    }
  }

  static async toggleFavorite(req, res) {
    try {
      const { groupId } = req.params;
      const userId = req.user.id;

      const updatedStatus = await GroupService.toggleFavorite(userId, groupId);
      res.json(updatedStatus);
    } catch (error) {
      console.error('Помилка оновлення статусу обраного:', error);
      res.status(500).json({ error: 'Помилка сервера' });
    }
  }

  static async getGroupDetails(req, res) {
    try {
      const { groupId } = req.params;
      const userId = req.user.id;

      const groupDetails = await GroupService.getGroupDetails(groupId, userId);
      res.json(groupDetails);
    } catch (error) {
      console.error('Помилка отримання деталей групи:', error);
      if (error.message.includes('немає доступу')) {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Помилка сервера' });
    }
  }

  static async updateGroup(req, res) {
    try {
      const { groupId } = req.params;
      const { name, description, coverImageUrl } = req.body;
      const userId = req.user.id;

      if (!name) {
        return res.status(400).json({ error: 'Назва групи є обов\'язковою' });
      }

      const updatedGroup = await GroupService.updateGroup(groupId, userId, name, description, coverImageUrl);
      res.json(updatedGroup);
    } catch (error) {
      console.error('Помилка оновлення групи:', error);
      if (error.message.includes('немає прав')) {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Помилка сервера' });
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
      
      res.json({ message: 'Групу успішно видалено назавжди' });
    } catch (error) {
      console.error('Помилка видалення групи:', error);
      if (error.message.includes('немає прав')) {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Помилка сервера' });
    }
  }
}

module.exports = GroupController;