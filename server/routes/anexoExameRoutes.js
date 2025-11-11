import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { uploadExame, buscarExamesMedico, buscarExamesPaciente, downloadExame } from '../controllers/anexoExameController.js';
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

// Rotas
router.post('/upload', authPacienteMiddleware, upload.single('arquivo'), uploadExame);
router.get('/medico', authMiddleware, verificarConexaoMedicoPaciente, buscarExamesMedico);
router.get('/paciente', authPacienteMiddleware, buscarExamesPaciente);

// ROTA DE DOWNLOAD PROTEGIDO (verifica conexão ativa)
router.get('/download/:id', authMiddleware, verificarConexaoPorExameId, downloadExame);

export default router;
