import Agendamento from '../models/Agendamento.js';
import Paciente from '../models/Paciente.js';
import User from '../models/User.js';

const parseDateAsLocal = (dateString) => {
  if (typeof dateString === 'string' && dateString.includes('T') && !dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
    const [datePart, timePart] = dateString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const timeOnly = timePart.split('.')[0];
    const [hours, minutes, seconds = 0] = timeOnly.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds || 0);
  }
  return new Date(dateString);
};

// Criar novo agendamento
export const criarAgendamento = async (req, res) => {
  try {
    const {
      pacienteId,
      dataHora,
      data,
      horaInicio,
      horaFim,
      tipoConsulta,
      motivoConsulta,
      observacoes,
      duracao,
      endereco,
      linkVideochamada
    } = req.body;

    const medicoId = req.user._id;

    // Validar campos obrigatórios
    if (!pacienteId || !motivoConsulta || !motivoConsulta.trim()) {
      return res.status(400).json({ 
        message: 'Campos obrigatórios: pacienteId e motivoConsulta' 
      });
    }

    if (!dataHora && (!data || !horaInicio || !horaFim)) {
      return res.status(400).json({ 
        message: 'Campos obrigatórios: (data + horaInicio + horaFim) ou dataHora' 
      });
    }

    // Verificar se o paciente existe
    const paciente = await Paciente.findById(pacienteId);
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    let dataConsulta, horaInicioFinal, horaFimFinal, dataHoraCompleta;

    if (data && horaInicio && horaFim) {
      const [ano, mes, dia] = data.split('-').map(Number);
      dataConsulta = new Date(ano, mes - 1, dia);
      horaInicioFinal = horaInicio;
      horaFimFinal = horaFim;
      
      const [horaInicioH, minutoInicioM] = horaInicio.split(':').map(Number);
      dataHoraCompleta = new Date(ano, mes - 1, dia, horaInicioH, minutoInicioM);
    } else if (dataHora) {
      const dataHoraConsulta = parseDateAsLocal(dataHora);
      if (isNaN(dataHoraConsulta.getTime())) {
        return res.status(400).json({ 
          message: 'Data e hora inválidas' 
        });
      }
      dataConsulta = new Date(dataHoraConsulta.getFullYear(), dataHoraConsulta.getMonth(), dataHoraConsulta.getDate());
      horaInicioFinal = `${String(dataHoraConsulta.getHours()).padStart(2, '0')}:${String(dataHoraConsulta.getMinutes()).padStart(2, '0')}`;
      const duracaoConsulta = duracao || 30;
      const fimConsulta = new Date(dataHoraConsulta.getTime() + duracaoConsulta * 60000);
      horaFimFinal = `${String(fimConsulta.getHours()).padStart(2, '0')}:${String(fimConsulta.getMinutes()).padStart(2, '0')}`;
      dataHoraCompleta = dataHoraConsulta;
    } else {
      return res.status(400).json({ 
        message: 'Campos obrigatórios: (data + horaInicio + horaFim) ou dataHora' 
      });
    }

    if (dataHoraCompleta <= new Date()) {
      return res.status(400).json({ 
        message: 'A data e hora da consulta deve ser futura' 
      });
    }

    // Verificar conflito de horário para o médico
    const duracaoConsulta = duracao || 30;
    const inicioConsulta = dataHoraCompleta.getTime();
    const fimConsulta = inicioConsulta + duracaoConsulta * 60000;
    
    const agendamentosExistentes = await Agendamento.find({
      medicoId,
      status: { $in: ['agendada', 'confirmada', 'remarcada'] },
      $or: [
        { data: { $gte: new Date(dataConsulta.getFullYear(), dataConsulta.getMonth(), dataConsulta.getDate()), $lte: new Date(dataConsulta.getFullYear(), dataConsulta.getMonth(), dataConsulta.getDate(), 23, 59, 59) } },
        { dataHora: { $gte: new Date(inicioConsulta - duracaoConsulta * 60000), $lte: new Date(fimConsulta) } }
      ]
    }).lean();
    
    const conflito = agendamentosExistentes.some(ag => {
      let agInicio, agFim;
      
      if (ag.data && ag.horaInicio && ag.horaFim) {
        const [anoAg, mesAg, diaAg] = ag.data.toString().split('T')[0].split('-').map(Number);
        const [horaInicioAg, minutoInicioAg] = ag.horaInicio.split(':').map(Number);
        const [horaFimAg, minutoFimAg] = ag.horaFim.split(':').map(Number);
        agInicio = new Date(anoAg, mesAg - 1, diaAg, horaInicioAg, minutoInicioAg).getTime();
        agFim = new Date(anoAg, mesAg - 1, diaAg, horaFimAg, minutoFimAg).getTime();
      } else if (ag.dataHora) {
        agInicio = new Date(ag.dataHora).getTime();
        agFim = agInicio + (ag.duracao || 30) * 60000;
      } else {
        return false;
      }
      
      return (inicioConsulta < agFim && fimConsulta > agInicio);
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
      pacienteNome: paciente.name || paciente.nome || 'Paciente',
      pacienteEmail: paciente.email || '',
      pacienteTelefone: paciente.phone || paciente.telefone || '',
      data: dataConsulta,
      horaInicio: horaInicioFinal,
      horaFim: horaFimFinal,
      dataHora: dataHoraCompleta,
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

    try {
      const Notification = (await import('../models/Notification.js')).default;
      const mongoose = (await import('mongoose')).default;
      const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dataHoraCompleta);

      await Notification.create({
        user: mongoose.Types.ObjectId.isValid(pacienteId) ? pacienteId : new mongoose.Types.ObjectId(pacienteId.toString()),
        userModel: 'Paciente',
        title: 'Nova consulta agendada',
        description: `Uma consulta foi agendada para você com ${novoAgendamento.medicoId?.nome || 'seu médico'} em ${dataFormatada}`,
        type: 'appointment',
        link: `/appointments/${novoAgendamento._id}`,
        unread: true
      });
    } catch (notifError) {
      console.error('Erro ao criar notificação:', notifError);
    }

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

    const agora = new Date();
    const idsParaAtualizar = [];

    for (const agendamento of agendamentos) {
      const dataHoraConsulta = new Date(agendamento.dataHora);
      const fimConsulta = new Date(dataHoraConsulta.getTime() + (agendamento.duracao || 30) * 60000);

      if (fimConsulta < agora && agendamento.status !== 'cancelada' && agendamento.status !== 'realizada') {
        idsParaAtualizar.push(agendamento._id);
        agendamento.status = 'realizada';
      }
    }

    if (idsParaAtualizar.length > 0) {
      await Agendamento.updateMany(
        { _id: { $in: idsParaAtualizar } },
        { 
          $set: { 
            status: 'realizada',
            updatedAt: new Date()
          }
        }
      );
    }

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

    const agora = new Date();
    const dataHoraConsulta = new Date(agendamento.dataHora);
    const fimConsulta = new Date(dataHoraConsulta.getTime() + (agendamento.duracao || 30) * 60000);

    if (fimConsulta < agora && agendamento.status !== 'cancelada' && agendamento.status !== 'realizada') {
      await Agendamento.updateOne(
        { _id: agendamento._id },
        { 
          $set: { 
            status: 'realizada',
            updatedAt: new Date()
          }
        }
      );
      agendamento.status = 'realizada';
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
      const novaDataHora = parseDateAsLocal(dataHora);
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

    await agendamento.populate('pacienteId', 'name email phone');
    await agendamento.populate('medicoId', 'nome areaAtuacao');

    try {
      const Notification = (await import('../models/Notification.js')).default;
      const mongoose = (await import('mongoose')).default;
      const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(agendamento.dataHora);

      await Notification.create({
        user: mongoose.Types.ObjectId.isValid(agendamento.pacienteId._id) ? agendamento.pacienteId._id : new mongoose.Types.ObjectId(agendamento.pacienteId._id.toString()),
        userModel: 'Paciente',
        title: 'Consulta confirmada',
        description: `Sua consulta com ${agendamento.medicoId?.nome || 'seu médico'} em ${dataFormatada} foi confirmada`,
        type: 'appointment',
        link: `/appointments/${agendamento._id}`,
        unread: true
      });
    } catch (notifError) {
      console.error('Erro ao criar notificação:', notifError);
    }

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

    await agendamento.populate('pacienteId', 'name email phone');
    await agendamento.populate('medicoId', 'nome areaAtuacao');

    try {
      const Notification = (await import('../models/Notification.js')).default;
      const mongoose = (await import('mongoose')).default;
      const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(agendamento.dataHora);

      await Notification.create({
        user: mongoose.Types.ObjectId.isValid(agendamento.pacienteId._id) ? agendamento.pacienteId._id : new mongoose.Types.ObjectId(agendamento.pacienteId._id.toString()),
        userModel: 'Paciente',
        title: 'Consulta cancelada',
        description: `Sua consulta com ${agendamento.medicoId?.nome || 'seu médico'} agendada para ${dataFormatada} foi cancelada${motivoCancelamento ? `. Motivo: ${motivoCancelamento}` : ''}`,
        type: 'alerta',
        link: `/appointments/${agendamento._id}`,
        unread: true
      });
    } catch (notifError) {
      console.error('Erro ao criar notificação:', notifError);
    }

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

    const novaData = parseDateAsLocal(novaDataHora);
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
      status: { $in: ['agendada', 'confirmada', 'remarcada'] }
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

    try {
      const Notification = (await import('../models/Notification.js')).default;
      const mongoose = (await import('mongoose')).default;
      const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(novaData);

      await Notification.create({
        user: mongoose.Types.ObjectId.isValid(agendamento.pacienteId._id) ? agendamento.pacienteId._id : new mongoose.Types.ObjectId(agendamento.pacienteId._id.toString()),
        userModel: 'Paciente',
        title: 'Consulta remarcada',
        description: `Sua consulta com ${agendamento.medicoId?.nome || 'seu médico'} foi remarcada para ${dataFormatada}`,
        type: 'appointment',
        link: `/appointments/${agendamento._id}`,
        unread: true
      });
    } catch (notifError) {
      console.error('Erro ao criar notificação:', notifError);
    }

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

// Criar agendamento pelo paciente
export const criarAgendamentoPaciente = async (req, res) => {
  try {
    const {
      medicoId,
      dataHora,
      data,
      horaInicio,
      horaFim,
      tipoConsulta,
      motivoConsulta,
      observacoes,
      duracao,
      endereco,
      linkVideochamada
    } = req.body;

    const pacienteId = req.user._id;

    let dataConsulta, horaInicioFinal, horaFimFinal;

    if (data && horaInicio && horaFim) {
      const [ano, mes, dia] = data.split('-').map(Number);
      dataConsulta = new Date(ano, mes - 1, dia);
      horaInicioFinal = horaInicio;
      horaFimFinal = horaFim;
    } else if (dataHora) {
      const dataHoraConsulta = parseDateAsLocal(dataHora);
      if (isNaN(dataHoraConsulta.getTime())) {
        return res.status(400).json({ 
          message: 'Data e hora inválidas' 
        });
      }
      dataConsulta = new Date(dataHoraConsulta.getFullYear(), dataHoraConsulta.getMonth(), dataHoraConsulta.getDate());
      horaInicioFinal = `${String(dataHoraConsulta.getHours()).padStart(2, '0')}:${String(dataHoraConsulta.getMinutes()).padStart(2, '0')}`;
      const duracaoConsulta = duracao || 30;
      const fimConsulta = new Date(dataHoraConsulta.getTime() + duracaoConsulta * 60000);
      horaFimFinal = `${String(fimConsulta.getHours()).padStart(2, '0')}:${String(fimConsulta.getMinutes()).padStart(2, '0')}`;
    } else {
      return res.status(400).json({ 
        message: 'Campos obrigatórios: (data + horaInicio + horaFim) ou dataHora + motivoConsulta' 
      });
    }

    if (!medicoId || !motivoConsulta || !motivoConsulta.trim()) {
      return res.status(400).json({ 
        message: 'Campos obrigatórios: medicoId e motivoConsulta' 
      });
    }

    const medico = await User.findById(medicoId);
    if (!medico) {
      return res.status(404).json({ message: 'Médico não encontrado' });
    }

    const paciente = await Paciente.findById(pacienteId);
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    const inicioDia = new Date(dataConsulta);
    inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(dataConsulta);
    fimDia.setHours(23, 59, 59, 999);

    if (dataConsulta < new Date(new Date().setHours(0, 0, 0, 0))) {
      return res.status(400).json({ 
        message: 'A data da consulta deve ser futura ou hoje' 
      });
    }

    const agendamentosExistentes = await Agendamento.find({
      medicoId,
      data: {
        $gte: inicioDia,
        $lte: fimDia
      },
      status: { $in: ['agendada', 'confirmada'] }
    });
    
    const conflito = agendamentosExistentes.find(ag => {
      if (!ag.horaInicio || !ag.horaFim) return false;
      return (horaInicioFinal < ag.horaFim && horaFimFinal > ag.horaInicio);
    });

    if (conflito) {
      return res.status(400).json({ 
        message: 'Já existe uma consulta agendada neste horário' 
      });
    }

    const [horaInicioH, minutoInicioM] = horaInicioFinal.split(':').map(Number);
    const dataHoraCompleta = new Date(dataConsulta);
    dataHoraCompleta.setHours(horaInicioH, minutoInicioM, 0, 0);

    const novoAgendamento = new Agendamento({
      medicoId,
      pacienteId,
      pacienteNome: paciente.name || paciente.nome || 'Paciente',
      pacienteEmail: paciente.email || '',
      pacienteTelefone: paciente.phone || paciente.telefone || '',
      data: dataConsulta,
      horaInicio: horaInicioFinal,
      horaFim: horaFimFinal,
      dataHora: dataHoraCompleta,
      tipoConsulta: tipoConsulta || 'presencial',
      motivoConsulta,
      observacoes: observacoes || '',
      duracao: duracao || 30,
      endereco: endereco || {},
      linkVideochamada: linkVideochamada || null,
      status: 'agendada'
    });

    await novoAgendamento.save();

    await novoAgendamento.populate('pacienteId', 'name email phone');
    await novoAgendamento.populate('medicoId', 'nome areaAtuacao');

    try {
      const Notification = (await import('../models/Notification.js')).default;
      const mongoose = (await import('mongoose')).default;
      const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dataHoraCompleta);

      await Notification.create({
        user: mongoose.Types.ObjectId.isValid(pacienteId) ? pacienteId : new mongoose.Types.ObjectId(pacienteId.toString()),
        userModel: 'Paciente',
        title: 'Consulta agendada',
        description: `Sua consulta com ${medico.nome} foi agendada para ${dataFormatada}`,
        type: 'appointment',
        link: `/appointments/${novoAgendamento._id}`,
        unread: true
      });

      await Notification.create({
        user: mongoose.Types.ObjectId.isValid(medicoId) ? medicoId : new mongoose.Types.ObjectId(medicoId.toString()),
        userModel: 'User',
        title: 'Novo agendamento',
        description: `${paciente.name || paciente.nome || 'Paciente'} agendou uma consulta para ${dataFormatada}`,
        type: 'appointment',
        link: `/agendamentos/${novoAgendamento._id}`,
        unread: true
      });
    } catch (notifError) {
      console.error('Erro ao criar notificação:', notifError);
    }

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

// Listar agendamentos do paciente
export const listarAgendamentosPaciente = async (req, res) => {
  try {
    const pacienteId = req.user._id;
    const { status, dataInicio, dataFim, medicoId } = req.query;

    const filtro = { pacienteId };

    if (status) {
      filtro.status = status;
    }

    if (medicoId) {
      filtro.medicoId = medicoId;
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

    const agendamentos = await Agendamento.find(filtro)
      .populate('pacienteId', 'name email phone profilePhoto')
      .populate('medicoId', 'nome areaAtuacao crm')
      .sort({ dataHora: 1 })
      .lean();

    const agora = new Date();
    const idsParaAtualizar = [];

    for (const agendamento of agendamentos) {
      const dataHoraConsulta = new Date(agendamento.dataHora);
      const fimConsulta = new Date(dataHoraConsulta.getTime() + (agendamento.duracao || 30) * 60000);

      if (fimConsulta < agora && agendamento.status !== 'cancelada' && agendamento.status !== 'realizada') {
        idsParaAtualizar.push(agendamento._id);
        agendamento.status = 'realizada';
      }
    }

    if (idsParaAtualizar.length > 0) {
      await Agendamento.updateMany(
        { _id: { $in: idsParaAtualizar } },
        { 
          $set: { 
            status: 'realizada',
            updatedAt: new Date()
          }
        }
      );
    }

    res.json({
      total: agendamentos.length,
      agendamentos
    });
  } catch (error) {
    console.error('Erro ao listar agendamentos do paciente:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
};

// Buscar agendamentos de um médico específico (para verificar horários ocupados)
export const buscarAgendamentosMedico = async (req, res) => {
  try {
    const { medicoId } = req.params;
    const { dataInicio, dataFim } = req.query;

    if (!medicoId) {
      return res.status(400).json({ message: 'ID do médico é obrigatório' });
    }

    const filtro = { 
      medicoId,
      status: { $in: ['agendada', 'confirmada'] }
    };

    if (dataInicio || dataFim) {
      filtro.dataHora = {};
      if (dataInicio) {
        filtro.dataHora.$gte = new Date(dataInicio);
      }
      if (dataFim) {
        filtro.dataHora.$lte = new Date(dataFim);
      }
    } else {
      filtro.dataHora = { $gte: new Date() };
    }

    const agendamentos = await Agendamento.find(filtro)
      .select('dataHora duracao status')
      .sort({ dataHora: 1 })
      .lean();

    res.json({
      total: agendamentos.length,
      agendamentos
    });
  } catch (error) {
    console.error('Erro ao buscar agendamentos do médico:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
};

// Cancelar agendamento pelo paciente
export const cancelarAgendamentoPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivoCancelamento } = req.body;
    const pacienteId = req.user._id;

    const agendamento = await Agendamento.findOne({ 
      _id: id, 
      pacienteId 
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
    agendamento.canceladoPor = 'paciente';
    agendamento.motivoCancelamento = motivoCancelamento || 'Cancelado pelo paciente';
    agendamento.dataCancelamento = new Date();
    agendamento.updatedAt = new Date();
    await agendamento.save();

    await agendamento.populate('pacienteId', 'name email phone');
    await agendamento.populate('medicoId', 'nome areaAtuacao');

    try {
      const Notification = (await import('../models/Notification.js')).default;
      const mongoose = (await import('mongoose')).default;
      const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(agendamento.dataHora);

      const notifPaciente = await Notification.create({
        user: mongoose.Types.ObjectId.isValid(pacienteId) ? pacienteId : new mongoose.Types.ObjectId(pacienteId.toString()),
        userModel: 'Paciente',
        title: 'Consulta cancelada',
        description: `Sua consulta com ${agendamento.medicoId.nome} agendada para ${dataFormatada} foi cancelada${motivoCancelamento ? `. Motivo: ${motivoCancelamento}` : ''}`,
        type: 'alerta',
        link: `/appointments/${agendamento._id}`,
        unread: true
      });

      const notifMedico = await Notification.create({
        user: mongoose.Types.ObjectId.isValid(agendamento.medicoId._id) ? agendamento.medicoId._id : new mongoose.Types.ObjectId(agendamento.medicoId._id.toString()),
        userModel: 'User',
        title: 'Agendamento cancelado pelo paciente',
        description: `${agendamento.pacienteNome || 'Paciente'} cancelou a consulta agendada para ${dataFormatada}`,
        type: 'alerta',
        link: `/agendamentos/${agendamento._id}`,
        unread: true
      });

      try {
        const { sendNotificationToUser } = await import('../services/fcmService.js');
        
        await sendNotificationToUser(
          pacienteId,
          'Paciente',
          'Consulta cancelada',
          `Sua consulta com ${agendamento.medicoId.nome} agendada para ${dataFormatada} foi cancelada${motivoCancelamento ? `. Motivo: ${motivoCancelamento}` : ''}`,
          {
            link: `/appointments/${agendamento._id}`,
            type: 'appointment',
            notificationId: notifPaciente._id.toString()
          }
        );

        await sendNotificationToUser(
          agendamento.medicoId._id,
          'User',
          'Agendamento cancelado pelo paciente',
          `${agendamento.pacienteNome || 'Paciente'} cancelou a consulta agendada para ${dataFormatada}`,
          {
            link: `/agendamentos/${agendamento._id}`,
            type: 'appointment',
            notificationId: notifMedico._id.toString()
          }
        );
      } catch (fcmError) {
        console.error('Erro ao enviar notificação push:', fcmError);
      }
    } catch (notifError) {
      console.error('Erro ao criar notificação:', notifError);
    }

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

