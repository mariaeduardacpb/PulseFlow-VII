import PressaoArterial from '../models/PressaoArterial.js';
import Paciente from '../models/Paciente.js';

export const registrarPressao = async (req, res) => {
  const { data, pressao } = req.body;
  const pacienteId = req.user.id;

  try {
    const [sistolicaStr, diastolicaStr] = pressao.split('/');
    const sistolica = Number(sistolicaStr);
    const diastolica = Number(diastolicaStr);

    if (isNaN(sistolica) || isNaN(diastolica)) {
      return res.status(400).json({ message: 'Formato inválido de pressão. Use o formato 120/80.' });
    }

    const [ano, mes, dia] = data.split('-');
    const dataCorrigida = new Date(ano, mes - 1, dia, 12);

    const novoRegistro = new PressaoArterial({
      paciente: pacienteId,
      data: dataCorrigida,
      sistolica,
      diastolica
    });

    await novoRegistro.save();
    res.status(201).json({ message: 'Pressão registrada com sucesso' });
  } catch (error) {
    console.error('Erro ao registrar pressão:', error);
    res.status(500).json({ message: 'Erro ao registrar pressão arterial' });
  }
};

export const buscarPressaoMedico = async (req, res) => {
  const { cpf, month, year } = req.query;

  try {
    const paciente = await Paciente.findOne({ cpf: cpf?.replace(/[^\d]/g, '') });
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const registros = await PressaoArterial.find({
      paciente: paciente._id,
      data: { $gte: startDate, $lt: endDate }
    }).sort({ data: 1 });

    const data = registros.map(r => ({
      dia: new Date(r.data).getDate(),
      sistolica: r.sistolica,
      diastolica: r.diastolica
    }));

    res.json({ paciente: paciente.nome, data });
  } catch (error) {
    console.error('Erro ao buscar dados de pressão:', error);
    res.status(500).json({ message: 'Erro ao buscar dados de pressão arterial' });
  }
};

export const buscarPressaoPaciente = async (req, res) => {
  const pacienteId = req.user.id;
  const { month, year } = req.query;

  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const registros = await PressaoArterial.find({
      paciente: pacienteId,
      data: { $gte: startDate, $lt: endDate }
    }).sort({ data: 1 });

    const data = registros.map(r => ({
      dia: new Date(r.data).getDate(),
      sistolica: r.sistolica,
      diastolica: r.diastolica
    }));

    res.json({ data });
  } catch (error) {
    console.error('Erro ao buscar dados do paciente:', error);
    res.status(500).json({ message: 'Erro ao buscar dados de pressão arterial' });
  }
};
