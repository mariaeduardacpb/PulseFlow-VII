import CicloMenstrual from '../models/CicloMenstrual.js';
import Paciente from '../models/Paciente.js';

export const salvarCiclo = async (req, res) => {
  try {
    const { cpf, dataInicio, dataFim } = req.body;

    const paciente = await Paciente.findOne({ cpf: cpf.replace(/[^\d]/g, '') });
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    const novoCiclo = new CicloMenstrual({
      pacienteId: paciente._id,
      dataInicio: new Date(dataInicio),
      dataFim: new Date(dataFim)
    });

    await novoCiclo.save();
    res.status(201).json({ message: 'Ciclo salvo com sucesso!' });
  } catch (err) {
    console.error('Erro ao salvar ciclo:', err);
    res.status(500).json({ message: 'Erro interno ao salvar ciclo' });
  }
};

export const listarCiclos = async (req, res) => {
  try {
    const { cpf } = req.params;

    const paciente = await Paciente.findOne({ cpf: cpf.replace(/[^\d]/g, '') });
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    const ciclos = await CicloMenstrual.find({ pacienteId: paciente._id });
    res.status(200).json(ciclos);
  } catch (err) {
    console.error('Erro ao buscar ciclos:', err);
    res.status(500).json({ message: 'Erro interno ao buscar ciclos' });
  }
};
