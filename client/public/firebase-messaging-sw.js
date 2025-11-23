importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

function getApiUrl() {
  if (self.location.origin.includes('localhost') || self.location.origin.includes('127.0.0.1')) {
    return 'http://localhost:65432';
  }
  return self.location.origin;
}

const API_URL = getApiUrl();

let firebaseConfig = null;

async function initializeFirebase() {
  if (firebaseConfig) {
    return firebaseConfig;
  }

  try {
    const url = `${API_URL}/api/firebase/config`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Falha ao carregar configurações do Firebase: ${response.status}`);
    }

    firebaseConfig = await response.json();

    if (!firebaseConfig || !firebaseConfig.apiKey) {
      throw new Error('Configurações do Firebase não encontradas');
    }

    firebase.initializeApp(firebaseConfig);
    return firebaseConfig;
  } catch (error) {
    return null;
  }
}

initializeFirebase().then((config) => {
  if (!config) {
    return;
  }
  
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'PulseFlow';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'Nova notificação',
    icon: '/client/public/assets/pulseLogo.png',
    badge: '/client/public/assets/pulseLogo.png',
    tag: 'pulseflow-notification',
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: payload.data || {}
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

  self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const data = event.notification.data;
    const link = data?.link || '/client/views/notificacoes.html';

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then(() => {
              if (data?.link) {
                return client.navigate(link);
              }
            });
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(link);
        }
      })
    );
  });
  }).catch((error) => {
});

