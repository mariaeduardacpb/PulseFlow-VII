import express from 'express';
import { authPacienteMiddleware } from '../middlewares/pacienteAuthMiddleware.js';
import { 
  criarAgendamentoPaciente, 
  cancelarAgendamentoPaciente,
  listarAgendamentosPaciente,
  buscarAgendamentosMedico
} from '../controllers/agendamentoController.js';

const router = express.Router();

router.use(authPacienteMiddleware);

router.get('/', listarAgendamentosPaciente);
router.get('/medico/:medicoId', buscarAgendamentosMedico);
router.post('/', criarAgendamentoPaciente);
router.patch('/:id/cancelar', cancelarAgendamentoPaciente);

export default router;

