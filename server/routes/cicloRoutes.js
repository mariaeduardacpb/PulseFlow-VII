import express from 'express';
import { salvarCiclo, listarCiclos } from '../controllers/cicloController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/novo', authMiddleware, salvarCiclo);
router.get('/:cpf', authMiddleware, listarCiclos);

export default router;
