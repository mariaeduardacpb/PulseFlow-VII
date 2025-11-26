import mongoose from 'mongoose';
import { sendNotificationToUser } from '../services/fcmService.js';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'userModel',
      required: true
    },
    userModel: {
      type: String,
      required: true,
      enum: ['User', 'Paciente'],
      default: 'User'
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      default: 'updates',
      trim: true
    },
    link: {
      type: String,
      default: ''
    },
    unread: {
      type: Boolean,
      default: true
    },
    archived: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.pre('save', function (next) {
  this._wasNew = this.isNew;
  next();
});

notificationSchema.post('save', async function (doc) {
  if (!doc._wasNew) {
    return;
  }

  try {
    await sendNotificationToUser(
      doc.user,
      doc.userModel,
      doc.title,
      doc.description,
      {
        type: doc.type || 'updates',
        link: doc.link || '',
        notificationId: doc._id?.toString() || ''
      }
    );
  } catch (error) {
    console.error('Erro ao enviar push da notificação:', error);
  }
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
