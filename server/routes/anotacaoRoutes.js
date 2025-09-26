import express from 'express';
import { 
  salvarAnotacao, 
  buscarAnotacoesPorPaciente,
  buscarCategorias,
  buscarAnotacaoPorId,
  deleteAnotacao,
  buscarAnotacoesMedico
} from '../controllers/anotacaoController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// 🔁 ESSA ROTA DEVE VIR PRIMEIRO
router.get('/detalhe/:id', authMiddleware, buscarAnotacaoPorId);

// ✅ Rota específica para médico buscar por CPF
router.get('/medico', authMiddleware, buscarAnotacoesMedico);

// ✅ DEPOIS as outras
router.get('/:cpf', authMiddleware, buscarAnotacoesPorPaciente);
router.get('/categorias', authMiddleware, buscarCategorias);
router.post('/nova', authMiddleware, salvarAnotacao);
router.delete('/:id', authMiddleware, deleteAnotacao);

export default router;
