// routes/pacienteRoutes.js
import express from 'express';
import Paciente from '../models/Paciente.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Médico busca paciente pelo CPF
router.get('/buscar', async (req, res) => {
  const { cpf } = req.query;

  if (!cpf) return res.status(400).json({ message: 'CPF é obrigatório' });

  try {
    // Limpar CPF removendo caracteres não numéricos
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    // Validar se CPF tem 11 dígitos
    if (cpfLimpo.length !== 11) {
      return res.status(400).json({ message: 'CPF deve ter 11 dígitos' });
    }

    // Tentar buscar com CPF limpo
    let paciente = await Paciente.findOne({ cpf: cpfLimpo });
    
    // Se não encontrar, tentar com CPF formatado
    if (!paciente) {
      const cpfFormatado = cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      paciente = await Paciente.findOne({ cpf: cpfFormatado });
    }
    
    // Se ainda não encontrar, listar todos os CPFs para debug
    if (!paciente) {
      const todosPacientes = await Paciente.find({}, { cpf: 1, name: 1 });
    }

    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    res.json({
      id: paciente._id,
      nome: paciente.name || paciente.nome,
      cpf: paciente.cpf,
      email: paciente.email,
      genero: paciente.gender || paciente.genero,
      altura: paciente.altura,
      peso: paciente.peso,
      dataNascimento: paciente.birthDate || paciente.dataNascimento,
      nacionalidade: paciente.nationality || paciente.nacionalidade,
      profissao: paciente.profissao,
      telefone: paciente.phone || paciente.telefone,
      fotoPerfil: paciente.profilePhoto || paciente.fotoPerfil,
      rg: paciente.rg,
      endereco: paciente.address,
      estadoCivil: paciente.maritalStatus,
      isAdmin: paciente.isAdmin
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro interno do servidor', error: err.message });
  }
});

// Buscar paciente por CPF completo (usado no perfil)
router.get('/perfil/:cpf', async (req, res) => {
  const { cpf } = req.params;

  try {
    // Tentar buscar com CPF limpo primeiro
    let paciente = await Paciente.findOne({ cpf: cpf.replace(/\D/g, '') });
    
    // Se não encontrar, tentar com CPF formatado
    if (!paciente) {
      const cpfFormatado = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      paciente = await Paciente.findOne({ cpf: cpfFormatado });
    }

    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    res.json({
      nome: paciente.name || paciente.nome,
      cpf: paciente.cpf,
      email: paciente.email,
      genero: paciente.gender || paciente.genero,
      altura: paciente.altura,
      peso: paciente.peso,
      dataNascimento: paciente.birthDate || paciente.dataNascimento,
      nacionalidade: paciente.nationality || paciente.nacionalidade,
      profissao: paciente.profissao,
      telefone: paciente.phone || paciente.telefone,
      observacoes: paciente.observacoes,
      fotoPerfil: paciente.profilePhoto || paciente.fotoPerfil,
      rg: paciente.rg,
      endereco: paciente.address,
      estadoCivil: paciente.maritalStatus,
      isAdmin: paciente.isAdmin
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro interno do servidor', error: err.message });
  }
});

// Buscar paciente por ID (usado no perfil)
router.get('/id/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const paciente = await Paciente.findById(id);

    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    res.json({
      nome: paciente.name || paciente.nome,
      cpf: paciente.cpf,
      email: paciente.email,
      genero: paciente.gender || paciente.genero,
      altura: paciente.altura,
      peso: paciente.peso,
      dataNascimento: paciente.birthDate || paciente.dataNascimento,
      nacionalidade: paciente.nationality || paciente.nacionalidade,
      profissao: paciente.profissao,
      telefone: paciente.phone || paciente.telefone,
      observacoes: paciente.observacoes,
      fotoPerfil: paciente.profilePhoto || paciente.fotoPerfil,
      rg: paciente.rg,
      endereco: paciente.address,
      estadoCivil: paciente.maritalStatus,
      isAdmin: paciente.isAdmin
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro interno do servidor', error: err.message });
  }
});

// Rota de teste para listar todos os pacientes
router.get('/teste', async (req, res) => {
  try {
    const pacientes = await Paciente.find({}, { cpf: 1, name: 1, _id: 1 });
    res.json({
      total: pacientes.length,
      pacientes: pacientes
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro interno do servidor', error: err.message });
  }
});

export default router;