import express from 'express';
import { criarEvento, buscarEventos, buscarEventoPorId } from '../controllers/eventoClinicoController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Criar novo evento clínico
router.post('/', authMiddleware, criarEvento);

// Buscar eventos de um paciente
router.get('/', authMiddleware, buscarEventos);

// Buscar um evento específico por ID
router.get('/:id', authMiddleware, buscarEventoPorId);

export default router; 