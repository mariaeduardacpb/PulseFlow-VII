import express from 'express';
import { criarEvento, buscarEventos, buscarEventosMedico, buscarEventoPorId } from '../controllers/eventoClinicoController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Criar novo evento clínico
router.post('/', authMiddleware, criarEvento);

// Buscar eventos de um paciente
router.get('/', authMiddleware, buscarEventos);

// Médico busca eventos de um paciente pelo CPF
router.get('/medico', authMiddleware, buscarEventosMedico);

// Buscar um evento específico por ID
router.get('/:id', authMiddleware, buscarEventoPorId);

export default router; 