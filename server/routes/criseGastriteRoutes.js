import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { getCrises, createCrise, getCriseDetails } from '../controllers/criseGastriteController.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Rotas para crises de gastrite
router.post('/', createCrise);
router.get('/:cpf', getCrises);
router.get('/:cpf/:id', getCriseDetails);

export default router;
