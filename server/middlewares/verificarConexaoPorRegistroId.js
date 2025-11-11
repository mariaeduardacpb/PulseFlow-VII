import ConexaoMedicoPaciente from '../models/ConexaoMedicoPaciente.js';
import Exame from '../models/AnexoExame.js';
import AnotacaoMedica from '../models/AnotacaoMedica.js';
import EventoClinico from '../models/EventoClinico.js';

export const verificarConexaoPorExameId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const medicoId = req.user._id;


    const exame = await Exame.findById(id).populate('paciente');
    if (!exame) {
      return res.status(404).json({ message: 'Exame não encontrado' });
    }

    const pacienteId = exame.paciente?._id ? exame.paciente._id : exame.paciente;

    const conexaoAtiva = await ConexaoMedicoPaciente.findOne({
      pacienteId: pacienteId,
      medicoId: medicoId,
      isActive: true
    });

    if (!conexaoAtiva) {
      return res.status(403).json({ 
        message: 'Acesso negado. Você não tem uma conexão ativa com este paciente. Por favor, solicite acesso novamente.',
        codigo: 'CONEXAO_INATIVA'
      });
    }

    req.exame = exame;
    req.pacienteId = pacienteId;
    next();
  } catch (error) {
    console.error('Erro ao verificar conexão por exame ID:', error);
    res.status(500).json({ 
      message: 'Erro ao verificar conexão',
      error: error.message 
    });
  }
};

export const verificarConexaoPorAnotacaoId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const medicoId = req.user._id;


    const anotacao = await AnotacaoMedica.findById(id).populate('pacienteId');
    if (!anotacao) {
      return res.status(404).json({ message: 'Anotação não encontrada' });
    }

    const pacienteId = anotacao.pacienteId?._id ? anotacao.pacienteId._id : anotacao.pacienteId;

    const conexaoAtiva = await ConexaoMedicoPaciente.findOne({
      pacienteId: pacienteId,
      medicoId: medicoId,
      isActive: true
    });

    if (!conexaoAtiva) {
      return res.status(403).json({ 
        message: 'Acesso negado. Você não tem uma conexão ativa com este paciente. Por favor, solicite acesso novamente.',
        codigo: 'CONEXAO_INATIVA'
      });
    }

    req.anotacao = anotacao;
    req.pacienteId = pacienteId;
    next();
  } catch (error) {
    console.error('Erro ao verificar conexão por anotação ID:', error);
    res.status(500).json({ 
      message: 'Erro ao verificar conexão',
      error: error.message 
    });
  }
};

export const verificarConexaoPorEventoId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const medicoId = req.user._id;


    const evento = await EventoClinico.findById(id).populate('paciente');
    if (!evento) {
      return res.status(404).json({ message: 'Evento não encontrado' });
    }

    const pacienteId = evento.paciente?._id ? evento.paciente._id : evento.paciente;

    const conexaoAtiva = await ConexaoMedicoPaciente.findOne({
      pacienteId: pacienteId,
      medicoId: medicoId,
      isActive: true
    });

    if (!conexaoAtiva) {
      return res.status(403).json({ 
        message: 'Acesso negado. Você não tem uma conexão ativa com este paciente. Por favor, solicite acesso novamente.',
        codigo: 'CONEXAO_INATIVA'
      });
    }

    req.evento = evento;
    req.pacienteId = pacienteId;
    next();
  } catch (error) {
    console.error('Erro ao verificar conexão por evento ID:', error);
    res.status(500).json({ 
      message: 'Erro ao verificar conexão',
      error: error.message 
    });
  }
};

