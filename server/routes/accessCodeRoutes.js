import express from 'express';
import { gerarCodigoAcesso, verificarCodigoAcesso, testConnection } from '../controllers/accessCodeController.js';

const router = express.Router();

// Gerar código de acesso para o paciente
router.post('/gerar', gerarCodigoAcesso);

// Verificar se código de acesso é válido
router.post('/verificar', verificarCodigoAcesso);

// Teste de conexão
router.get('/test', testConnection);

export default router;
