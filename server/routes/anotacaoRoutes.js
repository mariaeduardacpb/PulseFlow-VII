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
import { verificarConexaoMedicoPaciente } from '../middlewares/verificarConexaoMedicoPaciente.js';
import { verificarConexaoPorAnotacaoId } from '../middlewares/verificarConexaoPorRegistroId.js';

const router = express.Router();

// 🔁 ESSA ROTA DEVE VIR PRIMEIRO (verifica conexão ativa)
router.get('/detalhe/:id', authMiddleware, verificarConexaoPorAnotacaoId, buscarAnotacaoPorId);

// ✅ Rota específica para médico buscar por CPF (verifica conexão ativa)
router.get('/medico', authMiddleware, verificarConexaoMedicoPaciente, buscarAnotacoesMedico);

// ✅ DEPOIS as outras (verifica conexão ativa)
router.get('/:cpf', authMiddleware, verificarConexaoMedicoPaciente, buscarAnotacoesPorPaciente);
router.get('/categorias', authMiddleware, buscarCategorias);
router.post('/nova', authMiddleware, verificarConexaoMedicoPaciente, salvarAnotacao);
router.delete('/:id', authMiddleware, verificarConexaoPorAnotacaoId, deleteAnotacao);

export default router;
