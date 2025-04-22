import express from 'express';
import * as authController from '../controllers/authController.js';
const router = express.Router();


router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/reset-password', authController.resetPassword);
router.post('/confirm-reset-password', authController.confirmResetPassword);
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOTP);

export default router;
