const pool = require('../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const EmailService = require('./emailService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Допоміжна функція для генерації токена
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

class AuthService {
  // Реєстрація нового користувача
  static async registerUser(username, email, password) {

    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      throw new Error('AUTH_EMAIL_EXISTS');
    }

    const salt = await bcrypt.genSalt(10);
    const bcryptPassword = await bcrypt.hash(password, salt);

    const newUserResult = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, bcryptPassword]
    );

    const user = newUserResult.rows[0];
    
    const token = generateToken(user.id);
    
    return { user, token };
  }
  
  // Звичайна авторизація
  static async loginUser(email, password) {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      throw new Error('AUTH_INVALID_CREDENTIALS');
    }

    const user = userResult.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      throw new Error('AUTH_INVALID_CREDENTIALS');
    }

    const token = generateToken(user.id);
    return { user: { id: user.id, username: user.username, email: user.email }, token };
  }

  // Авторизація через Google
  static async googleLogin(googleToken) {
    const ticket = await googleClient.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    let userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    let user;

    if (userResult.rows.length === 0) {
        const randomPassword = await bcrypt.hash(googleId, 10);
        const newUserResult = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
            [name, email, randomPassword]
        );
        user = newUserResult.rows[0];
    } else {
        user = userResult.rows[0];
    }

    const token = generateToken(user.id);
    return { user: { id: user.id, username: user.username, email: user.email }, token };
  }

  // Створення запиту на відновлення
  static async requestPasswordReset(email) {
    const userRes = await pool.query('SELECT id, username, language FROM users WHERE email = $1', [email]);
    
    // Якщо користувача немає, ми все одно повертаємо успіх (щоб не розкривати базу хакерам)
    if (userRes.rows.length === 0) {
      return { message: 'AUTH_RESET_EMAIL_SENT' };
    }

    const user = userRes.rows[0];
    const userLang = user.language || 'uk';

    // Генерація безпечного випадкового токена (для листа)
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Створення SHA-256 хешу (для БД)
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Видалення старого токену
    await pool.query('DELETE FROM password_resets WHERE email = $1', [email]);
    
    // Збереження захешованого токену у бд
    await pool.query(
      'INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, $3)',
      [email, hashedToken, expiresAt]
    );

    // Відправлення листа
    const FRONTEND_URL = process.env.FRONTEND_URL;
    const resetLink = `${FRONTEND_URL}/reset-password/${resetToken}`;
    
    await EmailService.sendPasswordReset(email, user.username, resetLink, userLang);

    return { message: 'AUTH_RESET_EMAIL_SENT' };
  }

  // Перевірка дійсності токена
  static async verifyResetToken(token) {
    // Хешування отриманого з фронтенду токену
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const tokenRes = await pool.query(
      'SELECT email FROM password_resets WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP',
      [hashedToken]
    );

    if (tokenRes.rows.length === 0) {
      throw new Error('AUTH_RESET_TOKEN_INVALID');
    }

    return { valid: true, email: tokenRes.rows[0].email }; 
  }

  // Встановлення нового пароля
  static async resetPassword(token, newPassword) {
    const verification = await AuthService.verifyResetToken(token);
    const email = verification.email;

    // Хешування нового паролю
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hashedPassword, email]);

    await pool.query('DELETE FROM password_resets WHERE email = $1', [email]);

    return { message: 'AUTH_PASSWORD_RESET_SUCCESS' };
  }
}

module.exports = AuthService;