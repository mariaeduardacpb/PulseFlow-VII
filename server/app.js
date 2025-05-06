import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import connectDB from './config/db.js';
import enxaquecaRoutes from './routes/enxaquecaRoutes.js';
import pacienteRoutes from './routes/pacienteAuthRoutes.js';
import insoniaRoutes from './routes/insoniaRoutes.js';
import anexoExameRoutes from './routes/anexoExameRoutes.js';
import anotacaoRoutes from './routes/anotacaoRoutes.js';
import criseGastriteRoutes from './routes/criseGastriteRoutes.js';
import cicloRoutes from './routes/cicloRoutes.js';

dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors());
app.use(express.json());

// Conexão com o MongoDB
connectDB();

// Arquivos estáticos
app.use('/client', express.static(path.join(__dirname, '..', 'client')));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/enxaqueca', enxaquecaRoutes);
app.use('/api/paciente', pacienteRoutes);
app.use('/api/insonia', insoniaRoutes);
app.use('/api/anexoExame', anexoExameRoutes);
app.use('/api/anotacoes', anotacaoRoutes);
app.use('/api/ciclo', cicloRoutes);
app.use('/api/crises-gastrite', criseGastriteRoutes);

export default app;
