import Agendamento from '../models/Agendamento.js';
import Paciente from '../models/Paciente.js';
import User from '../models/User.js';

// Criar novo agendamento
export const criarAgendamento = async (req, res) => {
  try {
    const {
      pacienteId,
      dataHora,
      tipoConsulta,
      motivoConsulta,
      observacoes,
      duracao,
      endereco,
      linkVideochamada
    } = req.body;

    const medicoId = req.user._id;

    // Validar campos obrigatórios
    if (!pacienteId || !dataHora || !motivoConsulta) {
      return res.status(400).json({ 
        message: 'Campos obrigatórios: pacienteId, dataHora e motivoConsulta' 
      });
    }

    // Verificar se o paciente existe
    const paciente = await Paciente.findById(pacienteId);
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    // Verificar se a data/hora é futura
    const dataHoraConsulta = new Date(dataHora);
    if (dataHoraConsulta <= new Date()) {
      return res.status(400).json({ 
        message: 'A data e hora da consulta deve ser futura' 
      });
    }

    // Verificar conflito de horário para o médico
    const conflito = await Agendamento.findOne({
      medicoId,
      dataHora: {
        $gte: new Date(dataHoraConsulta.getTime() - (duracao || 30) * 60000),
        $lte: new Date(dataHoraConsulta.getTime() + (duracao || 30) * 60000)
      },
      status: { $in: ['agendada', 'confirmada'] }
    });

    if (conflito) {
      return res.status(400).json({ 
        message: 'Já existe uma consulta agendada neste horário' 
      });
    }

    // Criar o agendamento
    const novoAgendamento = new Agendamento({
      medicoId,
      pacienteId,
      pacienteNome: paciente.name,
      pacienteEmail: paciente.email,
      pacienteTelefone: paciente.phone,
      dataHora: dataHoraConsulta,
      tipoConsulta: tipoConsulta || 'presencial',
      motivoConsulta,
      observacoes: observacoes || '',
      duracao: duracao || 30,
      endereco: endereco || {},
      linkVideochamada: linkVideochamada || null,
      status: 'agendada'
    });

    await novoAgendamento.save();

    // Popular dados do paciente e médico para retorno
    await novoAgendamento.populate('pacienteId', 'name email phone');
    await novoAgendamento.populate('medicoId', 'nome areaAtuacao');

    res.status(201).json({
      message: 'Agendamento criado com sucesso',
      agendamento: novoAgendamento
    });
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
};

// Listar agendamentos do médico
export const listarAgendamentos = async (req, res) => {
  try {
    const medicoId = req.user._id;
    const { status, dataInicio, dataFim, pacienteId } = req.query;

    // Construir filtro
    const filtro = { medicoId };

    if (status) {
      filtro.status = status;
    }

    if (pacienteId) {
      filtro.pacienteId = pacienteId;
    }

    if (dataInicio || dataFim) {
      filtro.dataHora = {};
      if (dataInicio) {
        filtro.dataHora.$gte = new Date(dataInicio);
      }
      if (dataFim) {
        filtro.dataHora.$lte = new Date(dataFim);
      }
    }

    // Buscar agendamentos
    const agendamentos = await Agendamento.find(filtro)
      .populate('pacienteId', 'name email phone profilePhoto')
      .populate('medicoId', 'nome areaAtuacao')
      .sort({ dataHora: 1 })
      .lean();

    res.json({
      total: agendamentos.length,
      agendamentos
    });
  } catch (error) {
    console.error('Erro ao listar agendamentos:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
};

// Buscar agendamento por ID
export const buscarAgendamento = async (req, res) => {
  try {
    const { id } = req.params;
    const medicoId = req.user._id;

    const agendamento = await Agendamento.findOne({ 
      _id: id, 
      medicoId 
    })
      .populate('pacienteId', 'name email phone profilePhoto birthDate gender')
      .populate('medicoId', 'nome areaAtuacao crm telefoneConsultorio enderecoConsultorio')
      .lean();

    if (!agendamento) {
      return res.status(404).json({ message: 'Agendamento não encontrado' });
    }

    res.json(agendamento);
  } catch (error) {
    console.error('Erro ao buscar agendamento:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
};

// Atualizar agendamento
export const atualizarAgendamento = async (req, res) => {
  try {
    const { id } = req.params;
    const medicoId = req.user._id;
    const {
      dataHora,
      tipoConsulta,
      motivoConsulta,
      observacoes,
      duracao,
      endereco,
      linkVideochamada
    } = req.body;

    const agendamento = await Agendamento.findOne({ 
      _id: id, 
      medicoId 
    });

    if (!agendamento) {
      return res.status(404).json({ message: 'Agendamento não encontrado' });
    }

    // Verificar se pode ser atualizado (não pode atualizar se já foi cancelada ou realizada)
    if (agendamento.status === 'cancelada' || agendamento.status === 'realizada') {
      return res.status(400).json({ 
        message: 'Não é possível atualizar um agendamento cancelado ou realizado' 
      });
    }

    // Atualizar campos
    if (dataHora) {
      const novaDataHora = new Date(dataHora);
      if (novaDataHora <= new Date()) {
        return res.status(400).json({ 
          message: 'A data e hora da consulta deve ser futura' 
        });
      }

      // Verificar conflito de horário (exceto o próprio agendamento)
      const conflito = await Agendamento.findOne({
        medicoId,
        _id: { $ne: id },
        dataHora: {
          $gte: new Date(novaDataHora.getTime() - (duracao || agendamento.duracao) * 60000),
          $lte: new Date(novaDataHora.getTime() + (duracao || agendamento.duracao) * 60000)
        },
        status: { $in: ['agendada', 'confirmada'] }
      });

      if (conflito) {
        return res.status(400).json({ 
          message: 'Já existe uma consulta agendada neste horário' 
        });
      }

      agendamento.dataHora = novaDataHora;
    }

    if (tipoConsulta) agendamento.tipoConsulta = tipoConsulta;
    if (motivoConsulta) agendamento.motivoConsulta = motivoConsulta;
    if (observacoes !== undefined) agendamento.observacoes = observacoes;
    if (duracao) agendamento.duracao = duracao;
    if (endereco) agendamento.endereco = { ...agendamento.endereco, ...endereco };
    if (linkVideochamada !== undefined) agendamento.linkVideochamada = linkVideochamada;

    agendamento.updatedAt = new Date();
    await agendamento.save();

    await agendamento.populate('pacienteId', 'name email phone');
    await agendamento.populate('medicoId', 'nome areaAtuacao');

    res.json({
      message: 'Agendamento atualizado com sucesso',
      agendamento
    });
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
};

// Confirmar agendamento
export const confirmarAgendamento = async (req, res) => {
  try {
    const { id } = req.params;
    const medicoId = req.user._id;

    const agendamento = await Agendamento.findOne({ 
      _id: id, 
      medicoId 
    });

    if (!agendamento) {
      return res.status(404).json({ message: 'Agendamento não encontrado' });
    }

    if (agendamento.status !== 'agendada') {
      return res.status(400).json({ 
        message: 'Apenas agendamentos com status "agendada" podem ser confirmados' 
      });
    }

    agendamento.status = 'confirmada';
    agendamento.updatedAt = new Date();
    await agendamento.save();

    res.json({
      message: 'Agendamento confirmado com sucesso',
      agendamento
    });
  } catch (error) {
    console.error('Erro ao confirmar agendamento:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
};

// Cancelar agendamento
export const cancelarAgendamento = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivoCancelamento } = req.body;
    const medicoId = req.user._id;

    const agendamento = await Agendamento.findOne({ 
      _id: id, 
      medicoId 
    });

    if (!agendamento) {
      return res.status(404).json({ message: 'Agendamento não encontrado' });
    }

    if (agendamento.status === 'cancelada') {
      return res.status(400).json({ 
        message: 'Este agendamento já foi cancelado' 
      });
    }

    if (agendamento.status === 'realizada') {
      return res.status(400).json({ 
        message: 'Não é possível cancelar um agendamento já realizado' 
      });
    }

    agendamento.status = 'cancelada';
    agendamento.canceladoPor = 'medico';
    agendamento.motivoCancelamento = motivoCancelamento || 'Cancelado pelo médico';
    agendamento.dataCancelamento = new Date();
    agendamento.updatedAt = new Date();
    await agendamento.save();

    res.json({
      message: 'Agendamento cancelado com sucesso',
      agendamento
    });
  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
};

// Marcar como realizada
export const marcarComoRealizada = async (req, res) => {
  try {
    const { id } = req.params;
    const { observacoes } = req.body;
    const medicoId = req.user._id;

    const agendamento = await Agendamento.findOne({ 
      _id: id, 
      medicoId 
    });

    if (!agendamento) {
      return res.status(404).json({ message: 'Agendamento não encontrado' });
    }

    if (agendamento.status === 'cancelada') {
      return res.status(400).json({ 
        message: 'Não é possível marcar como realizada um agendamento cancelado' 
      });
    }

    agendamento.status = 'realizada';
    if (observacoes) {
      agendamento.observacoes = agendamento.observacoes 
        ? `${agendamento.observacoes}\n\n[Após consulta]: ${observacoes}`
        : `[Após consulta]: ${observacoes}`;
    }
    agendamento.updatedAt = new Date();
    await agendamento.save();

    res.json({
      message: 'Agendamento marcado como realizada com sucesso',
      agendamento
    });
  } catch (error) {
    console.error('Erro ao marcar agendamento como realizada:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
};

// Remarcar consulta
export const remarcarConsulta = async (req, res) => {
  try {
    const { id } = req.params;
    const { novaDataHora } = req.body;
    const medicoId = req.user._id;

    if (!novaDataHora) {
      return res.status(400).json({ 
        message: 'É necessário informar a nova data e hora' 
      });
    }

    const agendamento = await Agendamento.findOne({ 
      _id: id, 
      medicoId 
    });

    if (!agendamento) {
      return res.status(404).json({ message: 'Agendamento não encontrado' });
    }

    if (agendamento.status === 'cancelada' || agendamento.status === 'realizada') {
      return res.status(400).json({ 
        message: 'Não é possível remarcar um agendamento cancelado ou realizado' 
      });
    }

    const novaData = new Date(novaDataHora);
    if (novaData <= new Date()) {
      return res.status(400).json({ 
        message: 'A nova data e hora da consulta deve ser futura' 
      });
    }

    // Verificar conflito de horário
    const conflito = await Agendamento.findOne({
      medicoId,
      _id: { $ne: id },
      dataHora: {
        $gte: new Date(novaData.getTime() - agendamento.duracao * 60000),
        $lte: new Date(novaData.getTime() + agendamento.duracao * 60000)
      },
      status: { $in: ['agendada', 'confirmada'] }
    });

    if (conflito) {
      return res.status(400).json({ 
        message: 'Já existe uma consulta agendada neste horário' 
      });
    }

    agendamento.dataHora = novaData;
    agendamento.status = 'remarcada';
    agendamento.updatedAt = new Date();
    await agendamento.save();

    await agendamento.populate('pacienteId', 'name email phone');
    await agendamento.populate('medicoId', 'nome areaAtuacao');

    res.json({
      message: 'Consulta remarcada com sucesso',
      agendamento
    });
  } catch (error) {
    console.error('Erro ao remarcar consulta:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
};

// Estatísticas de agendamentos
export const obterEstatisticas = async (req, res) => {
  try {
    const medicoId = req.user._id;
    const { dataInicio, dataFim } = req.query;

    const filtro = { medicoId };
    if (dataInicio || dataFim) {
      filtro.dataHora = {};
      if (dataInicio) filtro.dataHora.$gte = new Date(dataInicio);
      if (dataFim) filtro.dataHora.$lte = new Date(dataFim);
    }

    const total = await Agendamento.countDocuments(filtro);
    const agendadas = await Agendamento.countDocuments({ ...filtro, status: 'agendada' });
    const confirmadas = await Agendamento.countDocuments({ ...filtro, status: 'confirmada' });
    const realizadas = await Agendamento.countDocuments({ ...filtro, status: 'realizada' });
    const canceladas = await Agendamento.countDocuments({ ...filtro, status: 'cancelada' });

    // Próximas consultas (próximos 7 dias)
    const proximasConsultas = await Agendamento.find({
      medicoId,
      dataHora: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      status: { $in: ['agendada', 'confirmada'] }
    })
      .populate('pacienteId', 'name')
      .sort({ dataHora: 1 })
      .limit(5)
      .lean();

    res.json({
      total,
      agendadas,
      confirmadas,
      realizadas,
      canceladas,
      proximasConsultas
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
};

