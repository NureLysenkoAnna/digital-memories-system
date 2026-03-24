const UserService = require('../services/userService');

class UserController {
  static async getProfile(req, res) {
    try {
      const userProfile = await UserService.getUserProfile(req.user.id);
      res.json(userProfile);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  static async updateProfile(req, res) {
    try {
      const { username, bio, avatarUrl } = req.body;
      const userId = req.user.id;

      if (!username) {
        return res.status(400).json({ error: "Ім'я користувача є обов'язковим" });
      }

      const updatedUser = await UserService.updateUserProfile(userId, username, bio, avatarUrl);
      res.json(updatedUser);
    } catch (error) {
      console.error('Помилка оновлення профілю:', error);
      res.status(500).json({ error: 'Помилка сервера при оновленні профілю' });
    }
  }
}

module.exports = UserController;