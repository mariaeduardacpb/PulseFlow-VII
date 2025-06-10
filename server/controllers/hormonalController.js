import Hormonal from '../models/Hormonal.js';
import Paciente from '../models/Paciente.js';

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
    console.error('Erro ao registrar hormonal:', error);
    res.status(500).json({ message: 'Erro ao registrar hormonal' });
  }
};

// Médico busca dados hormonais por CPF
export const buscarHormonalMedico = async (req, res) => {
  const { cpf, month, year } = req.query;

  try {
    const paciente = await Paciente.findOne({ cpf: cpf?.replace(/[^\d]/g, '') });
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const registros = await Hormonal.find({
      paciente: paciente._id,
      data: { $gte: startDate, $lt: endDate }
    }).sort({ data: 1 });

    const data = registros.map(r => ({
      dia: new Date(r.data).getDate(),
      hormonio: r.hormonio,
      valor: r.valor
    }));

    res.json({ data });
  } catch (error) {
    console.error('Erro ao buscar dados hormonais:', error);
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

    const registros = await Hormonal.find({
      paciente: pacienteId,
      data: { $gte: startDate, $lt: endDate }
    }).sort({ data: 1 });

    const data = registros.map(r => ({
      dia: new Date(r.data).getDate(),
      hormonio: r.hormonio,
      valor: r.valor
    }));

    res.json({ data });
  } catch (error) {
    console.error('Erro ao buscar hormonais próprios:', error);
    res.status(500).json({ message: 'Erro interno ao buscar hormonais' });
  }
};
