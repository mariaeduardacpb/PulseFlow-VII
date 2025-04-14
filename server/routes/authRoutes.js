import express from 'express';
import * as authController from '../controllers/authController.js';
import { verifyOTP } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-otp', verifyOTP);


export default router;
