const AuthService = require('../services/authService');

class AuthController {
    static async register(req, res) {
        try {
            const { username, email, password } = req.body;
            const result = await AuthService.registerUser(username, email, password);
            res.status(201).json(result); 
        } catch (error) {
            res.status(400).json({ error: error.message });
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

    static async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ error: "Введіть вашу електронну пошту" });
        
            const result = await AuthService.requestPasswordReset(email);
            res.json(result);
        } catch (error) {
            console.error("Помилка запиту на відновлення:", error);
            res.status(500).json({ error: "Не вдалося надіслати лист." });
        }
    }

    static async verifyResetToken(req, res) {
        try {
            const { token } = req.params;
            await AuthService.verifyResetToken(token);
            res.json({ valid: true });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
  }

    static async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;
            if (!token || !newPassword) {
                return res.status(400).json({ error: "Некоректні дані" });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ error: "Пароль має містити мінімум 6 символів" });
            }
            const result = await AuthService.resetPassword(token, newPassword);
            res.json(result);
        } catch (error) {
            console.error('Помилка скидання пароля:', error);

            if (error.message.includes('Посилання недійсне')) {
                return res.status(400).json({ error: error.message });
            }

            res.status(500).json({ error: 'Сталася помилка на сервері. Спробуйте пізніше.' });
        }
    }
}

module.exports = AuthController;