// routes/userRoutes.js
import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'fotos');
        console.log('Tentando criar diretório de upload:', uploadDir);
        try {
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
                console.log('Diretório de upload criado com sucesso:', uploadDir);
            } else {
                console.log('Diretório de upload já existe:', uploadDir);
            }
            cb(null, uploadDir);
        } catch (error) {
            console.error('Erro ao criar diretório de upload:', error);
            cb(error);
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        const filename = 'foto-' + uniqueSuffix + ext;
        console.log('Nome do arquivo gerado:', filename);
        cb(null, filename);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // limite de 5MB
    },
    fileFilter: (req, file, cb) => {
        // Verifica o tipo MIME do arquivo
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não suportado. Use apenas JPG, JPEG ou PNG.'));
        }
    }
}).single('foto');

router.get('/perfil', authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Formatar a URL completa da foto se existir
    let fotoUrl = user.foto;
    if (fotoUrl && !fotoUrl.startsWith('http')) {
      // Se a foto não começa com http, adiciona o protocolo e host
      fotoUrl = `${req.protocol}://${req.get('host')}${fotoUrl}`;
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
      foto: fotoUrl
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

    try {
      const notif = await Notification.create({
        user: req.user._id,
        title: 'Perfil atualizado',
        description: 'Seus dados do perfil foram atualizados com sucesso.',
        type: 'updates',
        link: '/client/views/perfilMedico.html',
        unread: true
      });
      console.log('Notificação criada com sucesso');

      try {
        const { sendNotificationToUser } = await import('../services/fcmService.js');
        
        await sendNotificationToUser(
          req.user._id,
          'User',
          'Perfil atualizado',
          'Seus dados do perfil foram atualizados com sucesso.',
          {
            link: '/client/views/perfilMedico.html',
            type: 'profile_update',
            notificationId: notif._id.toString()
          }
        );
      } catch (fcmError) {
        console.error('Erro ao enviar notificação push:', fcmError);
      }
    } catch (notifError) {
      console.error('Erro ao criar notificação:', notifError);
    }

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

// Atualizar foto do perfil
router.post('/perfil/foto', authMiddleware, async (req, res) => {
  console.log('Recebendo requisição para atualizar foto');
  upload(req, res, async function(err) {
    if (err instanceof multer.MulterError) {
      console.error('Erro do Multer:', err);
      return res.status(400).json({ 
        message: err.code === 'LIMIT_FILE_SIZE' 
          ? 'O arquivo é muito grande. Tamanho máximo permitido: 5MB' 
          : 'Erro ao fazer upload do arquivo'
      });
    } else if (err) {
      console.error('Erro no upload:', err);
      return res.status(400).json({ message: err.message });
    }

    try {
      if (!req.file) {
        console.log('Nenhum arquivo recebido');
        return res.status(400).json({ message: 'Nenhuma foto foi enviada' });
      }

      console.log('Arquivo recebido:', req.file);

      const medico = await User.findById(req.user._id);
      if (!medico) {
        console.log('Médico não encontrado');
        if (req.file && req.file.path) {
          try {
            fs.unlinkSync(req.file.path);
            console.log('Arquivo removido após erro');
          } catch (error) {
            console.error('Erro ao remover arquivo:', error);
          }
        }
        return res.status(404).json({ message: 'Médico não encontrado' });
      }

      // Remove a foto antiga se existir
      if (medico.foto) {
        const oldPhotoPath = path.join(process.cwd(), 'public', medico.foto);
        try {
          if (fs.existsSync(oldPhotoPath)) {
            fs.unlinkSync(oldPhotoPath);
            console.log('Foto antiga removida:', oldPhotoPath);
          }
        } catch (error) {
          console.error('Erro ao remover foto antiga:', error);
        }
      }

      // Atualiza o caminho da foto no banco de dados
      const fotoUrl = `/uploads/fotos/${req.file.filename}`;
      console.log('Nova URL da foto:', fotoUrl);
      medico.foto = fotoUrl;
      await medico.save();
      console.log('Foto atualizada com sucesso');

      try {
        await Notification.create({
          user: req.user._id,
          title: 'Foto de perfil atualizada',
          description: 'Sua foto de perfil foi atualizada com sucesso.',
          type: 'updates',
          link: '/client/views/perfilMedico.html',
          unread: true
        });
        console.log('Notificação de foto criada com sucesso');
      } catch (notifError) {
        console.error('Erro ao criar notificação de foto:', notifError);
      }

      // Retorna a URL completa da foto
      const fotoUrlCompleta = `${req.protocol}://${req.get('host')}${fotoUrl}`;
      
      res.json({ 
        message: 'Foto atualizada com sucesso',
        fotoUrl: fotoUrlCompleta
      });
    } catch (error) {
      console.error('Erro ao processar upload:', error);
      res.status(500).json({ message: 'Erro ao processar upload da foto' });
    }
  });
});

router.post('/fcm-token', authMiddleware, async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user._id;

    if (!fcmToken) {
      return res.status(400).json({ message: 'Token FCM não fornecido' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { fcmToken: fcmToken },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json({ message: 'Token FCM salvo com sucesso' });
  } catch (error) {
    console.error('Erro ao salvar token FCM:', error);
    res.status(500).json({ message: 'Erro ao salvar token FCM', error: error.message });
  }
});

export default router;