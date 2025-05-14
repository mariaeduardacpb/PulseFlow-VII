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
    console.error('Erro ao criar evento clínico:', error);
    res.status(400).json({ message: error.message });
  }
};

// Buscar eventos de um paciente
export const buscarEventos = async (req, res) => {
  try {
    const { cpf } = req.query;

    const paciente = await Paciente.findOne({ cpf: cpf?.replace(/[^\d]/g, '') });
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    const eventos = await EventoClinico.find({ paciente: paciente._id })
      .sort({ dataHora: -1 });

    res.json(eventos);
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
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
    console.error('Erro ao buscar evento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}; 