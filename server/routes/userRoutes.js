// routes/userRoutes.js
import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

router.get('/perfil', authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json({
      nome: user.nome,
      genero: user.genero,
      email: user.email,
      areaAtuacao: user.areaAtuacao,
      cpf: user.cpf,
      crm: user.crm,
      rqe: user.rqe,
      telefonePessoal: user.telefonePessoal,
      telefoneConsultorio: user.telefoneConsultorio,
      cep: user.cep,
      enderecoConsultorio: user.enderecoConsultorio,
      numeroConsultorio: user.numeroConsultorio,
      complemento: user.complemento,
      bairro: user.bairro,
      cidade: user.cidade,
      estado: user.estado,
      foto: user.foto
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar perfil do usuário', error: error.message });
  }
});

router.put('/perfil', authMiddleware, async (req, res) => {
  console.log('Recebendo requisição PUT para atualizar perfil');
  console.log('Dados recebidos:', req.body);
  
  try {
    const { 
      rqe, 
      telefonePessoal, 
      telefoneConsultorio,
      cep,
      enderecoConsultorio,
      numeroConsultorio,
      complemento,
      bairro,
      cidade,
      estado,
      nome,
      email,
      genero,
      crm,
      areaAtuacao
    } = req.body;
    
    console.log('ID do usuário:', req.user._id);
    const medico = await User.findById(req.user._id);
    if (!medico) {
      console.log('Médico não encontrado');
      return res.status(404).json({ message: 'Médico não encontrado' });
    }

    console.log('Médico encontrado:', medico);

    // Atualiza apenas os campos permitidos
    if (nome !== undefined) medico.nome = nome;
    if (email !== undefined) medico.email = email;
    if (genero !== undefined) medico.genero = genero;
    if (crm !== undefined) medico.crm = crm;
    if (areaAtuacao !== undefined) medico.areaAtuacao = areaAtuacao;
    
    if (rqe !== undefined) {
      console.log('Atualizando RQE:', rqe);
      medico.rqe = Array.isArray(rqe) ? rqe.filter(r => r && r.trim() !== '') : [];
    }
    if (telefonePessoal !== undefined) {
      console.log('Atualizando telefone pessoal:', telefonePessoal);
      medico.telefonePessoal = telefonePessoal;
    }
    if (telefoneConsultorio !== undefined) {
      console.log('Atualizando telefone consultório:', telefoneConsultorio);
      medico.telefoneConsultorio = telefoneConsultorio;
    }
    if (cep !== undefined) {
      console.log('Atualizando CEP:', cep);
      medico.cep = cep;
    }
    if (enderecoConsultorio !== undefined) {
      console.log('Atualizando endereço:', enderecoConsultorio);
      medico.enderecoConsultorio = enderecoConsultorio;
    }
    if (numeroConsultorio !== undefined) {
      console.log('Atualizando número:', numeroConsultorio);
      medico.numeroConsultorio = numeroConsultorio;
    }
    if (complemento !== undefined) {
      console.log('Atualizando complemento:', complemento);
      medico.complemento = complemento;
    }
    if (bairro !== undefined) {
      console.log('Atualizando bairro:', bairro);
      medico.bairro = bairro;
    }
    if (cidade !== undefined) {
      console.log('Atualizando cidade:', cidade);
      medico.cidade = cidade;
    }
    if (estado !== undefined) {
      console.log('Atualizando estado:', estado);
      medico.estado = estado;
    }

    console.log('Salvando alterações...');
    await medico.save();
    console.log('Alterações salvas com sucesso');

    // Retorna os dados atualizados formatados
    const medicoAtualizado = medico.toObject();
    
    // Formata a data de nascimento se existir
    if (medicoAtualizado.dataNascimento) {
      medicoAtualizado.dataNascimento = new Date(medicoAtualizado.dataNascimento).toISOString().split('T')[0];
    }

    // Formata o endereço completo
    medicoAtualizado.enderecoCompleto = {
      cep: medicoAtualizado.cep,
      logradouro: medicoAtualizado.enderecoConsultorio,
      numero: medicoAtualizado.numeroConsultorio,
      complemento: medicoAtualizado.complemento,
      bairro: medicoAtualizado.bairro,
      cidade: medicoAtualizado.cidade,
      estado: medicoAtualizado.estado
    };

    // Formata os telefones
    medicoAtualizado.telefones = {
      pessoal: medicoAtualizado.telefonePessoal,
      consultorio: medicoAtualizado.telefoneConsultorio
    };

    // Adiciona a URL completa da foto se existir
    if (medicoAtualizado.foto) {
      medicoAtualizado.foto = `${req.protocol}://${req.get('host')}${medicoAtualizado.foto}`;
    }

    res.json({ 
      message: 'Perfil atualizado com sucesso', 
      medico: medicoAtualizado 
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil do médico:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

export default router;