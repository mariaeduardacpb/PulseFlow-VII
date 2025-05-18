// routes/userRoutes.js
import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/perfil', authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json({
      nome: user.nome,
      genero: user.genero,
      email: user.email,
      areaAtuacao: user.areaAtuacao
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar perfil do usuário', error: error.message });
  }
});

export default router;