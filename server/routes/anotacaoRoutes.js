import express from 'express';
import { 
  salvarAnotacao, 
  buscarAnotacoesPorPaciente,
  buscarCategorias,
  buscarAnotacaoPorId
} from '../controllers/anotacaoController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// 🔁 ESSA ROTA DEVE VIR PRIMEIRO
router.get('/detalhe/:id', authMiddleware, buscarAnotacaoPorId);

// ✅ DEPOIS as outras
router.get('/:cpf', authMiddleware, buscarAnotacoesPorPaciente);
router.get('/categorias', authMiddleware, buscarCategorias);
router.post('/nova', authMiddleware, salvarAnotacao);

export default router;
