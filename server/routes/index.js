import express from 'express';
import perfilMedicoRoutes from './perfilMedicoRoutes.js';
import notificacaoRoutes from './notificacaoRoutes.js';

const router = express.Router();

// Rotas do perfil do médico
router.use('/api/usuarios/perfil', perfilMedicoRoutes);
router.use('/api/notificacoes', notificacaoRoutes);

export default router; 