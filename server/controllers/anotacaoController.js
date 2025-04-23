import AnotacaoMedica from '../models/AnotacaoMedica.js';
import Paciente from '../models/Paciente.js';

export const salvarAnotacao = async (req, res) => {
  try {
    const { cpf, titulo, data, categoria, medico, anotacao } = req.body;
    
    const paciente = await Paciente.findOne({ cpf: cpf.replace(/[^\d]/g, '') });
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    const novaAnotacao = new AnotacaoMedica({
      pacienteId: paciente._id,
      titulo,
      data: new Date(data),
      categoria,
      medico,
      anotacao
    });

    await novaAnotacao.save();
    res.status(201).json({ message: 'Anotação salva com sucesso!' });
  } catch (error) {
    console.error('Erro ao salvar anotação:', error);
    res.status(500).json({ message: 'Erro interno ao salvar anotação' });
  }
};
