const pool = require('../config/db');

class UserService {
  static async getUserProfile(userId) {
    const result = await pool.query(
      'SELECT id, username, email, avatar_url, bio, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('USER_NOT_FOUND');
    }

    return result.rows[0];
  }

  static async updateUserProfile(userId, username, bio, avatarUrl) {
    const result = await pool.query(
      `UPDATE users 
       SET username = $1, bio = $2, avatar_url = COALESCE($3, avatar_url) 
       WHERE id = $4 
       RETURNING id, username, email, avatar_url, bio, created_at`,
      [username, bio, avatarUrl, userId]
    );
    return result.rows[0];
  }

  static async updateUserLanguage(userId, language) {
    if (!['uk', 'en'].includes(language)) {
      throw new Error('USER_INVALID_LANGUAGE');
    }

    const result = await pool.query(
      'UPDATE users SET language = $1 WHERE id = $2 RETURNING language',
      [language, userId]
    );

    return result.rows[0];
  }
}

module.exports = UserService;