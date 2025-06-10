import express from 'express';
import perfilMedicoRoutes from './perfilMedicoRoutes.js';

const router = express.Router();

// Rotas do perfil do médico
router.use('/api/usuarios/perfil', perfilMedicoRoutes);

export default router; 