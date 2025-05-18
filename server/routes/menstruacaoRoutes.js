import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
    criarRegistro,
    obterRegistros,
    obterRegistro,
    atualizarRegistro,
    excluirRegistro
} from '../controllers/menstruacaoController.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Rotas para registros de menstruação
router.post('/', criarRegistro);
router.get('/:cpf', obterRegistros);
router.get('/:cpf/:id', obterRegistro);
router.put('/:cpf/:id', atualizarRegistro);
router.delete('/:cpf/:id', excluirRegistro);

export default router; 