// routes/anotacaoRoutes.js
import express from 'express';
import { salvarAnotacao } from '../controllers/anotacaoController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rota protegida: salvar nova anotação
router.post('/nova', authMiddleware, salvarAnotacao);

export default router;
