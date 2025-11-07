import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  criarAgendamento,
  listarAgendamentos,
  buscarAgendamento,
  atualizarAgendamento,
  confirmarAgendamento,
  cancelarAgendamento,
  marcarComoRealizada,
  remarcarConsulta,
  obterEstatisticas
} from '../controllers/agendamentoController.js';

const router = express.Router();

// Todas as rotas requerem autenticação de médico
router.use(authMiddleware);

// Criar novo agendamento
router.post('/', criarAgendamento);

// Listar agendamentos do médico
router.get('/', listarAgendamentos);

// Obter estatísticas
router.get('/estatisticas', obterEstatisticas);

// Buscar agendamento por ID
router.get('/:id', buscarAgendamento);

// Atualizar agendamento
router.put('/:id', atualizarAgendamento);

// Confirmar agendamento
router.patch('/:id/confirmar', confirmarAgendamento);

// Cancelar agendamento
router.patch('/:id/cancelar', cancelarAgendamento);

// Marcar como realizada
router.patch('/:id/realizada', marcarComoRealizada);

// Remarcar consulta
router.patch('/:id/remarcar', remarcarConsulta);

export default router;

