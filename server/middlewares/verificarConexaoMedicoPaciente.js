import ConexaoMedicoPaciente from '../models/ConexaoMedicoPaciente.js';
import Paciente from '../models/Paciente.js';

export const verificarConexaoMedicoPaciente = async (req, res, next) => {
  try {
    const medicoId = req.user._id;
    const cpf = req.query.cpf || req.params.cpf || req.body.cpf;

    console.log('🔐 Verificando conexão médico-paciente - Médico ID:', medicoId, 'CPF:', cpf);

    if (!cpf) {
      console.error('❌ CPF não fornecido na requisição');
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
      console.error('❌ Paciente não encontrado com CPF:', cpfLimpo);
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    console.log('✅ Paciente encontrado:', paciente.name || paciente.nome, 'ID:', paciente._id);

    const conexaoAtiva = await ConexaoMedicoPaciente.findOne({
      pacienteId: paciente._id,
      medicoId: medicoId,
      isActive: true
    });

    console.log('🔍 Conexão encontrada:', conexaoAtiva ? '✅ Sim' : '❌ Não');

    if (!conexaoAtiva) {
      console.warn('⚠️ Conexão não encontrada, tentando criar automaticamente...');
      
      // Tentar criar conexão automaticamente
      try {
        const User = (await import('../models/User.js')).default;
        const medico = await User.findById(medicoId);
        
        if (medico) {
          // Desativar conexões anteriores do mesmo paciente com este médico
          await ConexaoMedicoPaciente.updateMany(
            { pacienteId: paciente._id, medicoId: medicoId, isActive: true },
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
          console.log('✅ Conexão criada automaticamente com sucesso');
          
          req.paciente = paciente;
          req.conexaoAtiva = novaConexao;
          next();
          return;
        }
      } catch (createError) {
        console.error('❌ Erro ao criar conexão automaticamente:', createError);
      }
      
      // Se não conseguiu criar, retornar erro
      console.error('❌ Conexão inativa ou não encontrada entre médico e paciente');
      // Listar conexões existentes para debug
      const todasConexoes = await ConexaoMedicoPaciente.find({
        pacienteId: paciente._id,
        medicoId: medicoId
      }).limit(5);
      console.error('Conexões existentes (primeiras 5):', todasConexoes.map(c => ({
        id: c._id,
        isActive: c.isActive,
        createdAt: c.createdAt
      })));
      
      return res.status(403).json({ 
        message: 'Acesso negado. Você não tem uma conexão ativa com este paciente. Por favor, solicite acesso novamente.',
        codigo: 'CONEXAO_INATIVA'
      });
    }

    req.paciente = paciente;
    req.conexaoAtiva = conexaoAtiva;
    console.log('✅ Conexão verificada com sucesso, prosseguindo...');
    next();
  } catch (error) {
    console.error('❌ Erro ao verificar conexão médico-paciente:', error);
    res.status(500).json({ 
      message: 'Erro ao verificar conexão com o paciente',
      error: error.message 
    });
  }
};




