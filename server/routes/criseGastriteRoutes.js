import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { verificarConexaoMedicoPaciente } from '../middlewares/verificarConexaoMedicoPaciente.js';
import { getCrises, createCrise, getCriseDetails } from '../controllers/criseGastriteController.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Rotas para crises de gastrite (verifica conexão ativa)
router.post('/', verificarConexaoMedicoPaciente, createCrise);
router.get('/:cpf', verificarConexaoMedicoPaciente, getCrises);
router.get('/:cpf/:id', verificarConexaoMedicoPaciente, getCriseDetails);

export default router;
