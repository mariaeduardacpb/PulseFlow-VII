import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js'; // Importando a rota de autenticação
import connectDB from './config/db.js'; // Conectando ao banco de dados
import enxaquecaRoutes from './routes/enxaquecaRoutes.js';
import pacienteRoutes from './routes/pacienteAuthRoutes.js';
import insoniaRoutes from './routes/insoniaRoutes.js';

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors());
app.use(express.json());

// Conexão com o MongoDB
connectDB();

// Servindo arquivos estáticos
app.use('/client', express.static(path.join(__dirname, '..', 'client')));

// Definindo as rotas da API
app.use('/api/auth', authRoutes); // Usando a rota de autenticação
app.use('/api/enxaqueca', enxaquecaRoutes);
app.use('/api/paciente', pacienteRoutes); // Para login e registro do paciente
app.use('/api/insonia', insoniaRoutes);

export default app; // Exportando o app
