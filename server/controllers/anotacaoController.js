import AnotacaoMedica from '../models/AnotacaoMedica.js';
import Paciente from '../models/Paciente.js';

export const salvarAnotacao = async (req, res) => {
  try {
    const { cpf, titulo, data, categoria, tipoConsulta, medico, anotacao } = req.body;
    
    // Tentar buscar com CPF limpo primeiro
    let paciente = await Paciente.findOne({ cpf: cpf?.replace(/[^\d]/g, '') });
    
    // Se não encontrar, tentar com CPF formatado
    if (!paciente) {
      const cpfFormatado = cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      paciente = await Paciente.findOne({ cpf: cpfFormatado });
    }
    
    // Se ainda não encontrar, tentar com o CPF original
    if (!paciente) {
      paciente = await Paciente.findOne({ cpf: cpf });
    }

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
    res.status(500).json({ message: 'Erro interno ao salvar anotação' });
  }
};

export const buscarAnotacoesPorPaciente = async (req, res) => {
  try {
    const { cpf } = req.params;
    
    // Tentar buscar com CPF limpo primeiro
    let paciente = await Paciente.findOne({ cpf: cpf?.replace(/[^\d]/g, '') });
    
    // Se não encontrar, tentar com CPF formatado
    if (!paciente) {
      const cpfFormatado = cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      paciente = await Paciente.findOne({ cpf: cpfFormatado });
    }
    
    // Se ainda não encontrar, tentar com o CPF original
    if (!paciente) {
      paciente = await Paciente.findOne({ cpf: cpf });
    }

    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    const anotacoes = await AnotacaoMedica.find({ pacienteId: paciente._id })
      .populate('pacienteId', 'name nome cpf email')
      .sort({ data: -1 });

    res.status(200).json(anotacoes);
  } catch (error) {
    res.status(500).json({ message: 'Erro interno ao buscar anotações' });
  }
};

export const buscarCategorias = async (req, res) => {
  try {
    const categorias = await AnotacaoMedica.distinct('categoria');
    res.status(200).json(categorias);
  } catch (error) {
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
    res.status(500).json({ message: 'Erro interno ao excluir anotação' });
  }
};

// Médico busca anotações de um paciente pelo CPF
export const buscarAnotacoesMedico = async (req, res) => {
  try {
    const { cpf } = req.query;

    // Tentar buscar com CPF limpo primeiro
    let paciente = await Paciente.findOne({ cpf: cpf?.replace(/[^\d]/g, '') });
    
    // Se não encontrar, tentar com CPF formatado
    if (!paciente) {
      const cpfFormatado = cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      paciente = await Paciente.findOne({ cpf: cpfFormatado });
    }
    
    // Se ainda não encontrar, tentar com o CPF original
    if (!paciente) {
      paciente = await Paciente.findOne({ cpf: cpf });
    }

    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    const anotacoes = await AnotacaoMedica.find({ pacienteId: paciente._id })
      .populate('pacienteId', 'name nome cpf email')
      .sort({ data: -1 });

    res.json(anotacoes);
  } catch (error) {
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
