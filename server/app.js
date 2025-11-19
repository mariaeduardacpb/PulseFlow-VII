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
import pacienteAuthRoutes from './routes/pacienteAuthRoutes.js';
import pacienteRoutes from './routes/pacienteRoutes.js';
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
import accessCodeRoutes from './routes/accessCodeRoutes.js';
import geminiRoutes from './routes/geminiRoutes.js';
import agendamentoRoutes from './routes/agendamentoRoutes.js';
import agendamentoPacienteRoutes from './routes/agendamentoPacienteRoutes.js';
import horarioDisponibilidadeRoutes from './routes/horarioDisponibilidadeRoutes.js';
import notificacaoPacienteRoutes from './routes/notificacaoPacienteRoutes.js';


// Carregar variáveis de ambiente
// dotenv.config() será chamado depois de definir __dirname
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar dotenv para procurar o arquivo .env no diretório server e na raiz
const envPathServer = path.join(__dirname, '.env');
const envPathRoot = path.join(__dirname, '..', '.env');

// Tentar carregar do diretório server primeiro
const resultServer = dotenv.config({ path: envPathServer });
// Depois tentar da raiz do projeto (sobrescreve se existir)
const resultRoot = dotenv.config({ path: envPathRoot });

// Log para diagnóstico
if (resultServer.error && resultRoot.error) {
  console.warn('⚠️ Arquivo .env não encontrado em:', envPathServer);
  console.warn('⚠️ Arquivo .env não encontrado em:', envPathRoot);
  console.warn('⚠️ Certifique-se de criar um arquivo .env com a variável GEMINI_API_KEY');
} else {
  if (!resultServer.error) {
    console.log('✅ Arquivo .env carregado de:', envPathServer);
  }
  if (!resultRoot.error) {
    console.log('✅ Arquivo .env carregado de:', envPathRoot);
  }
}

// Verificar se a API key do Gemini está configurada
if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY não encontrada nas variáveis de ambiente');
  console.warn('   Configure a variável GEMINI_API_KEY no arquivo .env');
}

// Configuração do CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requisições sem origem (apps mobile, Postman, etc)
    if (!origin) return callback(null, true);
    
    // Lista de origens permitidas
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:65432',
      'http://localhost:5500',
      'http://127.0.0.1:5501',
      'http://localhost:5501',
      'http://localhost:5900',
      'http://127.0.0.1:5900',
      'https://pulseflow-vii.onrender.com',
      'http://pulseflow-vii.onrender.com'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      // Para desenvolvimento, permitir todas as origens
      callback(null, true);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());

// Servir arquivos estáticos
const uploadsPath = path.join(process.cwd(), 'public', 'uploads');
app.use('/uploads', express.static(uploadsPath));

// Conexão com o MongoDB
connectDB();

// Arquivos estáticos - corrigir caminho para o diretório client no nível raiz
const clientPath = path.join(__dirname, '..', 'client');
app.use(express.static(clientPath));
app.use('/client', express.static(clientPath));

// Rota para a raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(clientPath, 'views', 'index.html'));
});

// Rota para o perfil do paciente
app.get('/client/views/perfilPaciente.html', (req, res) => {
  res.sendFile(path.join(clientPath, 'views', 'perfilPaciente.html'));
});

// Rota para agendamentos
app.get('/client/views/agendamentos.html', (req, res) => {
  res.sendFile(path.join(clientPath, 'views', 'agendamentos.html'));
});

// Rota para horários de disponibilidade
app.get('/client/views/horariosDisponibilidade.html', (req, res) => {
  res.sendFile(path.join(clientPath, 'views', 'horariosDisponibilidade.html'));
});

// Rotas da aplicação
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes); // ✅ NOVA ROTA ATIVADA
app.use('/api/enxaqueca', enxaquecaRoutes);
app.use('/api/paciente-auth', pacienteAuthRoutes);
app.use('/api/pacientes', pacienteRoutes);
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
app.use('/api/access-code', accessCodeRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/agendamentos', agendamentoRoutes);
app.use('/api/agendamentos-paciente', agendamentoPacienteRoutes);
app.use('/api/horarios-disponibilidade', horarioDisponibilidadeRoutes);
app.use('/api/notificacoes-paciente', notificacaoPacienteRoutes);


// Middleware de erro
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Algo deu errado!' });
});

export default app;