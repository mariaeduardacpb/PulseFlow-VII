import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { gerarInsightsPaciente } from '../controllers/geminiController.js';

const router = express.Router();

// Rota para gerar insights do paciente usando Gemini AI
router.get('/insights/:cpf', authMiddleware, gerarInsightsPaciente);

export default router;

