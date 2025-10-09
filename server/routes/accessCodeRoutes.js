import express from 'express';
import { 
  gerarCodigoAcesso, 
  verificarCodigoAcesso, 
  testConnection, 
  notificarSolicitacaoAcesso,
  buscarSolicitacoesPendentes,
  marcarSolicitacaoVisualizada 
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

// Teste de conexão
router.get('/test', testConnection);

export default router;
