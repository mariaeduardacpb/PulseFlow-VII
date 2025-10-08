import Paciente from '../models/Paciente.js';

// Gerar código de acesso para o paciente
export const gerarCodigoAcesso = async (req, res) => {
  const { cpf, patientId, accessCode, expiresAt } = req.body;

  // Se vem do app mobile (com patientId e accessCode)
  if (patientId && accessCode && expiresAt) {
    try {
      const paciente = await Paciente.findById(patientId);
      if (!paciente) {
        return res.status(404).json({ message: 'Paciente não encontrado' });
      }

      // Atualizar paciente com o código recebido do app
      paciente.accessCode = accessCode;
      paciente.accessCodeExpires = new Date(expiresAt);
      await paciente.save();

      res.json({
        message: 'Código de acesso salvo com sucesso',
        codigo: accessCode,
        expiraEm: paciente.accessCodeExpires
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
    }
    return;
  }

  // Se vem da web (com CPF)
  if (!cpf) {
    return res.status(400).json({ message: 'CPF é obrigatório' });
  }

  try {
    // Limpar CPF removendo caracteres não numéricos
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    // Validar se CPF tem 11 dígitos
    if (cpfLimpo.length !== 11) {
      return res.status(400).json({ message: 'CPF deve ter 11 dígitos' });
    }

    // Buscar paciente
    let paciente = await Paciente.findOne({ cpf: cpfLimpo });
    
    if (!paciente) {
      const cpfFormatado = cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      paciente = await Paciente.findOne({ cpf: cpfFormatado });
    }

    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    // Gerar código de 6 dígitos
    const codigoAcesso = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Definir expiração para 2 minutos
    const dataExpiracao = new Date();
    dataExpiracao.setMinutes(dataExpiracao.getMinutes() + 2);

    // Atualizar paciente com o novo código
    paciente.accessCode = codigoAcesso;
    paciente.accessCodeExpires = dataExpiracao;
    await paciente.save();

    res.json({
      message: 'Código de acesso gerado com sucesso',
      codigo: codigoAcesso,
      expiraEm: dataExpiracao
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
  }
};

// Verificar se código de acesso é válido
export const verificarCodigoAcesso = async (req, res) => {
  const { codigoAcesso, patientId } = req.body;

  if (!codigoAcesso) {
    return res.status(400).json({ message: 'Código de acesso é obrigatório' });
  }

  try {
    // Validar se código tem 6 dígitos
    if (codigoAcesso.length !== 6) {
      return res.status(400).json({ message: 'Código de acesso deve ter 6 dígitos' });
    }

    let paciente;

    // Se tem patientId, buscar por ID primeiro
    if (patientId) {
      paciente = await Paciente.findById(patientId);
      if (!paciente) {
        return res.status(404).json({ message: 'Paciente não encontrado' });
      }
      
      // Verificar se o código do paciente corresponde
      if (paciente.accessCode !== codigoAcesso) {
        return res.status(401).json({ message: 'Código de acesso inválido' });
      }
    } else {
      // Buscar paciente pelo código de acesso
      paciente = await Paciente.findOne({ accessCode: codigoAcesso });
      if (!paciente) {
        return res.status(404).json({ message: 'Código de acesso não encontrado' });
      }
    }

    // Verificar se o código não expirou
    if (!paciente.accessCodeExpires || new Date() > paciente.accessCodeExpires) {
      return res.status(401).json({ message: 'Código de acesso expirado' });
    }

    res.json({
      message: 'Código de acesso válido',
      valido: true,
      paciente: {
        id: paciente._id,
        nome: paciente.name || paciente.nome,
        cpf: paciente.cpf
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
  }
};

// Rota de teste para verificar conexão
export const testConnection = async (req, res) => {
  res.json({ 
    message: 'Conexão com o backend funcionando!',
    timestamp: new Date().toISOString(),
    status: 'ok'
  });
};
