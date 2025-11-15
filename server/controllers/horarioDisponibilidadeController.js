import HorarioDisponibilidade from '../models/HorarioDisponibilidade.js';
import Agendamento from '../models/Agendamento.js';

// Criar novo horário de disponibilidade
export const criarHorario = async (req, res) => {
  try {
    const { diaSemana, dataEspecifica, dataFim, horaInicio, horaFim, duracaoConsulta, observacoes, tipo } = req.body;
    const medicoId = req.user._id;

    // Validar campos obrigatórios
    if ((diaSemana === undefined && !dataEspecifica) || !horaInicio || !horaFim) {
      return res.status(400).json({ 
        message: 'Campos obrigatórios: (diaSemana ou dataEspecifica), horaInicio e horaFim' 
      });
    }

    // Validar formato de hora
    const horaRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!horaRegex.test(horaInicio) || !horaRegex.test(horaFim)) {
      return res.status(400).json({ 
        message: 'Formato de hora inválido. Use HH:MM (ex: 09:00)' 
      });
    }

    // Validar que horaFim > horaInicio
    const inicio = horaInicio.split(':').map(Number);
    const fim = horaFim.split(':').map(Number);
    const inicioMinutos = inicio[0] * 60 + inicio[1];
    const fimMinutos = fim[0] * 60 + fim[1];
    
    if (fimMinutos <= inicioMinutos) {
      return res.status(400).json({ 
        message: 'Hora de fim deve ser maior que hora de início' 
      });
    }

    // Verificar se já existe um horário para o mesmo dia/período e horário
    const queryHorarioExistente = {
      medicoId,
      ativo: true,
      $or: [
        {
          horaInicio: { $lt: horaFim },
          horaFim: { $gt: horaInicio }
        }
      ]
    };

    if (dataEspecifica) {
      const dataEspecificaObj = new Date(dataEspecifica);
      const inicioDia = new Date(dataEspecificaObj);
      inicioDia.setHours(0, 0, 0, 0);
      const fimDia = new Date(dataEspecificaObj);
      fimDia.setHours(23, 59, 59, 999);
      queryHorarioExistente.dataEspecifica = {
        $gte: inicioDia,
        $lte: fimDia
      };
    } else if (diaSemana !== undefined) {
      queryHorarioExistente.diaSemana = diaSemana;
      queryHorarioExistente.tipo = 'recorrente';
    }

    const horarioExistente = await HorarioDisponibilidade.findOne(queryHorarioExistente);

    if (horarioExistente) {
      return res.status(400).json({ 
        message: 'Já existe um horário cadastrado para este dia/período e horário' 
      });
    }

    // Criar o horário
    const dadosHorario = {
      medicoId,
      horaInicio,
      horaFim,
      duracaoConsulta: duracaoConsulta || 30,
      observacoes: observacoes || '',
      ativo: true,
      tipo: tipo || (dataEspecifica ? 'especifico' : 'recorrente')
    };

    if (dataEspecifica) {
      dadosHorario.dataEspecifica = new Date(dataEspecifica);
    } else if (diaSemana !== undefined) {
      dadosHorario.diaSemana = diaSemana;
    }

    if (dataFim) {
      dadosHorario.dataFim = new Date(dataFim);
    }

    const novoHorario = new HorarioDisponibilidade(dadosHorario);

    await novoHorario.save();

    res.status(201).json({
      message: 'Horário cadastrado com sucesso',
      horario: novoHorario
    });
  } catch (error) {
    console.error('Erro ao criar horário:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
};

// Listar horários do médico
export const listarHorarios = async (req, res) => {
  try {
    const medicoId = req.user._id;
    const { ativo } = req.query;

    const filtro = { medicoId };
    if (ativo !== undefined) {
      filtro.ativo = ativo === 'true';
    }

    const horarios = await HorarioDisponibilidade.find(filtro)
      .sort({ diaSemana: 1, horaInicio: 1 })
      .lean();

    // Mapear dias da semana para nomes
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    
    const horariosFormatados = horarios.map(horario => ({
      ...horario,
      diaSemanaNome: diasSemana[horario.diaSemana]
    }));

    res.json({
      total: horariosFormatados.length,
      horarios: horariosFormatados
    });
  } catch (error) {
    console.error('Erro ao listar horários:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
};

// Buscar horário por ID
export const buscarHorario = async (req, res) => {
  try {
    const { id } = req.params;
    const medicoId = req.user._id;

    const horario = await HorarioDisponibilidade.findOne({ 
      _id: id, 
      medicoId 
    }).lean();

    if (!horario) {
      return res.status(404).json({ message: 'Horário não encontrado' });
    }

    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    horario.diaSemanaNome = diasSemana[horario.diaSemana];

    res.json(horario);
  } catch (error) {
    console.error('Erro ao buscar horário:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
};

// Atualizar horário
export const atualizarHorario = async (req, res) => {
  try {
    const { id } = req.params;
    const medicoId = req.user._id;
    const { diaSemana, horaInicio, horaFim, duracaoConsulta, ativo, observacoes } = req.body;

    const horario = await HorarioDisponibilidade.findOne({ 
      _id: id, 
      medicoId 
    });

    if (!horario) {
      return res.status(404).json({ message: 'Horário não encontrado' });
    }

    // Validar formato de hora se fornecido
    if (horaInicio || horaFim) {
      const horaRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      const inicio = horaInicio || horario.horaInicio;
      const fim = horaFim || horario.horaFim;
      
      if (horaInicio && !horaRegex.test(horaInicio)) {
        return res.status(400).json({ 
          message: 'Formato de horaInicio inválido. Use HH:MM' 
        });
      }
      
      if (horaFim && !horaRegex.test(horaFim)) {
        return res.status(400).json({ 
          message: 'Formato de horaFim inválido. Use HH:MM' 
        });
      }

      // Validar que horaFim > horaInicio
      const inicioParts = inicio.split(':').map(Number);
      const fimParts = fim.split(':').map(Number);
      const inicioMinutos = inicioParts[0] * 60 + inicioParts[1];
      const fimMinutos = fimParts[0] * 60 + fimParts[1];
      
      if (fimMinutos <= inicioMinutos) {
        return res.status(400).json({ 
          message: 'Hora de fim deve ser maior que hora de início' 
        });
      }
    }

    // Atualizar campos
    if (diaSemana !== undefined) horario.diaSemana = diaSemana;
    if (horaInicio) horario.horaInicio = horaInicio;
    if (horaFim) horario.horaFim = horaFim;
    if (duracaoConsulta !== undefined) horario.duracaoConsulta = duracaoConsulta;
    if (ativo !== undefined) horario.ativo = ativo;
    if (observacoes !== undefined) horario.observacoes = observacoes;

    horario.updatedAt = new Date();
    await horario.save();

    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const horarioAtualizado = horario.toObject();
    horarioAtualizado.diaSemanaNome = diasSemana[horarioAtualizado.diaSemana];

    res.json({
      message: 'Horário atualizado com sucesso',
      horario: horarioAtualizado
    });
  } catch (error) {
    console.error('Erro ao atualizar horário:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
};

// Deletar horário
export const deletarHorario = async (req, res) => {
  try {
    const { id } = req.params;
    const medicoId = req.user._id;

    const horario = await HorarioDisponibilidade.findOne({ 
      _id: id, 
      medicoId 
    });

    if (!horario) {
      return res.status(404).json({ message: 'Horário não encontrado' });
    }

    await HorarioDisponibilidade.deleteOne({ _id: id });

    res.json({
      message: 'Horário deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar horário:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
};

// Obter horários disponíveis para um médico em uma data específica
// Esta rota é pública e não requer autenticação
export const obterHorariosDisponiveis = async (req, res) => {
  try {
    const { medicoId } = req.params;
    const { data } = req.query; // Formato: YYYY-MM-DD

    if (!medicoId) {
      return res.status(400).json({ 
        message: 'ID do médico é obrigatório' 
      });
    }

    if (!data) {
      return res.status(400).json({ 
        message: 'Parâmetro data é obrigatório (formato: YYYY-MM-DD)' 
      });
    }

    const dataConsulta = new Date(data);
    const diaSemana = dataConsulta.getDay(); // 0 = Domingo, 6 = Sábado

    // Buscar horários cadastrados para esse dia da semana
    const horariosCadastrados = await HorarioDisponibilidade.find({
      medicoId,
      diaSemana,
      ativo: true
    }).sort({ horaInicio: 1 });

    if (horariosCadastrados.length === 0) {
      return res.json({
        data,
        diaSemana,
        horariosDisponiveis: [],
        message: 'Nenhum horário cadastrado para este dia'
      });
    }

    // Buscar agendamentos já feitos para essa data
    const inicioDia = new Date(dataConsulta);
    inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(dataConsulta);
    fimDia.setHours(23, 59, 59, 999);

    const agendamentos = await Agendamento.find({
      medicoId,
      dataHora: {
        $gte: inicioDia,
        $lte: fimDia
      },
      status: { $in: ['agendada', 'confirmada'] }
    }).lean();

    // Gerar slots de horários disponíveis
    const horariosDisponiveis = [];
    
    horariosCadastrados.forEach(horario => {
      const [horaInicio, minutoInicio] = horario.horaInicio.split(':').map(Number);
      const [horaFim, minutoFim] = horario.horaFim.split(':').map(Number);
      
      let horaAtual = horaInicio;
      let minutoAtual = minutoInicio;
      
      while (horaAtual < horaFim || (horaAtual === horaFim && minutoAtual < minutoFim)) {
        const slotHora = `${String(horaAtual).padStart(2, '0')}:${String(minutoAtual).padStart(2, '0')}`;
        const slotDataHora = new Date(dataConsulta);
        slotDataHora.setHours(horaAtual, minutoAtual, 0, 0);
        
        // Verificar se o slot não está ocupado
        const ocupado = agendamentos.some(agendamento => {
          const agendamentoHora = new Date(agendamento.dataHora);
          const diferencaMinutos = Math.abs(
            (agendamentoHora.getHours() * 60 + agendamentoHora.getMinutes()) - 
            (horaAtual * 60 + minutoAtual)
          );
          return diferencaMinutos < horario.duracaoConsulta;
        });

        if (!ocupado && slotDataHora > new Date()) {
          horariosDisponiveis.push({
            hora: slotHora,
            dataHora: slotDataHora.toISOString(),
            duracao: horario.duracaoConsulta,
            disponivel: true
          });
        }

        // Avançar para o próximo slot
        minutoAtual += horario.duracaoConsulta;
        if (minutoAtual >= 60) {
          horaAtual += Math.floor(minutoAtual / 60);
          minutoAtual = minutoAtual % 60;
        }
      }
    });

    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

    res.json({
      data,
      diaSemana,
      diaSemanaNome: diasSemana[diaSemana],
      horariosDisponiveis,
      total: horariosDisponiveis.length
    });
  } catch (error) {
    console.error('Erro ao obter horários disponíveis:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
};

