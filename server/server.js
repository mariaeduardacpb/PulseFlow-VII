import app from './app.js';
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5500;

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

import pacienteRoutes from './routes/pacienteRoutes.js';
app.use('/api/pacientes', pacienteRoutes);