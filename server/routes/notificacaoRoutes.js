import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import Notification from '../models/Notification.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📬 Listando ${notifications.length} notificações para o médico ${req.user._id.toString()}`);
    res.json(notifications);
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    res.status(500).json({ message: 'Erro ao carregar notificações' });
  }
});

router.get('/preview', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    console.log(`👀 Preview com ${notifications.length} notificações para o médico ${req.user._id.toString()}`);
    res.json(notifications);
  } catch (error) {
    console.error('Erro ao carregar preview de notificações:', error);
    res.status(500).json({ message: 'Erro ao carregar notificações' });
  }
});

export default router;
