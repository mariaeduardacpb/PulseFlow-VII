// routes/pacienteRoutes.js
import express from 'express';
import Paciente from '../models/Paciente.js';
import ConexaoMedicoPaciente from '../models/ConexaoMedicoPaciente.js';
import User from '../models/User.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Médico busca paciente pelo CPF
router.get('/buscar', async (req, res) => {
  const { cpf } = req.query;

  if (!cpf) return res.status(400).json({ message: 'CPF é obrigatório' });

  try {
    // Limpar CPF removendo caracteres não numéricos
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    // Validar se CPF tem 11 dígitos
    if (cpfLimpo.length !== 11) {
      return res.status(400).json({ message: 'CPF deve ter 11 dígitos' });
    }

    // Tentar buscar com CPF limpo
    let paciente = await Paciente.findOne({ cpf: cpfLimpo });
    
    // Se não encontrar, tentar com CPF formatado
    if (!paciente) {
      const cpfFormatado = cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      paciente = await Paciente.findOne({ cpf: cpfFormatado });
    }
    
    // Se ainda não encontrar, listar todos os CPFs para debug
    if (!paciente) {
      const todosPacientes = await Paciente.find({}, { cpf: 1, name: 1 });
    }

    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    res.json({
      id: paciente._id,
      nome: paciente.name || paciente.nome,
      cpf: paciente.cpf,
      email: paciente.email,
      genero: paciente.gender || paciente.genero,
      altura: paciente.height || paciente.altura,
      peso: paciente.weight || paciente.peso,
      dataNascimento: paciente.birthDate || paciente.dataNascimento,
      nacionalidade: paciente.nationality || paciente.nacionalidade,
      profissao: paciente.profession || paciente.profissao,
      telefone: paciente.phone || paciente.telefone,
      fotoPerfil: paciente.profilePhoto || paciente.fotoPerfil,
      rg: paciente.rg,
      endereco: paciente.address,
      estadoCivil: paciente.maritalStatus,
      isAdmin: paciente.isAdmin
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro interno do servidor', error: err.message });
  }
});

// Médico busca paciente pelo CPF e código de acesso
router.post('/buscar-com-codigo', async (req, res) => {
  const { cpf, codigoAcesso } = req.body;
  const authHeader = req.headers.authorization;

  if (!cpf || !codigoAcesso) {
    return res.status(400).json({ message: 'CPF e código de acesso são obrigatórios' });
  }

  try {
    // Limpar CPF removendo caracteres não numéricos
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    // Validar se CPF tem 11 dígitos
    if (cpfLimpo.length !== 11) {
      return res.status(400).json({ message: 'CPF deve ter 11 dígitos' });
    }

    // Validar se código tem 6 dígitos
    if (codigoAcesso.length !== 6) {
      return res.status(400).json({ message: 'Código de acesso deve ter 6 dígitos' });
    }

    // Tentar buscar com CPF limpo
    let paciente = await Paciente.findOne({ cpf: cpfLimpo });
    
    // Se não encontrar, tentar com CPF formatado
    if (!paciente) {
      const cpfFormatado = cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      paciente = await Paciente.findOne({ cpf: cpfFormatado });
    }

    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    // Verificar se o código de acesso está correto e não expirou
    if (!paciente.accessCode || paciente.accessCode !== codigoAcesso) {
      return res.status(401).json({ message: 'Código de acesso inválido' });
    }

    if (!paciente.accessCodeExpires || new Date() > paciente.accessCodeExpires) {
      return res.status(401).json({ message: 'Código de acesso expirado' });
    }

    // Se tiver token de autenticação, registrar conexão médico-paciente
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = (await import('jsonwebtoken')).default;
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.id || decoded._id) {
          const medicoId = decoded.id || decoded._id;
          const medico = await User.findById(medicoId);
          if (medico) {
            // Desativar conexões anteriores do mesmo paciente
            await ConexaoMedicoPaciente.updateMany(
              { pacienteId: paciente._id, isActive: true },
              { isActive: false, disconnectedAt: new Date() }
            );
            
            // Criar nova conexão
            const novaConexao = new ConexaoMedicoPaciente({
              pacienteId: paciente._id,
              medicoId: medico._id,
              medicoNome: medico.nome,
              medicoEspecialidade: medico.areaAtuacao,
              connectedAt: new Date(),
              isActive: true
            });
            await novaConexao.save();
          }
        }
      } catch (tokenError) {
        console.log('Não foi possível verificar token médico:', tokenError.message);
      }
    }

    // Código válido - retornar dados do paciente
    res.json({
      id: paciente._id,
      nome: paciente.name || paciente.nome,
      cpf: paciente.cpf,
      email: paciente.email,
      genero: paciente.gender || paciente.genero,
      altura: paciente.height || paciente.altura,
      peso: paciente.weight || paciente.peso,
      dataNascimento: paciente.birthDate || paciente.dataNascimento,
      nacionalidade: paciente.nationality || paciente.nacionalidade,
      profissao: paciente.profession || paciente.profissao,
      telefone: paciente.phone || paciente.telefone,
      fotoPerfil: paciente.profilePhoto || paciente.fotoPerfil,
      rg: paciente.rg,
      endereco: paciente.address,
      estadoCivil: paciente.maritalStatus,
      isAdmin: paciente.isAdmin
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro interno do servidor', error: err.message });
  }
});

// Endpoint para paciente consultar médico conectado (deve vir antes de rotas genéricas)
router.get('/:patientId/conexao-ativa', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const conexaoAtiva = await ConexaoMedicoPaciente.findOne({
      pacienteId: patientId,
      isActive: true
    }).sort({ connectedAt: -1 });
    
    if (!conexaoAtiva) {
      return res.json({
        conectado: false,
        medico: null,
        tempoConectado: null
      });
    }
    
    const tempoConectado = Math.floor((new Date() - conexaoAtiva.connectedAt) / 1000);
    
    res.json({
      conectado: true,
      medico: {
        id: conexaoAtiva.medicoId,
        nome: conexaoAtiva.medicoNome,
        especialidade: conexaoAtiva.medicoEspecialidade
      },
      tempoConectado: tempoConectado,
      connectedAt: conexaoAtiva.connectedAt
    });
  } catch (err) {
    console.error('Erro ao buscar conexão ativa:', err);
    res.status(500).json({ message: 'Erro interno do servidor', error: err.message });
  }
});

