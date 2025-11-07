import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';
import app from './app.js';
import { CONFIG } from './config/ports.js';

// Configurar dotenv - garantir que o .env seja carregado
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env do diretório server e da raiz (app.js já faz isso, mas garantimos aqui também)
const envPathServer = path.join(__dirname, '.env');
const envPathRoot = path.join(__dirname, '..', '.env');

dotenv.config({ path: envPathServer });
dotenv.config({ path: envPathRoot });

const PORT = CONFIG.BACKEND_PORT;

// Error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});