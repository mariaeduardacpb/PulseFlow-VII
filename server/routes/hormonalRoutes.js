import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { authPacienteMiddleware } from '../middlewares/pacienteAuthMiddleware.js';
import {
  registrarHormonal,
  buscarHormonalMedico,
  buscarHormonalPaciente
} from '../controllers/hormonalController.js';

const router = express.Router();

// Paciente registra
router.post('/register', authPacienteMiddleware, registrarHormonal);

// Médico busca por CPF
router.get('/medico', authMiddleware, buscarHormonalMedico);

// Paciente busca seus próprios dados
router.get('/paciente', authPacienteMiddleware, buscarHormonalPaciente);

export default router;
