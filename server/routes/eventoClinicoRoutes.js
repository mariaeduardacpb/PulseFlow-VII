import express from 'express';
import { criarEvento, buscarEventos, buscarEventosMedico, buscarEventoPorId } from '../controllers/eventoClinicoController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { verificarConexaoMedicoPaciente } from '../middlewares/verificarConexaoMedicoPaciente.js';
import { verificarConexaoPorEventoId } from '../middlewares/verificarConexaoPorRegistroId.js';

const router = express.Router();

// Criar novo evento clínico
router.post('/', authMiddleware, verificarConexaoMedicoPaciente, criarEvento);

// Buscar eventos de um paciente
router.get('/', authMiddleware, buscarEventos);

// Médico busca eventos de um paciente pelo CPF (verifica conexão ativa)
router.get('/medico', authMiddleware, verificarConexaoMedicoPaciente, buscarEventosMedico);

// Buscar um evento específico por ID (verifica conexão ativa)
router.get('/:id', authMiddleware, verificarConexaoPorEventoId, buscarEventoPorId);

export default router; 