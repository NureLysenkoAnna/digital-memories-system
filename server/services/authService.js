const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

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
      throw new Error('Користувач з такою поштою вже зареєстрований');
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
      throw new Error('Невірна пошта або пароль!');
    }

    const user = userResult.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      throw new Error('Невірна пошта або пароль!');
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
}

module.exports = AuthService;