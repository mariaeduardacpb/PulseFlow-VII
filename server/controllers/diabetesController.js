
// controllers/diabetesController.js
import Diabetes from '../models/Diabetes.js';
import Paciente from '../models/Paciente.js';

// Paciente registra sua glicemia
export const registrarDiabetes = async (req, res) => {
  const { data, nivelGlicemia } = req.body;
  const pacienteId = req.user.id;

  try {
    const [ano, mes, dia] = data.split('-');
    const dataCorrigida = new Date(ano, mes - 1, dia, 12);

    const novoRegistro = new Diabetes({
      paciente: pacienteId,
      data: dataCorrigida,
      nivelGlicemia: Number(nivelGlicemia)
    });

    await novoRegistro.save();
    res.status(201).json({ message: 'Registro de glicemia salvo com sucesso' });
  } catch (error) {
    console.error('Erro ao registrar glicemia:', error);
    res.status(500).json({ message: 'Erro ao registrar glicemia' });
  }
};

// Médico busca dados de um paciente pelo CPF
export const buscarDiabetesMedico = async (req, res) => {
  const { cpf, month, year } = req.query;

  try {
    const paciente = await Paciente.findOne({ cpf: cpf?.replace(/[^\d]/g, '') });
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const registros = await Diabetes.find({
      paciente: paciente._id,
      data: { $gte: startDate, $lt: endDate }
    }).sort({ data: 1 });

    const data = registros.map(r => ({
      dia: new Date(r.data).getDate(),
      nivelGlicemia: r.nivelGlicemia
    }));

    res.json({ paciente: paciente.nome, data });
  } catch (error) {
    console.error('Erro ao buscar dados de glicemia por CPF:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Paciente busca seus próprios dados
export const buscarDiabetesPaciente = async (req, res) => {
  const pacienteId = req.user.id;
  const { month, year } = req.query;

  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const registros = await Diabetes.find({
      paciente: pacienteId,
      data: { $gte: startDate, $lt: endDate }
    }).sort({ data: 1 });

    const data = registros.map(r => ({
      dia: new Date(r.data).getDate(),
      nivelGlicemia: r.nivelGlicemia
    }));

    res.json({ data });
  } catch (error) {
    console.error('Erro ao buscar dados de glicemia do próprio paciente:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
