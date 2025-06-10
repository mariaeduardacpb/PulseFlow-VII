import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { authPacienteMiddleware } from '../middlewares/pacienteAuthMiddleware.js';
import {
  registrarPressao,
  buscarPressaoMedico,
  buscarPressaoPaciente
} from '../controllers/pressaoArterialController.js';

const router = express.Router();

router.post('/register', authPacienteMiddleware, registrarPressao);
router.get('/medico', authMiddleware, buscarPressaoMedico);
router.get('/paciente', authPacienteMiddleware, buscarPressaoPaciente);

export default router;
