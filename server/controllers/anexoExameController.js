import Exame from '../models/AnexoExame.js';
import Paciente from '../models/Paciente.js';
import ConexaoMedicoPaciente from '../models/ConexaoMedicoPaciente.js';
import path from 'path';
import fs from 'fs';

// Paciente envia exame (PDF ou imagem)
export const uploadExame = async (req, res) => {
  const { nome, categoria, data } = req.body;
  const pacienteId = req.user.id;

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Arquivo não enviado!' });
    }

    const filePath = req.file.path.replace(/\\/g, '/'); // Corrige o caminho para Windows/Linux

    const novoExame = new Exame({
      nome,
      categoria,
      data,
      paciente: pacienteId,
      filePath
    });

    await novoExame.save();
    res.status(201).json({ message: 'Exame enviado com sucesso', exame: novoExame });
  } catch (error) {
    console.error('Erro ao salvar exame:', error);
    res.status(500).json({ error: 'Erro ao salvar exame' });
  }
};

// Médico busca exames de um paciente via CPF
export const buscarExamesMedico = async (req, res) => {
  const { cpf } = req.query;
  
  try {
    if (!cpf) {
      return res.status(400).json({ message: 'CPF é obrigatório' });
    }

    // Limpar CPF removendo caracteres não numéricos
    const cpfLimpo = cpf.replace(/[^\d]/g, '');
    
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
    
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    const exames = await Exame.find({ paciente: paciente._id }).sort({ data: -1 });
    
    res.json(exames);
  } catch (error) {
    console.error('Erro ao buscar exames:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Paciente visualiza seus próprios exames
export const buscarExamesPaciente = async (req, res) => {
  const pacienteId = req.user.id;
  try {
    const exames = await Exame.find({ paciente: pacienteId }).sort({ data: -1 });
    res.json(exames);
  } catch (error) {
    console.error('Erro ao buscar exames do paciente:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const downloadExame = async (req, res) => {
  try {
    const exame = req.exame || await Exame.findById(req.params.id).populate('paciente');
    if (!exame) {
      return res.status(404).json({ message: 'Exame não encontrado' });
    }

    let filePath = exame.filePath;
    
    if (!path.isAbsolute(filePath)) {
      filePath = path.join(process.cwd(), filePath);
    }
    
    filePath = filePath.replace(/\\/g, '/');
    
    if (!fs.existsSync(filePath)) {
      const fileName = path.basename(exame.filePath);
      const pacienteId = req.pacienteId || (exame.paciente?._id ? exame.paciente._id.toString() : exame.paciente.toString());
      
      const alternativePath1 = path.join(process.cwd(), 'uploads', `paciente_${pacienteId}`, fileName);
      
      if (fs.existsSync(alternativePath1)) {
        filePath = alternativePath1;
      } else {
        const paciente = exame.paciente?._id ? await Paciente.findById(exame.paciente._id) : await Paciente.findById(exame.paciente);
        if (paciente) {
          const cpfLimpo = paciente.cpf.replace(/[^\d]/g, '');
          const alternativePath2 = path.join(process.cwd(), 'uploads', `paciente_${cpfLimpo}`, fileName);
          if (fs.existsSync(alternativePath2)) {
            filePath = alternativePath2;
          } else {
            return res.status(404).json({ message: 'Arquivo não encontrado no servidor' });
          }
        } else {
          return res.status(404).json({ message: 'Arquivo não encontrado no servidor' });
        }
      }
    }

    const fileName = path.basename(filePath);
    const originalName = exame.nome || 'exame';
    const ext = path.extname(filePath) || path.extname(exame.filePath) || '.pdf';
    
    res.download(filePath, `${originalName}${ext}`, (err) => {
      if (err) {
        console.error('Erro ao enviar arquivo:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Erro ao baixar arquivo' });
        }
      }
    });
  } catch (error) {
    console.error('Erro ao fazer download do exame:', error);
    res.status(500).json({ message: 'Erro interno ao baixar arquivo' });
  }
};

export const previewExame = async (req, res) => {
  try {
    const exame = req.exame || await Exame.findById(req.params.id).populate('paciente');
    if (!exame) {
      return res.status(404).json({ message: 'Exame não encontrado' });
    }

    let filePath = exame.filePath;
    
    if (!path.isAbsolute(filePath)) {
      filePath = path.join(process.cwd(), filePath);
    }
    
    filePath = filePath.replace(/\\/g, '/');
    
    if (!fs.existsSync(filePath)) {
      const fileName = path.basename(exame.filePath);
      const pacienteId = req.pacienteId || (exame.paciente?._id ? exame.paciente._id.toString() : exame.paciente.toString());
      
      const alternativePath1 = path.join(process.cwd(), 'uploads', `paciente_${pacienteId}`, fileName);
      
      if (fs.existsSync(alternativePath1)) {
        filePath = alternativePath1;
      } else {
        const paciente = exame.paciente?._id ? await Paciente.findById(exame.paciente._id) : await Paciente.findById(exame.paciente);
        if (paciente) {
          const cpfLimpo = paciente.cpf.replace(/[^\d]/g, '');
          const alternativePath2 = path.join(process.cwd(), 'uploads', `paciente_${cpfLimpo}`, fileName);
          if (fs.existsSync(alternativePath2)) {
            filePath = alternativePath2;
          } else {
            return res.status(404).json({ message: 'Arquivo não encontrado no servidor' });
          }
        } else {
          return res.status(404).json({ message: 'Arquivo não encontrado no servidor' });
        }
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentTypeMap = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.heic': 'image/heic'
    };

    const contentType = contentTypeMap[ext] || 'application/octet-stream';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Erro ao fazer preview do exame:', error);
    res.status(500).json({ message: 'Erro interno ao visualizar arquivo' });
  }
};

export const uploadExameMedico = async (req, res) => {
  const { nome, categoria, data, cpf } = req.body;
  const medicoId = req.user._id;

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Arquivo não enviado!' });
    }

    if (!cpf) {
      if (req.file && req.file.path && req.tempUpload) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Erro ao remover arquivo temporário:', unlinkError);
        }
      }
      return res.status(400).json({ message: 'CPF do paciente é obrigatório' });
    }

    const cpfLimpo = cpf.replace(/[^\d]/g, '');
    
    if (cpfLimpo.length !== 11) {
      if (req.file && req.file.path && req.tempUpload) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Erro ao remover arquivo temporário:', unlinkError);
        }
      }
      return res.status(400).json({ message: 'CPF deve ter 11 dígitos' });
    }

    let paciente = await Paciente.findOne({ cpf: cpfLimpo });
    
    if (!paciente) {
      const cpfFormatado = cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      paciente = await Paciente.findOne({ cpf: cpfFormatado });
    }
    
    if (!paciente) {
      if (req.file && req.file.path && req.tempUpload) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Erro ao remover arquivo temporário:', unlinkError);
        }
      }
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    const conexaoAtiva = await ConexaoMedicoPaciente.findOne({
      pacienteId: paciente._id,
      medicoId: medicoId,
      isActive: true
    });

    if (!conexaoAtiva) {
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Erro ao remover arquivo após erro:', unlinkError);
        }
      }
      return res.status(403).json({ 
        message: 'Acesso negado. Você não tem uma conexão ativa com este paciente. Por favor, solicite acesso novamente.',
        codigo: 'CONEXAO_INATIVA'
      });
    }

    let filePath = req.file.path.replace(/\\/g, '/');
    
    if (req.tempUpload) {
      const targetDir = path.join('uploads', `paciente_${paciente._id}`);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      const fileName = path.basename(req.file.path);
      const targetPath = path.join(targetDir, fileName);
      
      fs.renameSync(req.file.path, targetPath);
      filePath = targetPath.replace(/\\/g, '/');
    } else if (!filePath.includes(`paciente_${paciente._id}`)) {
      const targetDir = path.join('uploads', `paciente_${paciente._id}`);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      const fileName = path.basename(filePath);
      const targetPath = path.join(targetDir, fileName);
      
      if (fs.existsSync(filePath) && filePath !== targetPath) {
        fs.renameSync(filePath, targetPath);
        filePath = targetPath.replace(/\\/g, '/');
      }
    }

    const novoExame = new Exame({
      nome,
      categoria,
      data,
      paciente: paciente._id,
      filePath
    });

    await novoExame.save();
    res.status(201).json({ message: 'Exame enviado com sucesso', exame: novoExame });
  } catch (error) {
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Erro ao remover arquivo após erro:', unlinkError);
      }
    }
    console.error('Erro ao salvar exame:', error);
    res.status(500).json({ error: 'Erro ao salvar exame' });
  }
};

