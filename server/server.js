import app from './app.js';
import dotenv from "dotenv";
import { CONFIG } from './config/ports.js';

dotenv.config();

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