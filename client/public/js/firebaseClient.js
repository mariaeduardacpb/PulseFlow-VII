import { initializeApp, getApp, getApps } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import {
  getFirestore,
  collection,
  getDocs,
  orderBy,
  query,
  limit
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyBwXGHNg6eV-ABZKvK1SWGpUxb7Fh-8RRI",
  authDomain: "pulseflow-f9154.firebaseapp.com",
  projectId: "pulseflow-f9154",
  storageBucket: "pulseflow-f9154.firebasestorage.app",
  messagingSenderId: "1046085330534",
  appId: "1:1046085330534:web:39e08c1f748fe93b4bafa7"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, getDocs, orderBy, query, limit };

