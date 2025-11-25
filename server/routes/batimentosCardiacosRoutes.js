import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { authPacienteMiddleware } from '../middlewares/pacienteAuthMiddleware.js';
import { verificarConexaoMedicoPaciente } from '../middlewares/verificarConexaoMedicoPaciente.js';
import {
  registrarBatimentos,
  buscarBatimentosMedico,
  buscarBatimentosPaciente
} from '../controllers/batimentosCardiacosController.js';

const router = express.Router();

router.post('/register', authPacienteMiddleware, registrarBatimentos);
router.get('/medico', authMiddleware, verificarConexaoMedicoPaciente, buscarBatimentosMedico);
router.get('/paciente', authPacienteMiddleware, buscarBatimentosPaciente);

export default router;

