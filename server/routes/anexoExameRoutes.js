import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { uploadExame, buscarExamesMedico, buscarExamesPaciente, downloadExame, uploadExameMedico, previewExame } from '../controllers/anexoExameController.js';
import { authPacienteMiddleware } from '../middlewares/pacienteAuthMiddleware.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { verificarConexaoMedicoPaciente } from '../middlewares/verificarConexaoMedicoPaciente.js';
import { verificarConexaoPorExameId } from '../middlewares/verificarConexaoPorRegistroId.js';

const router = express.Router();

// Configuração corrigida do multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const pacienteId = req.user.id;
    const dir = path.join('uploads', `paciente_${pacienteId}`); // Pasta correta: uploads/paciente_XXXXXX

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}${ext}`); 
  }
});

const upload = multer({ storage });

const storageMedico = multer.diskStorage({
  destination: (req, file, cb) => {
    const cpf = req.body?.cpf || req.query?.cpf || (req.body?.fields ? req.body.fields.cpf : null);
    
    if (!cpf) {
      const tempDir = path.join('uploads', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      req.tempUpload = true;
      return cb(null, tempDir);
    }
    
    const cpfLimpo = cpf.replace(/[^\d]/g, '');
    const dir = path.join('uploads', `paciente_${cpfLimpo}`);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    req.pacienteCpf = cpfLimpo;
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}${ext}`); 
  }
});

const uploadMedico = multer({ 
  storage: storageMedico,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/heic'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado. Use PDF, PNG, JPG, JPEG ou HEIC.'));
    }
  }
});

// Rotas
router.post('/upload', authPacienteMiddleware, upload.single('arquivo'), uploadExame);
router.post('/medico/upload', authMiddleware, uploadMedico.single('arquivo'), uploadExameMedico);
router.get('/medico', authMiddleware, verificarConexaoMedicoPaciente, buscarExamesMedico);
router.get('/paciente', authPacienteMiddleware, buscarExamesPaciente);

// ROTA DE DOWNLOAD PROTEGIDO (verifica conexão ativa)
router.get('/download/:id', authMiddleware, verificarConexaoPorExameId, downloadExame);

// ROTA DE PREVIEW (serve o arquivo para visualização)
router.get('/preview/:id', authMiddleware, verificarConexaoPorExameId, previewExame);

export default router;
