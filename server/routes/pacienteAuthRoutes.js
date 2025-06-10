import express from 'express';
import { registrarPaciente, loginPaciente } from '../controllers/pacienteAuthController.js';

const router = express.Router();

router.post('/register', registrarPaciente);
router.post('/login', loginPaciente);

export default router;
