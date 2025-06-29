// app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js'; // ✅ NOVO IMPORT
import connectDB from './config/db.js';
import enxaquecaRoutes from './routes/enxaquecaRoutes.js';
import pacienteRoutes from './routes/pacienteAuthRoutes.js';
import insoniaRoutes from './routes/insoniaRoutes.js';
import anexoExameRoutes from './routes/anexoExameRoutes.js';
import hormonalRoutes from './routes/hormonalRoutes.js'; 
import diabetesRoutes from './routes/diabetesRoutes.js'; 
import pressaoArterialRoutes from './routes/pressaoArterialRoutes.js';
import anotacaoRoutes from './routes/anotacaoRoutes.js';
import criseGastriteRoutes from './routes/gastriteRoutes.js';
import cicloRoutes from './routes/cicloRoutes.js';
import menstruacaoRoutes from './routes/menstruacaoRoutes.js';
import eventoClinicoRoutes from './routes/eventoClinicoRoutes.js';
import perfilMedicoRoutes from './routes/perfilMedicoRoutes.js';



dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(__filename);

// Configuração do CORS
const corsOptions = {
  origin: [
    'http://127.0.0.1:65432',
    'http://127.0.0.1:65432',
    'http://localhost:5500',
    'http://127.0.0.1:5501',
    'http://localhost:5501',
    'http://localhost:5900',
    'http://127.0.0.1:5900',
    'https://pulseflow-vii.onrender.com',
    'http://pulseflow-vii.onrender.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());

// Servir arquivos estáticos
const uploadsPath = path.join(process.cwd(), 'public', 'uploads');
console.log('Diretório de uploads:', uploadsPath);
app.use('/uploads', express.static(uploadsPath));

// Conexão com o MongoDB
connectDB();

// Arquivos estáticos
app.use(express.static(path.join(process.cwd(), 'client')));
app.use('/client', express.static(path.join(process.cwd(), 'client')));

// Rota para a raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'client', 'views', 'index.html'));
});

// Rota para o perfil do paciente
app.get('/client/views/perfilPaciente.html', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'client', 'views', 'perfilPaciente.html'));
});

// Rotas da aplicação
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes); // ✅ NOVA ROTA ATIVADA
app.use('/api/usuarios/perfil', perfilMedicoRoutes);
app.use('/api/enxaqueca', enxaquecaRoutes);
app.use('/api/paciente', pacienteRoutes);
app.use('/api/insonia', insoniaRoutes);
app.use('/api/pressaoArterial', pressaoArterialRoutes);
app.use('/api/anexoExame', anexoExameRoutes);
app.use('/api/anotacoes', anotacaoRoutes);
app.use('/api/hormonal', hormonalRoutes);
app.use('/api/diabetes', diabetesRoutes);
app.use('/api/ciclo', cicloRoutes);
app.use('/api/gastrite', criseGastriteRoutes);
app.use('/api/menstruacao', menstruacaoRoutes);
app.use('/api/eventos-clinicos', eventoClinicoRoutes);


// Middleware de erro
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Algo deu errado!' });
});

export default app;