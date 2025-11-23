import notificationService from './notificationService.js';

let notificationInitialized = false;

export async function initializeNotifications() {
  if (notificationInitialized) {
    return;
  }

  try {
    const token = localStorage.getItem('token') || localStorage.getItem('tokenPaciente');
    if (!token) {
      return;
    }

    await notificationService.initialize();
    notificationInitialized = true;

    notificationService.onMessage((payload) => {
      if (window.location.pathname.includes('notificacoes.html')) {
        const event = new CustomEvent('newNotification', { detail: payload });
        window.dispatchEvent(event);
      }
    });
  } catch (error) {
    console.error('Erro ao inicializar notificações:', error);
  }
}

export async function requestNotificationPermission() {
  return await notificationService.requestPermission();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeNotifications);
} else {
  initializeNotifications();
}

