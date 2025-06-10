import AnotacaoMedica from '../models/AnotacaoMedica.js';
import Paciente from '../models/Paciente.js';

export const salvarAnotacao = async (req, res) => {
  try {
    const { cpf, titulo, data, categoria, tipoConsulta, medico, anotacao } = req.body;
    
    const paciente = await Paciente.findOne({ cpf: cpf.replace(/[^\d]/g, '') });
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    const novaAnotacao = new AnotacaoMedica({
      pacienteId: paciente._id,
      titulo,
      data: new Date(data),
      categoria,
      tipoConsulta,
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

export const buscarAnotacoesPorPaciente = async (req, res) => {
  try {
    const { cpf } = req.params;
    
    const paciente = await Paciente.findOne({ cpf: cpf.replace(/[^\d]/g, '') });
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    const anotacoes = await AnotacaoMedica.find({ pacienteId: paciente._id })
      .sort({ data: -1 });

    res.status(200).json(anotacoes);
  } catch (error) {
    console.error('Erro ao buscar anotações:', error);
    res.status(500).json({ message: 'Erro interno ao buscar anotações' });
  }
};

export const buscarCategorias = async (req, res) => {
  try {
    const categorias = await AnotacaoMedica.distinct('categoria');
    res.status(200).json(categorias);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ message: 'Erro interno ao buscar categorias' });
  }
  
};

export const buscarAnotacaoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const anotacao = await AnotacaoMedica.findById(id);

    if (!anotacao) {
      return res.status(404).json({ message: 'Anotação não encontrada' });
    }

    res.status(200).json(anotacao);
  } catch (error) {
    console.error('Erro ao buscar anotação por ID:', error);
    res.status(500).json({ message: 'Erro interno ao buscar anotação' });
  }
};

export const deleteAnotacao = async (req, res) => {
  try {
    const { id } = req.params;
    const anotacao = await AnotacaoMedica.findByIdAndDelete(id);

    if (!anotacao) {
      return res.status(404).json({ message: 'Anotação não encontrada' });
    }

    res.status(200).json({ message: 'Anotação excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir anotação:', error);
    res.status(500).json({ message: 'Erro interno ao excluir anotação' });
  }
};
