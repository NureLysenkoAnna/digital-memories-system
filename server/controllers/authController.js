const AuthService = require('../services/authService');

class AuthController {
    static async register(req, res) {
        try {
            const { username, email, password } = req.body;
            const result = await AuthService.registerUser(username, email, password);
            res.status(201).json(result); 
        } catch (error) {
            
        }
    }
    
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await AuthService.loginUser(email, password);
            res.json(result);
        } catch (error) {
            res.status(401).json({ error: error.message });
        }
    }

    static async googleLogin(req, res) {
        try {
            const { googleToken } = req.body;
            const result = await AuthService.googleLogin(googleToken);
            res.json(result);
        } catch (error) {
            console.error('Помилка Google Auth:', error);
            res.status(401).json({ error: 'Помилка авторизації через Google. Перевірте токен.' });
        }
    }
}

module.exports = AuthController;