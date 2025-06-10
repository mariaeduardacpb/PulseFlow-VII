import Exame from '../models/AnexoExame.js';
import Paciente from '../models/Paciente.js';
import path from 'path';
import fs from 'fs';

// Paciente envia exame (PDF ou imagem)
export const uploadExame = async (req, res) => {
  const { nome, categoria, data } = req.body;
  const pacienteId = req.user.id;

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Arquivo não enviado!' });
    }

    const filePath = req.file.path.replace(/\\/g, '/'); // Corrige o caminho para Windows/Linux

    const novoExame = new Exame({
      nome,
      categoria,
      data,
      paciente: pacienteId,
      filePath
    });

    await novoExame.save();
    res.status(201).json({ message: 'Exame enviado com sucesso', exame: novoExame });
  } catch (error) {
    console.error('Erro ao salvar exame:', error);
    res.status(500).json({ error: 'Erro ao salvar exame' });
  }
};

// Médico busca exames de um paciente via CPF
export const buscarExamesMedico = async (req, res) => {
  const { cpf } = req.query;
  try {
    const paciente = await Paciente.findOne({ cpf: cpf?.replace(/[^\d]/g, '') });
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    const exames = await Exame.find({ paciente: paciente._id }).sort({ data: -1 });
    res.json(exames);
  } catch (error) {
    console.error('Erro ao buscar exames:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Paciente visualiza seus próprios exames
export const buscarExamesPaciente = async (req, res) => {
  const pacienteId = req.user.id;
  try {
    const exames = await Exame.find({ paciente: pacienteId }).sort({ data: -1 });
    res.json(exames);
  } catch (error) {
    console.error('Erro ao buscar exames do paciente:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const downloadExame = async (req, res) => {
  try {
    const { id } = req.params;

    const exame = await Exame.findById(id);
    if (!exame) {
      return res.status(404).json({ message: 'Exame não encontrado' });
    }

    const filePath = path.join(process.cwd(), exame.filePath); // <<< Corrigido, sem 'server'

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Arquivo não encontrado no servidor' });
    }

    res.download(filePath);
  } catch (error) {
    console.error('Erro ao fazer download do exame:', error);
    res.status(500).json({ message: 'Erro interno ao baixar arquivo' });
  }
};

