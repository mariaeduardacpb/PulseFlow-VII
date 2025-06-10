import express from 'express';
import { salvarCiclo, listarCiclos, debugCiclos } from '../controllers/cicloController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/novo', authMiddleware, salvarCiclo);
router.get('/:cpf', authMiddleware, listarCiclos);
router.get('/debug/:cpf', authMiddleware, debugCiclos);

export default router;
