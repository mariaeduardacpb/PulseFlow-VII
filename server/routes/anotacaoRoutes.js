import express from 'express';
import { 
  salvarAnotacao, 
  buscarAnotacoesPorPaciente,
  buscarCategorias 
} from '../controllers/anotacaoController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/nova', authMiddleware, salvarAnotacao);
router.get('/:cpf', authMiddleware, buscarAnotacoesPorPaciente);
router.get('/categorias', authMiddleware, buscarCategorias);

export default router;