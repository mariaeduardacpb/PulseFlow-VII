import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { authPacienteMiddleware } from '../middlewares/pacienteAuthMiddleware.js';
import {
  registrarEnxaqueca,
  buscarEnxaquecaPaciente,
  buscarEnxaquecaMedico
} from '../controllers/enxaquecaController.js';

const router = express.Router();

// Paciente registra sua enxaqueca
router.post('/register', authPacienteMiddleware, registrarEnxaqueca);

// Médico busca dados de um paciente pelo CPF
router.get('/medico', authMiddleware, buscarEnxaquecaPaciente);

// Paciente busca os próprios dados
router.get('/paciente', authPacienteMiddleware, buscarEnxaquecaMedico);

export default router;