import mongoose from 'mongoose';
import Hormonal from '../models/Hormonal.js';
import Paciente from '../models/Paciente.js';

const montarFiltroPaciente = (identificador) => {
  const valores = [];
  if (!identificador) {
    return null;
  }

  if (identificador instanceof mongoose.Types.ObjectId) {
    valores.push(identificador, identificador.toString());
  } else {
    valores.push(identificador);
    if (mongoose.Types.ObjectId.isValid(identificador)) {
      valores.push(new mongoose.Types.ObjectId(identificador));
    }
  }

  return { $in: valores };
};

const filtrarRegistrosPorPeriodo = (registros, startDate, endDate) => {
  return registros
    .map(registro => {
      const dataRegistro = new Date(registro.data);
      return { registro, dataRegistro, timestamp: dataRegistro.getTime() };
    })
    .filter(({ timestamp, dataRegistro }) => !Number.isNaN(timestamp) && dataRegistro >= startDate && dataRegistro < endDate)
    .map(({ registro, dataRegistro }) => ({
      ...registro,
      data: dataRegistro,
      dia: dataRegistro.getDate()
    }));
};

// Paciente registra dados hormonais
export const registrarHormonal = async (req, res) => {
  const { hormonio, valor, data } = req.body;
  const pacienteId = req.user.id;

  try {
    const [ano, mes, dia] = data.split('-');
    const dataCorrigida = new Date(ano, mes - 1, dia, 12);

    const novoRegistro = new Hormonal({
      paciente: pacienteId,
      hormonio,
      valor,
      data: dataCorrigida
    });

    await novoRegistro.save();
    res.status(201).json({ message: 'Registro hormonal salvo com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao registrar hormonal' });
  }
};

// Médico busca dados hormonais por CPF
export const buscarHormonalMedico = async (req, res) => {
  const { cpf, month, year, pacienteId } = req.query;

  try {
    let paciente = null;

    if (pacienteId) {
      paciente = await Paciente.findById(pacienteId);
    }

    if (!paciente && cpf) {
      const cpfLimpo = cpf.replace(/[^\d]/g, '');
      paciente = await Paciente.findOne({ cpf: cpfLimpo });
      if (!paciente) {
        const cpfFormatado = cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        paciente = await Paciente.findOne({ cpf: cpfFormatado });
      }
    }
    
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const filtroPaciente = montarFiltroPaciente(paciente._id);
    const registros = await Hormonal.find({
      paciente: filtroPaciente || paciente._id
    }).sort({ data: 1 }).lean();

    const data = filtrarRegistrosPorPeriodo(registros, startDate, endDate);

    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno ao buscar hormonais' });
  }
};

// Paciente busca seus próprios hormonais
export const buscarHormonalPaciente = async (req, res) => {
  const pacienteId = req.user.id;
  const { month, year } = req.query;

  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const filtroPaciente = montarFiltroPaciente(pacienteId);
    const registros = await Hormonal.find({
      paciente: filtroPaciente || pacienteId
    }).sort({ data: 1 }).lean();

    const data = filtrarRegistrosPorPeriodo(registros, startDate, endDate);

    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno ao buscar hormonais' });
  }
};
