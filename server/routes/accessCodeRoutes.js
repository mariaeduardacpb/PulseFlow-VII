import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { 
  gerarCodigoAcesso, 
  verificarCodigoAcesso, 
  testConnection, 
  notificarSolicitacaoAcesso,
  buscarSolicitacoesPendentes,
  marcarSolicitacaoVisualizada,
  buscarTodasSolicitacoes
} from '../controllers/accessCodeController.js';

const router = express.Router();

// Gerar código de acesso para o paciente
router.post('/gerar', gerarCodigoAcesso);

// Verificar se código de acesso é válido
router.post('/verificar', verificarCodigoAcesso);

// Notificar paciente sobre solicitação de acesso médico
router.post('/notificar-solicitacao', notificarSolicitacaoAcesso);

// Buscar solicitações pendentes de um paciente
router.get('/solicitacoes/:patientId', buscarSolicitacoesPendentes);

// Marcar solicitação como visualizada
router.put('/solicitacoes/:solicitacaoId/visualizar', marcarSolicitacaoVisualizada);

// Buscar todas as solicitações de acesso do médico logado
router.get('/solicitacoes', authMiddleware, buscarTodasSolicitacoes);

// Teste de conexão
router.get('/test', testConnection);

export default router;
