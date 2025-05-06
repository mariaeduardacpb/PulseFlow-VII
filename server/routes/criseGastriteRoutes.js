import express from 'express';
import { criarCrise, listarCrisesPorPaciente } from '../controllers/criseGastriteController.js';

const router = express.Router();

router.post('/', criarCrise);
router.get('/:pacienteId', listarCrisesPorPaciente);

export default router;