// Endpoint para verificar se médico logado está conectado ao paciente (por CPF)
router.get('/verificar-conexao/:cpf', async (req, res) => {
  try {
    const { cpf } = req.params;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.json({ conectado: false, mensagem: 'Token não fornecido' });
    }
    
    try {
      const jwt = (await import('jsonwebtoken')).default;
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const medicoId = decoded.id || decoded._id;
      
      if (!medicoId) {
        return res.json({ conectado: false });
      }
      
      const cpfLimpo = cpf.replace(/\D/g, '');
      let paciente = await Paciente.findOne({ cpf: cpfLimpo });
      
      if (!paciente) {
        const cpfFormatado = cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        paciente = await Paciente.findOne({ cpf: cpfFormatado });
      }
      
      if (!paciente) {
        return res.json({ conectado: false, mensagem: 'Paciente não encontrado' });
      }
      
      const conexaoAtiva = await ConexaoMedicoPaciente.findOne({
        pacienteId: paciente._id,
        medicoId: medicoId,
        isActive: true
      }).sort({ connectedAt: -1 });
      
      if (!conexaoAtiva) {
        return res.json({ conectado: false });
      }
      
      res.json({ conectado: true });
    } catch (tokenError) {
      return res.json({ conectado: false, mensagem: 'Token inválido' });
    }
  } catch (err) {
    console.error('Erro ao verificar conexão:', err);
    res.status(500).json({ message: 'Erro interno do servidor', error: err.message });
  }
});

// Endpoint para desconectar médico (deve vir antes de rotas genéricas)
router.post('/:patientId/desconectar-medico', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const resultado = await ConexaoMedicoPaciente.updateMany(
      { pacienteId: patientId, isActive: true },
      { 
        isActive: false, 
        disconnectedAt: new Date() 
      }
    );
    
    if (resultado.modifiedCount === 0) {
      return res.status(404).json({ 
        message: 'Nenhuma conexão ativa encontrada para este paciente' 
      });
    }
    
    res.json({
      message: 'Médico desconectado com sucesso',
      desconectado: true
    });
  } catch (err) {
    console.error('Erro ao desconectar médico:', err);
    res.status(500).json({ message: 'Erro interno do servidor', error: err.message });
  }
});

