import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  criarHorario,
  listarHorarios,
  buscarHorario,
  atualizarHorario,
  deletarHorario,
  obterHorariosDisponiveis,
  listarHorariosMedico
} from '../controllers/horarioDisponibilidadeController.js';

const router = express.Router();

// Rotas públicas (sem autenticação)
router.get('/medico/:medicoId', listarHorariosMedico);
router.get('/disponiveis/:medicoId', obterHorariosDisponiveis);

// Todas as outras rotas requerem autenticação de médico
router.use(authMiddleware);

// Criar novo horário de disponibilidade
router.post('/', criarHorario);

// Listar horários do médico
router.get('/', listarHorarios);

// Buscar horário por ID
router.get('/:id', buscarHorario);

// Atualizar horário
router.put('/:id', atualizarHorario);

// Deletar horário
router.delete('/:id', deletarHorario);

export default router;

