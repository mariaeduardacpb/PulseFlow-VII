import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import connectDB from './config/db.js';

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors());
app.use(express.json());

// Conexão com o MongoDB
connectDB();

app.use('/client', express.static(path.join(__dirname, '..', 'client')));

// Rotas de autenticação
app.use('/api/auth', authRoutes);

export default app;