// Buscar paciente por CPF completo (usado no perfil)
router.get('/perfil/:cpf', async (req, res) => {
  const { cpf } = req.params;

  try {
    // Tentar buscar com CPF limpo primeiro
    let paciente = await Paciente.findOne({ cpf: cpf.replace(/\D/g, '') });
    
    // Se não encontrar, tentar com CPF formatado
    if (!paciente) {
      const cpfFormatado = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      paciente = await Paciente.findOne({ cpf: cpfFormatado });
    }

    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    res.json({
      nome: paciente.name || paciente.nome,
      cpf: paciente.cpf,
      email: paciente.email,
      genero: paciente.gender || paciente.genero,
      altura: paciente.height || paciente.altura,
      peso: paciente.weight || paciente.peso,
      dataNascimento: paciente.birthDate || paciente.dataNascimento,
      nacionalidade: paciente.nationality || paciente.nacionalidade,
      profissao: paciente.profession || paciente.profissao,
      telefone: paciente.phone || paciente.telefone,
      observacoes: paciente.observacoes,
      fotoPerfil: paciente.profilePhoto || paciente.fotoPerfil,
      rg: paciente.rg,
      endereco: paciente.address,
      estadoCivil: paciente.maritalStatus,
      isAdmin: paciente.isAdmin
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro interno do servidor', error: err.message });
  }
});

// Buscar paciente por ID (usado no perfil)
router.get('/id/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const paciente = await Paciente.findById(id);

    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    res.json({
      nome: paciente.name || paciente.nome,
      cpf: paciente.cpf,
      email: paciente.email,
      genero: paciente.gender || paciente.genero,
      altura: paciente.height || paciente.altura,
      peso: paciente.weight || paciente.peso,
      dataNascimento: paciente.birthDate || paciente.dataNascimento,
      nacionalidade: paciente.nationality || paciente.nacionalidade,
      profissao: paciente.profession || paciente.profissao,
      telefone: paciente.phone || paciente.telefone,
      observacoes: paciente.observacoes,
      fotoPerfil: paciente.profilePhoto || paciente.fotoPerfil,
      rg: paciente.rg,
      endereco: paciente.address,
      estadoCivil: paciente.maritalStatus,
      isAdmin: paciente.isAdmin
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro interno do servidor', error: err.message });
  }
});

// Atualizar perfil do paciente (médico pode editar)
router.put('/perfil/:cpf', authMiddleware, async (req, res) => {
  const { cpf } = req.params;

  try {
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    if (cpfLimpo.length !== 11) {
      return res.status(400).json({ message: 'CPF inválido' });
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

    // Atualizar campos permitidos
    const { nome, genero, nacionalidade, altura, peso, profissao, email, telefone, observacoes } = req.body;

    if (nome !== undefined) {
      paciente.name = nome;
      paciente.nome = nome; // Compatibilidade
    }
    if (genero !== undefined) {
      paciente.gender = genero;
      paciente.genero = genero; // Compatibilidade
    }
    if (nacionalidade !== undefined) {
      paciente.nationality = nacionalidade;
      paciente.nacionalidade = nacionalidade; // Compatibilidade
    }
    if (altura !== undefined) {
      paciente.height = altura ? parseFloat(altura) : null;
      paciente.altura = altura ? altura.toString() : null; // Compatibilidade
    }
    if (peso !== undefined) {
      paciente.weight = peso ? parseFloat(peso) : null;
      paciente.peso = peso ? peso.toString() : null; // Compatibilidade
    }
    if (profissao !== undefined) {
      paciente.profession = profissao;
      paciente.profissao = profissao; // Compatibilidade
    }
    if (email !== undefined && email.trim() !== '') {
      paciente.email = email;
    }
    if (telefone !== undefined) {
      paciente.phone = telefone;
      paciente.telefone = telefone; // Compatibilidade
    }
    if (observacoes !== undefined) {
      paciente.observacoes = observacoes;
    }

    await paciente.save();

    res.json({
      message: 'Perfil atualizado com sucesso',
      paciente: {
        nome: paciente.name || paciente.nome,
        genero: paciente.gender || paciente.genero,
        nacionalidade: paciente.nationality || paciente.nacionalidade,
        altura: paciente.height || paciente.altura,
        peso: paciente.weight || paciente.peso,
        profissao: paciente.profession || paciente.profissao,
        email: paciente.email,
        telefone: paciente.phone || paciente.telefone,
        observacoes: paciente.observacoes
      }
    });
  } catch (err) {
    console.error('Erro ao atualizar perfil do paciente:', err);
    res.status(500).json({ message: 'Erro interno do servidor', error: err.message });
  }
});

// Rota de teste para listar todos os pacientes
router.get('/teste', async (req, res) => {
  try {
    const pacientes = await Paciente.find({}, { cpf: 1, name: 1, _id: 1 });
    res.json({
      total: pacientes.length,
      pacientes: pacientes
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro interno do servidor', error: err.message });
  }
});

export default router;