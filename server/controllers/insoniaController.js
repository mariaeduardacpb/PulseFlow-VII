// controllers/insoniaController.js
import Insonia from '../models/Insonia.js';
import Paciente from '../models/Paciente.js';

// Paciente registra dados de sono
export const registrarInsonia = async (req, res) => {
  const { data, valor } = req.body;
  const pacienteId = req.user.id;

  try {
    const [ano, mes, dia] = data.split('-');
    const dataCorrigida = new Date(ano, mes - 1, dia, 12);

    const novoRegistro = new Insonia({
      pacienteId: pacienteId,
      data: dataCorrigida,
      valor: Number(valor)
    });

    await novoRegistro.save();
    res.status(201).json({ message: 'Registro de sono salvo com sucesso' });
  } catch (error) {
    console.error('Erro ao registrar sono:', error);
    res.status(500).json({ message: 'Erro ao registrar sono' });
  }
};

// Médico busca dados de sono por CPF
export const buscarInsoniaMedico = async (req, res) => {
  const { cpf, month, year } = req.query;

  try {
    let paciente = await Paciente.findOne({ cpf: cpf?.replace(/[^\d]/g, '') });
    if (!paciente) {
      const cpfFormatado = cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      paciente = await Paciente.findOne({ cpf: cpfFormatado });
    }
    
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const registros = await Insonia.find({
      pacienteId: paciente._id.toString(),
      data: { $gte: startDate, $lt: endDate }
    }).sort({ data: 1 });

    const data = registros.map(r => ({
      dia: new Date(r.data).getDate(),
      valor: r.valor
    }));

    res.json({ paciente: paciente.nome, data });
  } catch (error) {
    console.error('Erro ao buscar dados de sono:', error);
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
      pacienteId: pacienteId,
      data: { $gte: startDate, $lt: endDate }
    }).sort({ data: 1 });

    const data = registros.map(r => ({
      dia: new Date(r.data).getDate(),
      valor: r.valor
    }));

    res.json({ data });
  } catch (error) {
    console.error('Erro ao buscar dados de sono do paciente:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
