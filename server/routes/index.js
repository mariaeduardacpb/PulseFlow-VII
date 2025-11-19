import express from 'express';
import perfilMedicoRoutes from './perfilMedicoRoutes.js';
import notificacaoRoutes from './notificacaoRoutes.js';
import notificacaoPacienteRoutes from './notificacaoPacienteRoutes.js';

const router = express.Router();

// Rotas do perfil do médico
router.use('/api/usuarios/perfil', perfilMedicoRoutes);
router.use('/api/notificacoes', notificacaoRoutes);
router.use('/api/notificacoes-paciente', notificacaoPacienteRoutes);

export default router; 