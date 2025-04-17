import express from 'express';
import * as authController from '../controllers/authController.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/send-code', authController.sendCode);
router.post('/verify-2fa', authController.verifyOTP); // atualizado

export default router;
