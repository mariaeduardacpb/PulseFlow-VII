import app from './app.js';
import dotenv from "dotenv";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

import pacienteRoutes from './routes/pacienteRoutes.js';
app.use('/api/pacientes', pacienteRoutes);