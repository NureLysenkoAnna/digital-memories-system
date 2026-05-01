const AuthService = require('../services/authService');
const { sendSafeError } = require('../utils/errorHandler');

class AuthController {
    static async register(req, res) {
        try {
            const { username, email, password } = req.body;
            const result = await AuthService.registerUser(username, email, password);
            res.status(201).json(result); 
        } catch (error) {
            sendSafeError(res, error, 400);
        }
    }
    
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await AuthService.loginUser(email, password);
            res.json(result);
        } catch (error) {
            sendSafeError(res, error, 401);
        }
    }

    static async googleLogin(req, res) {
        try {
            const { googleToken } = req.body;
            const result = await AuthService.googleLogin(googleToken);
            res.json(result);
        } catch (error) {
            console.error('Google Auth error:', error);
            res.status(401).json({ error: 'AUTH_GOOGLE_FAILED' });
        }
    }

    static async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ error: "AUTH_EMAIL_REQUIRED" });
        
            const result = await AuthService.requestPasswordReset(email);
            res.json(result);
        } catch (error) {
            sendSafeError(res, error, 400);
        }
    }

    static async verifyResetToken(req, res) {
        try {
            const { token } = req.params;
            await AuthService.verifyResetToken(token);
            res.json({ valid: true });
        } catch (error) {
            sendSafeError(res, error, 400);
        }
  }

    static async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;
            if (!token || !newPassword) {
                return res.status(400).json({ error: "AUTH_INVALID_DATA" });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ error: "AUTH_PASSWORD_TOO_SHORT" });
            }
            const result = await AuthService.resetPassword(token, newPassword);
            res.json(result);
        } catch (error) {
            sendSafeError(res, error, 400);
        }
    }
}

module.exports = AuthController;