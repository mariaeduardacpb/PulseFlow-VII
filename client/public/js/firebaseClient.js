import { initializeApp, getApp, getApps } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import {
  getFirestore,
  collection,
  getDocs,
  orderBy,
  query,
  limit
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { API_URL } from './config.js';

let app;
let db;
let firebaseInitialized = false;

async function initializeFirebase() {
  if (firebaseInitialized) {
    return { app, db };
  }

  try {
    const response = await fetch(`${API_URL}/api/firebase/config`);
    
    if (!response.ok) {
      throw new Error('Falha ao carregar configurações do Firebase');
    }

    const firebaseConfig = await response.json();

    if (!firebaseConfig.apiKey) {
      throw new Error('Configurações do Firebase não encontradas');
    }

    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    firebaseInitialized = true;

    return { app, db };
  } catch (error) {
    console.error('Erro ao inicializar Firebase:', error);
    throw error;
  }
}

const firebasePromise = initializeFirebase();

export async function getDb() {
  await firebasePromise;
  return db;
}

export async function getFirebaseApp() {
  await firebasePromise;
  return app;
}

export { collection, getDocs, orderBy, query, limit };

