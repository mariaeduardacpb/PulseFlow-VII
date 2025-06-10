// controllers/insoniaController.js
import Insonia from '../models/Insonia.js';
import Paciente from '../models/Paciente.js';

// Função auxiliar para converter "7:45" → 7.75
function converterHorasParaDecimal(horasStr) {
  const [horas, minutos] = horasStr.split(':').map(Number);
  return horas + minutos / 60;
}

// Paciente registra sua insônia
export const registrarInsonia = async (req, res) => {
  const { data, horasSono, qualidadeSono } = req.body;
  const pacienteId = req.user.id;

  try {
    const [ano, mes, dia] = data.split('-');
    const dataCorrigida = new Date(ano, mes - 1, dia, 12);

    const horasConvertidas = isNaN(horasSono) ? converterHorasParaDecimal(horasSono) : parseFloat(horasSono);

    const novoRegistro = new Insonia({
      paciente: pacienteId,
      data: dataCorrigida,
      horasSono: horasConvertidas,
      qualidadeSono: Number(qualidadeSono)
    });

    await novoRegistro.save();
    res.status(201).json({ message: 'Registro de insônia salvo com sucesso' });
  } catch (error) {
    console.error('Erro ao registrar insônia:', error);
    res.status(500).json({ message: 'Erro ao registrar insônia' });
  }
};

// Médico busca dados de um paciente pelo CPF
export const buscarInsoniaMedico = async (req, res) => {
  const { cpf, month, year } = req.query;

  try {
    const paciente = await Paciente.findOne({ cpf: cpf?.replace(/[^\d]/g, '') });
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const registros = await Insonia.find({
      paciente: paciente._id,
      data: { $gte: startDate, $lt: endDate }
    }).sort({ data: 1 });

    const data = registros.map(r => ({
      dia: new Date(r.data).getDate(),
      horasSono: r.horasSono,
      qualidadeSono: r.qualidadeSono
    }));

    res.json({ paciente: paciente.nome, data });
  } catch (error) {
    console.error('Erro ao buscar dados de insônia por CPF:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Paciente busca seus próprios dados
export const buscarInsoniaPaciente = async (req, res) => {
  const pacienteId = req.user.id;
  const { month, year } = req.query;

  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const registros = await Insonia.find({
      paciente: pacienteId,
      data: { $gte: startDate, $lt: endDate }
    }).sort({ data: 1 });

    const data = registros.map(r => ({
      dia: new Date(r.data).getDate(),
      horasSono: r.horasSono,
      qualidadeSono: r.qualidadeSono
    }));

    res.json({ data });
  } catch (error) {
    console.error('Erro ao buscar dados de insônia do próprio paciente:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
