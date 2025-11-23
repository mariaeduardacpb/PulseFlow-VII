import { getFCMToken, onForegroundMessage, requestNotificationPermission } from './firebaseClient.js';
import { API_URL } from './config.js';

class NotificationService {
  constructor() {
    this.fcmToken = null;
    this.isInitialized = false;
    this.onMessageCallback = null;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      if (Notification.permission === 'default') {
        return;
      }

      if (Notification.permission === 'denied') {
        return;
      }

      if (Notification.permission === 'granted') {
        this.fcmToken = await getFCMToken();
        
        if (this.fcmToken) {
          await this.saveTokenToServer(this.fcmToken);
          this.setupForegroundListener();
          this.isInitialized = true;
        }
      }
    } catch (error) {
    }
  }

  async requestPermission() {
    try {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        return false;
      }

      this.fcmToken = await getFCMToken();
      
      if (this.fcmToken) {
        await this.saveTokenToServer(this.fcmToken);
        this.setupForegroundListener();
        this.isInitialized = true;
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  async saveTokenToServer(fcmToken) {
    try {
      const userToken = localStorage.getItem('token');
      const pacienteToken = localStorage.getItem('tokenPaciente');
      
      if (!userToken && !pacienteToken) {
        return;
      }

      const authToken = userToken || pacienteToken;
      const endpoint = userToken ? '/api/users/fcm-token' : '/api/pacientes/fcm-token';

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ fcmToken: fcmToken })
      });

      if (!response.ok) {
      }
    } catch (error) {
    }
  }

  setupForegroundListener() {
    onForegroundMessage((payload) => {
      this.showNotification(payload);
      
      if (window.updateNotificationBadge) {
        window.updateNotificationBadge();
      }
      
      if (this.onMessageCallback) {
        this.onMessageCallback(payload);
      }
    });
  }

  showNotification(payload) {
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      const title = payload.notification?.title || payload.data?.title || 'PulseFlow';
      const options = {
        body: payload.notification?.body || payload.data?.body || 'Nova notificação',
        icon: '/client/public/assets/pulseLogo.png',
        badge: '/client/public/assets/pulseLogo.png',
        tag: 'pulseflow-notification',
        data: payload.data || {}
      };

      const notification = new Notification(title, options);

      notification.onclick = (event) => {
        event.preventDefault();
        let link = payload.data?.link || '/client/views/notificacoes.html';
        
        if (link.startsWith('/agendamentos/') || link.startsWith('/appointments/')) {
          link = '/client/views/agendamentos.html';
        }
        
        window.location.href = link;
        notification.close();
      };
    }
  }

  onMessage(callback) {
    this.onMessageCallback = callback;
  }

  async getToken() {
    if (!this.fcmToken) {
      this.fcmToken = await getFCMToken();
    }
    return this.fcmToken;
  }
}

const notificationService = new NotificationService();

export default notificationService;

