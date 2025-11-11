import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { authPacienteMiddleware } from '../middlewares/pacienteAuthMiddleware.js';
import { verificarConexaoMedicoPaciente } from '../middlewares/verificarConexaoMedicoPaciente.js';
import {
  registrarInsonia,
  buscarInsoniaMedico,
  buscarInsoniaPaciente
} from '../controllers/insoniaController.js';

const router = express.Router();

// Rota para paciente registrar
router.post('/register', authPacienteMiddleware, registrarInsonia);

// Rota para médico buscar pelo CPF (verifica conexão ativa)
router.get('/medico', authMiddleware, verificarConexaoMedicoPaciente, buscarInsoniaMedico);

// Rota para paciente ver seus próprios dados
router.get('/paciente', authPacienteMiddleware, buscarInsoniaPaciente);

export default router;
