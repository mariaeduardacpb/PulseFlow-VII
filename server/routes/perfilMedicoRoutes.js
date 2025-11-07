import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import User from '../models/User.js';
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

// Buscar dados do perfil do médico
router.get('/', authMiddleware, async (req, res) => {
    try {
        const medico = await User.findById(req.user._id)
            .select('-senha -otp -otpExpires')
            .lean();

        if (!medico) {
            return res.status(404).json({ message: 'Médico não encontrado' });
        }

        // Formatar a data de nascimento
        if (medico.dataNascimento) {
            medico.dataNascimento = new Date(medico.dataNascimento).toISOString().split('T')[0];
        }

        // Formatar o endereço completo
        medico.enderecoCompleto = {
            cep: medico.cep,
            logradouro: medico.enderecoConsultorio,
            numero: medico.numeroConsultorio,
            complemento: medico.complemento,
            bairro: medico.bairro,
            cidade: medico.cidade,
            estado: medico.estado
        };

        // Formatar os telefones
        medico.telefones = {
            pessoal: medico.telefonePessoal,
            consultorio: medico.telefoneConsultorio
        };

        // Adiciona a URL completa da foto se existir
        if (medico.foto) {
            medico.foto = `${req.protocol}://${req.get('host')}${medico.foto}`;
        }

        res.json(medico);
    } catch (error) {
        console.error('Erro ao buscar perfil do médico:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Atualizar dados do perfil do médico
router.put('/', authMiddleware, async (req, res) => {
    console.log('Recebendo requisição para atualizar perfil');
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
            estado
        } = req.body;
        
        console.log('ID do usuário:', req.user._id);
        const medico = await User.findById(req.user._id);
        if (!medico) {
            console.log('Médico não encontrado');
            return res.status(404).json({ message: 'Médico não encontrado' });
        }

        console.log('Médico encontrado:', medico);

        // Atualiza apenas os campos permitidos
        if (rqe) {
            console.log('Atualizando RQE:', rqe);
            medico.rqe = Array.isArray(rqe) ? rqe.filter(r => r && r.trim() !== '') : [];
        }
        if (telefonePessoal) {
            console.log('Atualizando telefone pessoal:', telefonePessoal);
            medico.telefonePessoal = telefonePessoal;
        }
        if (telefoneConsultorio) {
            console.log('Atualizando telefone consultório:', telefoneConsultorio);
            medico.telefoneConsultorio = telefoneConsultorio;
        }
        if (cep) {
            console.log('Atualizando CEP:', cep);
            medico.cep = cep;
        }
        if (enderecoConsultorio) {
            console.log('Atualizando endereço:', enderecoConsultorio);
            medico.enderecoConsultorio = enderecoConsultorio;
        }
        if (numeroConsultorio) {
            console.log('Atualizando número:', numeroConsultorio);
            medico.numeroConsultorio = numeroConsultorio;
        }
        if (complemento) {
            console.log('Atualizando complemento:', complemento);
            medico.complemento = complemento;
        }
        if (bairro) {
            console.log('Atualizando bairro:', bairro);
            medico.bairro = bairro;
        }
        if (cidade) {
            console.log('Atualizando cidade:', cidade);
            medico.cidade = cidade;
        }
        if (estado) {
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

// Atualizar foto do perfil
router.post('/foto', authMiddleware, async (req, res) => {
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

            res.json({ 
                message: 'Foto atualizada com sucesso',
                fotoUrl: fotoUrl
            });
        } catch (error) {
            console.error('Erro ao processar upload:', error);
            res.status(500).json({ message: 'Erro ao processar upload da foto' });
        }
    });
});

export default router; 