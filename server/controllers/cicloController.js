import CicloMenstrual from '../models/CicloMenstrual.js';
import Paciente from '../models/Paciente.js';
import mongoose from 'mongoose';

export const salvarCiclo = async (req, res) => {
  try {
    const { cpf, dataInicio, dataFim } = req.body;

    // Tentar buscar com CPF limpo primeiro
    let paciente = await Paciente.findOne({ cpf: cpf?.replace(/[^\d]/g, '') });
    
    // Se não encontrar, tentar com CPF formatado
    if (!paciente) {
      const cpfFormatado = cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      paciente = await Paciente.findOne({ cpf: cpfFormatado });
    }
    
    // Se ainda não encontrar, tentar com o CPF original
    if (!paciente) {
      paciente = await Paciente.findOne({ cpf: cpf });
    }

    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    const novoCiclo = new CicloMenstrual({
      pacienteId: paciente._id,
      dataInicio: new Date(dataInicio),
      dataFim: new Date(dataFim)
    });

    await novoCiclo.save();
    res.status(201).json({ message: 'Ciclo salvo com sucesso!' });
  } catch (err) {
    res.status(500).json({ message: 'Erro interno ao salvar ciclo' });
  }
};

export const listarCiclos = async (req, res) => {
  try {
    const { cpf } = req.params;

    // Tentar buscar com CPF limpo primeiro
    let paciente = await Paciente.findOne({ cpf: cpf?.replace(/[^\d]/g, '') });
    
    // Se não encontrar, tentar com CPF formatado
    if (!paciente) {
      const cpfFormatado = cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      paciente = await Paciente.findOne({ cpf: cpfFormatado });
    }
    
    // Se ainda não encontrar, tentar com o CPF original
    if (!paciente) {
      paciente = await Paciente.findOne({ cpf: cpf });
    }

    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    const ciclos = await CicloMenstrual.find({ pacienteId: paciente._id })
      .populate('pacienteId', 'name nome cpf email')
      .sort({ dataInicio: -1 });

    res.status(200).json(ciclos);
  } catch (err) {
    res.status(500).json({ message: 'Erro interno ao buscar ciclos' });
  }
};

// Médico busca ciclos de um paciente pelo CPF
export const buscarCiclosMedico = async (req, res) => {
  try {
    const { cpf } = req.query;

    // Tentar buscar com CPF limpo primeiro
    let paciente = await Paciente.findOne({ cpf: cpf?.replace(/[^\d]/g, '') });
    
    // Se não encontrar, tentar com CPF formatado
    if (!paciente) {
      const cpfFormatado = cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      paciente = await Paciente.findOne({ cpf: cpfFormatado });
    }
    
    // Se ainda não encontrar, tentar com o CPF original
    if (!paciente) {
      paciente = await Paciente.findOne({ cpf: cpf });
    }

    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    console.log('Paciente encontrado:', paciente._id);
    console.log('Buscando ciclos para pacienteId:', paciente._id);
    
    // Debug: buscar todos os ciclos
    const todosCiclos = await CicloMenstrual.find({});
    console.log('Total de ciclos no banco:', todosCiclos.length);
    console.log('Primeiro ciclo:', todosCiclos[0]);
    
    const ciclos = await CicloMenstrual.find({ pacienteId: paciente._id })
      .populate('pacienteId', 'name nome cpf email')
      .sort({ dataInicio: -1 });

    console.log('Ciclos encontrados:', ciclos.length);
    res.json(ciclos);
  } catch (error) {
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

