import express from 'express';
import { salvarCiclo, listarCiclos, buscarCiclosMedico } from '../controllers/cicloController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { verificarConexaoMedicoPaciente } from '../middlewares/verificarConexaoMedicoPaciente.js';

const router = express.Router();

router.post('/novo', authMiddleware, verificarConexaoMedicoPaciente, salvarCiclo);
router.get('/medico', authMiddleware, verificarConexaoMedicoPaciente, buscarCiclosMedico);
router.get('/:cpf', authMiddleware, verificarConexaoMedicoPaciente, listarCiclos);

export default router;
