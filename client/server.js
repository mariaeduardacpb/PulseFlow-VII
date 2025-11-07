import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

import('../server/config/ports.js').then(({ CONFIG }) => {
  const app = express();
  const PORT = CONFIG.FRONTEND_PORT || 3000;

  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.static(path.join(__dirname, 'views')));

  app.use('/client/public', express.static(path.join(__dirname, 'public')));
  app.use('/client/views', express.static(path.join(__dirname, 'views')));

  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
  });

  app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
  });

  app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'register.html'));
  });

  app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'homePage.html'));
  });

  app.get('/client/views/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
  });

  app.get('/client/views/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'register.html'));
  });

  app.get('/client/views/homePage.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'homePage.html'));
  });

  app.get('/client/views/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
  });

  app.get('/client/views/:filename', (req, res) => {
    const filename = req.params.filename;
    res.sendFile(path.join(__dirname, 'views', filename));
  });

  app.listen(PORT, () => {
    console.log(`Frontend servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
  });
});
