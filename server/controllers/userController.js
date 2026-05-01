const UserService = require('../services/userService');
const { sendSafeError } = require('../utils/errorHandler');

class UserController {
  static async getProfile(req, res) {
    try {
      const userProfile = await UserService.getUserProfile(req.user.id);
      res.json(userProfile);
    } catch (error) {
      sendSafeError(res, error, 404);
    }
  }

  static async updateProfile(req, res) {
    try {
      const { username, bio, avatarUrl } = req.body;
      const userId = req.user.id;

      if (!username) {
        return res.status(400).json({ error: 'USER_NAME_REQUIRED' });
      }

      const updatedUser = await UserService.updateUserProfile(userId, username, bio, avatarUrl);
      res.json(updatedUser);
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: 'USER_UPDATE_FAILED' });
    }
  }

  static async updateLanguage(req, res) {
    try {
      const { language } = req.body;
      const userId = req.user.id;

      if (!language) {
        return res.status(400).json({ error: 'USER_LANGUAGE_REQUIRED' });
      }

      const updated = await UserService.updateUserLanguage(userId, language);
      
      res.json({ message: 'USER_LANGUAGE_UPDATED', language: updated.language });
    } catch (error) {
      sendSafeError(res, error, 400);
    }
  }
}

module.exports = UserController;