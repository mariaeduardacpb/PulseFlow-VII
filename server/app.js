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
import hormonalRoutes from './routes/hormonalRoutes.js'; 
import diabetesRoutes from './routes/diabetesRoutes.js'; 
import pressaoArterialRoutes from './routes/pressaoArterialRoutes.js';

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
//app.use('/public', express.static(path.join(__dirname, '..', 'client', 'public')));




app.use('/api/auth', authRoutes);
app.use('/api/enxaqueca', enxaquecaRoutes);
app.use('/api/paciente', pacienteRoutes);
app.use('/api/insonia', insoniaRoutes);
app.use('/api/pressaoArterial', pressaoArterialRoutes);

app.use('/api/anexoExame', anexoExameRoutes);
app.use('/api/anotacoes', anotacaoRoutes);
app.use('/api/hormonal', hormonalRoutes);
app.use('/api/diabetes', diabetesRoutes);

export default app;
