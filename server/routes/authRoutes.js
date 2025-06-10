import express from 'express';
import * as authController from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import tokenService from '../services/tokenService.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/reset-password', authController.resetPassword);
router.post('/confirm-reset-password', authController.confirmResetPassword);
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOTP);

// Rota para refresh do token
router.post('/refresh-token', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Token não fornecido' });
    }

    const newToken = tokenService.refreshToken(token);
    res.json({ token: newToken });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar token' });
  }
});

export default router;
