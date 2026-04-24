const express = require('express');
const AuthController = require('../controllers/authController');

const router = express.Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/google', AuthController.googleLogin);
router.post('/forgot-password', AuthController.forgotPassword);
router.get('/reset-password/:token', AuthController.verifyResetToken);
router.post('/reset-password', AuthController.resetPassword);

module.exports = router;