import express from 'express';
import { authPacienteMiddleware } from '../middlewares/pacienteAuthMiddleware.js';
import Notification from '../models/Notification.js';

const router = express.Router();

router.use(authPacienteMiddleware);

router.get('/', async (req, res) => {
  try {
    const pacienteId = req.user._id;
    const { archived } = req.query;
    
    const query = { user: pacienteId };
    if (archived !== undefined) {
      query.archived = archived === 'true';
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .lean();

    const serializedNotifications = notifications.map(notif => {
      return {
        _id: notif._id?.toString() ?? String(notif._id),
        user: notif.user?.toString() ?? String(notif.user),
        userModel: notif.userModel,
        title: notif.title,
        description: notif.description,
        type: notif.type,
        link: notif.link,
        unread: notif.unread ?? true,
        archived: notif.archived ?? false,
        createdAt: notif.createdAt,
        updatedAt: notif.updatedAt
      };
    });

    res.json(serializedNotifications);
  } catch (error) {
    console.error('Erro ao listar notificações do paciente:', error);
    res.status(500).json({ message: 'Erro ao carregar notificações' });
  }
});

router.get('/preview', async (req, res) => {
  try {
    const pacienteId = req.user._id;
    const notifications = await Notification.find({ 
      user: pacienteId
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json(notifications);
  } catch (error) {
    console.error('Erro ao carregar preview de notificações:', error);
    res.status(500).json({ message: 'Erro ao carregar notificações' });
  }
});

router.get('/unread-count', async (req, res) => {
  try {
    const pacienteId = req.user._id;
    const count = await Notification.countDocuments({ 
      user: pacienteId,
      unread: true 
    });

    res.json({ count });
  } catch (error) {
    console.error('Erro ao contar notificações não lidas:', error);
    res.status(500).json({ message: 'Erro ao contar notificações' });
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    const pacienteId = req.user._id;
    const { id } = req.params;

    const notification = await Notification.findOne({ 
      _id: id, 
      user: pacienteId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notificação não encontrada' });
    }

    notification.unread = false;
    await notification.save();

    res.json({ message: 'Notificação marcada como lida', notification });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    res.status(500).json({ message: 'Erro ao atualizar notificação' });
  }
});

router.patch('/mark-all-read', async (req, res) => {
  try {
    const pacienteId = req.user._id;

    await Notification.updateMany(
      { user: pacienteId, unread: true },
      { unread: false }
    );

    res.json({ message: 'Todas as notificações foram marcadas como lidas' });
  } catch (error) {
    console.error('Erro ao marcar todas como lidas:', error);
    res.status(500).json({ message: 'Erro ao atualizar notificações' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const pacienteId = req.user._id;
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({ 
      _id: id, 
      user: pacienteId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notificação não encontrada' });
    }

    res.json({ message: 'Notificação excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir notificação:', error);
    res.status(500).json({ message: 'Erro ao excluir notificação' });
  }
});

router.patch('/:id/archive', async (req, res) => {
  try {
    const pacienteId = req.user._id;
    const { id } = req.params;

    const notification = await Notification.findOne({ 
      _id: id, 
      user: pacienteId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notificação não encontrada' });
    }

    notification.archived = true;
    await notification.save();

    res.json({ message: 'Notificação arquivada com sucesso', notification });
  } catch (error) {
    console.error('Erro ao arquivar notificação:', error);
    res.status(500).json({ message: 'Erro ao arquivar notificação' });
  }
});

router.patch('/:id/unarchive', async (req, res) => {
  try {
    const pacienteId = req.user._id;
    const { id } = req.params;

    const notification = await Notification.findOne({ 
      _id: id, 
      user: pacienteId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notificação não encontrada' });
    }

    notification.archived = false;
    await notification.save();

    res.json({ message: 'Notificação desarquivada com sucesso', notification });
  } catch (error) {
    console.error('Erro ao desarquivar notificação:', error);
    res.status(500).json({ message: 'Erro ao desarquivar notificação' });
  }
});

router.post('/archive-all', async (req, res) => {
  try {
    const pacienteId = req.user._id;
    const result = await Notification.updateMany(
      { user: pacienteId, archived: false },
      { $set: { archived: true } }
    );

    res.json({ 
      message: `${result.modifiedCount} notificações arquivadas com sucesso`,
      count: result.modifiedCount
    });
  } catch (error) {
    console.error('Erro ao arquivar todas as notificações:', error);
    res.status(500).json({ message: 'Erro ao arquivar notificações' });
  }
});

router.delete('/', async (req, res) => {
  try {
    const pacienteId = req.user._id;
    const result = await Notification.deleteMany({ user: pacienteId });

    res.json({ 
      message: `${result.deletedCount} notificações excluídas com sucesso`,
      count: result.deletedCount
    });
  } catch (error) {
    console.error('Erro ao excluir todas as notificações:', error);
    res.status(500).json({ message: 'Erro ao excluir notificações' });
  }
});

router.post('/criar-perfil-atualizado', async (req, res) => {
  try {
    const pacienteId = req.user._id;
    const mongoose = (await import('mongoose')).default;

    const notif = await Notification.create({
      user: mongoose.Types.ObjectId.isValid(pacienteId) ? pacienteId : new mongoose.Types.ObjectId(pacienteId.toString()),
      userModel: 'Paciente',
      title: 'Dados do perfil alterados',
      description: 'Você alterou seus dados de perfil. Verifique as alterações em seu perfil.',
      type: 'profile_update',
      link: '/profile',
      unread: true
    });

    try {
      const { sendNotificationToUser } = await import('../services/fcmService.js');
      
      await sendNotificationToUser(
        pacienteId,
        'Paciente',
        'Dados do perfil alterados',
        'Você alterou seus dados de perfil. Verifique as alterações em seu perfil.',
        {
          link: '/profile',
          type: 'profile_update',
          notificationId: notif._id.toString()
        }
      );
    } catch (fcmError) {
      console.error('Erro ao enviar notificação push:', fcmError);
    }

    res.json({ message: 'Notificação criada com sucesso' });
  } catch (error) {
    console.error('Erro ao criar notificação de perfil atualizado:', error);
    res.status(500).json({ message: 'Erro ao criar notificação' });
  }
});

export default router;

