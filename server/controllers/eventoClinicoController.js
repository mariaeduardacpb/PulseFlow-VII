import EventoClinico from '../models/EventoClinico.js';
import Paciente from '../models/Paciente.js';

// Criar novo evento clínico
export const criarEvento = async (req, res) => {
  try {
    const {
      cpfPaciente,
      titulo,
      dataHora,
      tipoEvento,
      especialidade,
      intensidadeDor,
      alivio,
      descricao,
      sintomas
    } = req.body;

    // Buscar o paciente pelo CPF
    const paciente = await Paciente.findOne({ cpf: cpfPaciente.replace(/[^\d]/g, '') });
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    const evento = new EventoClinico({
      paciente: paciente._id,
      titulo,
      dataHora: new Date(dataHora),
      tipoEvento,
      especialidade,
      intensidadeDor,
      alivio,
      descricao,
      sintomas
    });

    await evento.save();
    res.status(201).json(evento);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Buscar eventos de um paciente
export const buscarEventos = async (req, res) => {
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

    const eventos = await EventoClinico.find({ paciente: paciente._id })
      .populate('paciente', 'name nome cpf email')
      .sort({ dataHora: -1 });

    res.json(eventos);
  } catch (error) {
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Médico busca eventos de um paciente pelo CPF
export const buscarEventosMedico = async (req, res) => {
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

    const eventos = await EventoClinico.find({ paciente: paciente._id })
      .populate('paciente', 'name nome cpf email')
      .sort({ dataHora: -1 });

    res.json(eventos);
  } catch (error) {
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Buscar um evento específico por ID
export const buscarEventoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const evento = await EventoClinico.findById(id).populate('paciente', 'nome cpf dataNascimento');
    
    if (!evento) {
      return res.status(404).json({ message: 'Evento não encontrado' });
    }

    res.json(evento);
  } catch (error) {
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}; 