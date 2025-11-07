import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { gerarInsightsPaciente, responderPergunta } from '../controllers/geminiController.js';

const router = express.Router();

// Rota para gerar insights do paciente usando Gemini AI
router.get('/insights/:cpf', authMiddleware, gerarInsightsPaciente);

// Rota para responder perguntas do médico sobre o paciente
router.post('/pergunta/:cpf', authMiddleware, responderPergunta);

export default router;

