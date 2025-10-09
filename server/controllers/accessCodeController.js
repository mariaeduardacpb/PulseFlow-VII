import Paciente from '../models/Paciente.js';
import SolicitacaoAcesso from '../models/SolicitacaoAcesso.js';

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
  const { codigoAcesso, accessCode, patientId } = req.body;

  // Aceitar tanto codigoAcesso (web) quanto accessCode (app)
  const codigo = codigoAcesso || accessCode;

  if (!codigo) {
    return res.status(400).json({ message: 'Código de acesso é obrigatório' });
  }

  try {
    // Validar se código tem 6 dígitos
    if (codigo.length !== 6) {
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
      if (paciente.accessCode !== codigo) {
        return res.status(401).json({ message: 'Código de acesso inválido' });
      }
    } else {
      // Buscar paciente pelo código de acesso
      paciente = await Paciente.findOne({ accessCode: codigo });
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

// Notificar paciente quando médico solicita acesso
export const notificarSolicitacaoAcesso = async (req, res) => {
  const { cpf, medicoNome, especialidade } = req.body;

  if (!cpf) {
    return res.status(400).json({ message: 'CPF é obrigatório' });
  }

  try {
    // Limpar CPF
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    // Buscar paciente
    let paciente = await Paciente.findOne({ cpf: cpfLimpo });
    
    if (!paciente) {
      const cpfFormatado = cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      paciente = await Paciente.findOne({ cpf: cpfFormatado });
    }

    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    // Criar registro de solicitação de acesso
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Expira em 10 minutos

    const solicitacao = new SolicitacaoAcesso({
      pacienteId: paciente._id.toString(),
      pacienteCpf: paciente.cpf,
      medicoNome: medicoNome || 'Não informado',
      medicoEspecialidade: especialidade || 'Não informada',
      dataHora: new Date(),
      visualizada: false,
      expiresAt: expiresAt
    });

    await solicitacao.save();

    console.log('✅ Solicitação de acesso registrada:', {
      paciente: paciente.name || paciente.nome,
      medico: medicoNome,
      especialidade: especialidade
    });

    res.json({
      message: 'Solicitação de acesso registrada. O paciente será notificado.',
      notificacaoRegistrada: true,
      paciente: {
        nome: paciente.name || paciente.nome,
        cpf: paciente.cpf
      }
    });
  } catch (error) {
    console.error('❌ Erro ao registrar solicitação:', error);
    res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
  }
};

// Buscar solicitações de acesso pendentes para um paciente
export const buscarSolicitacoesPendentes = async (req, res) => {
  const { patientId } = req.params;

  if (!patientId) {
    return res.status(400).json({ message: 'ID do paciente é obrigatório' });
  }

  try {
    // Buscar solicitações não visualizadas e não expiradas
    const solicitacoes = await SolicitacaoAcesso.find({
      pacienteId: patientId,
      visualizada: false,
      expiresAt: { $gt: new Date() }
    }).sort({ dataHora: -1 });

    res.json({
      total: solicitacoes.length,
      solicitacoes: solicitacoes.map(s => ({
        id: s._id,
        medicoNome: s.medicoNome,
        especialidade: s.medicoEspecialidade,
        dataHora: s.dataHora,
        visualizada: s.visualizada
      }))
    });
  } catch (error) {
    console.error('❌ Erro ao buscar solicitações:', error);
    res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
  }
};

// Marcar solicitação como visualizada
export const marcarSolicitacaoVisualizada = async (req, res) => {
  const { solicitacaoId } = req.params;

  try {
    const solicitacao = await SolicitacaoAcesso.findByIdAndUpdate(
      solicitacaoId,
      { visualizada: true },
      { new: true }
    );

    if (!solicitacao) {
      return res.status(404).json({ message: 'Solicitação não encontrada' });
    }

    res.json({
      message: 'Solicitação marcada como visualizada',
      solicitacao: {
        id: solicitacao._id,
        visualizada: solicitacao.visualizada
      }
    });
  } catch (error) {
    console.error('❌ Erro ao marcar solicitação:', error);
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
