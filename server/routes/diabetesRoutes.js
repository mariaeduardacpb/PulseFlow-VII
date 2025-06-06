// routes/diabetesRoutes.js
import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { authPacienteMiddleware } from '../middlewares/pacienteAuthMiddleware.js';
import {
  registrarDiabetes,
  buscarDiabetesMedico,
  buscarDiabetesPaciente
} from '../controllers/diabetesController.js';

const router = express.Router();

// Rota para paciente registrar glicemia
router.post('/register', authPacienteMiddleware, registrarDiabetes);

// Rota para médico buscar glicemia pelo CPF
router.get('/medico', authMiddleware, buscarDiabetesMedico);

// Rota para paciente ver seus próprios dados
router.get('/paciente', authPacienteMiddleware, buscarDiabetesPaciente);

export default router;
