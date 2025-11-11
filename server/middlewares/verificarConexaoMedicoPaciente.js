import ConexaoMedicoPaciente from '../models/ConexaoMedicoPaciente.js';
import Paciente from '../models/Paciente.js';

export const verificarConexaoMedicoPaciente = async (req, res, next) => {
  try {
    const medicoId = req.user._id;
    const cpf = req.query.cpf || req.params.cpf || req.body.cpf;

    if (!cpf) {
      return res.status(400).json({ 
        message: 'CPF do paciente é obrigatório para verificar conexão' 
      });
    }

    const cpfLimpo = cpf.replace(/\D/g, '');
    
    let paciente = await Paciente.findOne({ cpf: cpfLimpo });
    
    if (!paciente) {
      const cpfFormatado = cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      paciente = await Paciente.findOne({ cpf: cpfFormatado });
    }

    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    const conexaoAtiva = await ConexaoMedicoPaciente.findOne({
      pacienteId: paciente._id,
      medicoId: medicoId,
      isActive: true
    });

    if (!conexaoAtiva) {
      return res.status(403).json({ 
        message: 'Acesso negado. Você não tem uma conexão ativa com este paciente. Por favor, solicite acesso novamente.',
        codigo: 'CONEXAO_INATIVA'
      });
    }

    req.paciente = paciente;
    req.conexaoAtiva = conexaoAtiva;
    next();
  } catch (error) {
    console.error('Erro ao verificar conexão médico-paciente:', error);
    res.status(500).json({ 
      message: 'Erro ao verificar conexão com o paciente',
      error: error.message 
    });
  }
};

