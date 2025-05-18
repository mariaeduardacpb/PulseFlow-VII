// routes/pacienteRoutes.js
import express from 'express';
import Paciente from '../models/Paciente.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Médico busca paciente pelo CPF
router.get('/buscar', authMiddleware, async (req, res) => {
  const { cpf } = req.query;

  if (!cpf) return res.status(400).json({ message: 'CPF é obrigatório' });

  try {
    const paciente = await Paciente.findOne({ cpf: cpf.replace(/\D/g, '') });

    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    res.json({
      id: paciente._id,
      nome: paciente.nome,
      cpf: paciente.cpf,
      email: paciente.email
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro interno do servidor', error: err.message });
  }
});

export default router;

// Buscar paciente por ID (usado no perfil)
router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const paciente = await Paciente.findById(id);

    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    res.json({
      nome: paciente.nome,
      cpf: paciente.cpf,
      email: paciente.email,
      genero: paciente.genero,
      altura: paciente.altura,
      peso: paciente.peso,
      dataNascimento: paciente.dataNascimento,
      nacionalidade: paciente.nacionalidade,
      profissao: paciente.profissao,
      telefone: paciente.telefone,
      observacoes: paciente.observacoes,
      fotoPerfil: paciente.fotoPerfil // exemplo: link ou base64
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro interno do servidor', error: err.message });
  }
});