import { initializeApp, getApp, getApps } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging.js';
import { API_URL } from './config.js';

let app;
let messaging;
let firebaseInitialized = false;
let firebaseConfig = null;
let vapidKey = null;

async function getFirebaseConfig() {
  if (firebaseConfig) {
    return firebaseConfig;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${API_URL}/api/firebase/config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Falha ao carregar configurações do Firebase: ${response.status}`);
    }

    firebaseConfig = await response.json();

    if (!firebaseConfig || !firebaseConfig.apiKey) {
      throw new Error('Configurações do Firebase não encontradas');
    }

    vapidKey = firebaseConfig.vapidKey || null;

    return firebaseConfig;
  } catch (error) {
    if (error.name === 'AbortError') {
    }
    throw error;
  }
}

async function initializeFirebase() {
  if (firebaseInitialized) {
    return { app, messaging };
  }

  try {
    const config = await getFirebaseConfig();
    app = getApps().length ? getApp() : initializeApp(config);
    
    if ('serviceWorker' in navigator && 'Notification' in window) {
      try {
        const registration = await navigator.serviceWorker.register('/client/public/firebase-messaging-sw.js');
        messaging = getMessaging(app);
        firebaseInitialized = true;
      } catch (swError) {
      }
    }
    
    firebaseInitialized = true;
    return { app, messaging };
  } catch (error) {
    firebaseInitialized = false;
    return { app: null, messaging: null };
  }
}

const firebasePromise = initializeFirebase();

export async function getFirebaseApp() {
  await firebasePromise;
  return app;
}

export async function getMessagingInstance() {
  await firebasePromise;
  return messaging;
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export async function getFCMToken() {
  try {
    await firebasePromise;
    if (!messaging) {
      return null;
    }
    
    if (Notification.permission !== 'granted') {
      return null;
    }
    
    if (!vapidKey) {
      const config = await getFirebaseConfig();
      vapidKey = config.vapidKey || null;
    }
    
    const tokenOptions = vapidKey ? { vapidKey } : {};
    const token = await getToken(messaging, tokenOptions);
    
    return token;
  } catch (error) {
    return null;
  }
}

export function onForegroundMessage(callback) {
  if (!messaging) {
    return;
  }
  
  onMessage(messaging, (payload) => {
    callback(payload);
  });
}


