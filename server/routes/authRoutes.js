import express from 'express';
import * as authController from '../controllers/authController.js'; // Isso importa todas as funções de authController

const router = express.Router();

// Certifique-se de que resetPassword e confirmResetPassword estão no authController
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/reset-password', authController.resetPassword);  // Agora usa authController.resetPassword
router.post('/confirm-reset-password', authController.confirmResetPassword);  // Também precisa estar exportada

export default router;
