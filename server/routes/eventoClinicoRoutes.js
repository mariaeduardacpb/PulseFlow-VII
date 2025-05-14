import express from 'express';
import { criarEvento, buscarEventos } from '../controllers/eventoClinicoController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Criar novo evento clínico
router.post('/', authMiddleware, criarEvento);

// Buscar eventos de um paciente
router.get('/', authMiddleware, buscarEventos);

export default router; 