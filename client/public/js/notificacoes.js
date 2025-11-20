import { API_URL } from '/client/public/js/config.js';
import { getDb, collection, getDocs, orderBy, query, limit } from '/client/public/js/firebaseClient.js';

const STORAGE_KEY = 'pf_notifications';
let currentFilter = 'all';

function formatRelativeTime(date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Agora';
  if (minutes < 60) return `Há ${minutes} min`;
  if (hours < 24) return `Há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  if (days === 1) return 'Ontem';
  if (days < 7) return `Há ${days} dias`;
  return date.toLocaleDateString('pt-BR');
}

function normalizeNotification(raw, fallbackIndex = 0) {
  if (!raw) return null;
  const id = raw.id || raw._id || raw.codigo || raw.docId || `ntf-${fallbackIndex}-${Date.now()}`;
  let createdAt = raw.createdAt || raw.criadoEm || raw.created || raw.timestamp;

  if (createdAt && typeof createdAt === 'object' && createdAt.seconds !== undefined) {
    createdAt = new Date(createdAt.seconds * 1000 + (createdAt.nanoseconds || 0) / 1e6).toISOString();
  } else if (typeof createdAt === 'number') {
    createdAt = new Date(createdAt).toISOString();
  } else if (typeof createdAt === 'string') {
    const parsedDate = new Date(createdAt);
    createdAt = Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
  } else {
    createdAt = new Date().toISOString();
  }

  const rawType = (raw.type || raw.tipo || '').toString().toLowerCase();
  const allowedTypes = ['critical', 'appointments', 'updates', 'info'];
  const type = allowedTypes.includes(rawType) ? rawType : 'updates';

  const unread = raw.unread !== undefined ? raw.unread : !(raw.lido ?? false);

  return {
    id,
    type,
    title: raw.title || raw.titulo || 'Notificação',
    description: raw.description || raw.descricao || '',
    createdAt,
    link: raw.link || '#',
    action: raw.action || raw.rotuloAcao || 'Visualizar detalhes',
    unread: Boolean(unread)
  };
}

function mergeNotifications(...sources) {
  const map = new Map();
  let fallbackIndex = 0;

  sources
    .flat()
    .filter(Boolean)
    .forEach(item => {
      const normalized = normalizeNotification(item, fallbackIndex++);
      if (normalized) {
        map.set(normalized.id, { ...map.get(normalized.id), ...normalized });
      }
    });

  return Array.from(map.values());
}

function loadNotifications() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return mergeNotifications(parsed);
      }
    }
  } catch (error) {
    console.warn('Não foi possível ler notificações salvas:', error);
  }
  return [];
}

function persistNotifications(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

let notifications = [];

function renderSummary(list) {
  const pending = list.filter(item => item.unread).length;
  const handled = list.length - pending;
  const critical = list.filter(item => item.type === 'critical' && item.unread).length;

  document.getElementById('summaryPending').textContent = pending.toString();
  document.getElementById('summaryHandled').textContent = handled.toString();
  document.getElementById('summaryCritical').textContent = critical.toString();
}

function createCard(notification) {
  const card = document.createElement('article');
  card.className = `notification-card ${notification.type} ${notification.unread ? 'unread' : ''}`;
  card.dataset.type = notification.type;

  const createdAt = new Date(notification.createdAt);

  card.innerHTML = `
    <header>
      <div>
        <h2>${notification.title}</h2>
        <p>${notification.description}</p>
      </div>
      <span class="timestamp">${formatRelativeTime(createdAt)}</span>
    </header>
    <footer>
      <button type="button" data-link="${notification.link}">${notification.action}</button>
      <button type="button" class="mark-read" data-id="${notification.id}">
        ${notification.unread ? 'Marcar como lida' : 'Mover para pendências'}
      </button>
    </footer>
  `;

  return card;
}

function renderFeed(list) {
  const feed = document.getElementById('notificationsFeed');
  const emptyState = document.getElementById('notificationsEmpty');

  feed.innerHTML = '';

  if (!list.length) {
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;

  list
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .forEach(notification => {
      const card = createCard(notification);
      feed.appendChild(card);
    });
}

function applyFilter(filter) {
  currentFilter = filter;
  let filtered = [...notifications];

  switch (filter) {
    case 'critical':
      filtered = filtered.filter(item => item.type === 'critical');
      break;
    case 'appointments':
      filtered = filtered.filter(item => item.type === 'appointments');
      break;
    case 'updates':
      filtered = filtered.filter(item => item.type === 'updates');
      break;
    case 'today': {
      const now = new Date();
      filtered = filtered.filter(item => {
        const createdAt = new Date(item.createdAt);
        const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        return diffHours < 24;
      });
      break;
    }
    default:
      break;
  }

  renderFeed(filtered);
}

function markAllAsRead() {
  notifications = notifications.map(notification => ({ ...notification, unread: false }));
  persistNotifications(notifications);
  renderSummary(notifications);
  applyFilter(currentFilter);
}

function clearAll() {
  notifications = [];
  persistNotifications(notifications);
  renderSummary(notifications);
  applyFilter(currentFilter);
}

async function fetchNotificationsFromApi() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('Token não encontrado, retornando array vazio');
      return [];
    }
    const response = await fetch(`${API_URL}/api/notificacoes`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!response.ok) {
      if (response.status === 401) {
        console.warn('Token inválido ou expirado');
        return [];
      }
      throw new Error(`Falha ao carregar notificações: ${response.status}`);
    }
    const data = await response.json();
    if (Array.isArray(data)) {
      console.log(`Notificações carregadas da API: ${data.length}`);
      return data;
    }
    console.warn('Resposta da API não é um array:', data);
  } catch (error) {
    console.warn('Não foi possível sincronizar notificações do servidor:', error.message);
  }
  return [];
}

async function fetchNotificationsFromFirestore() {
  try {
    const db = await getDb();
    if (!db) {
      return [];
    }

    const collectionsToTry = ['notificacoes', 'notifications'];

    for (const collectionName of collectionsToTry) {
      try {
        const snapshot = await getDocs(
          query(
            collection(db, collectionName),
            orderBy('criadoEm', 'desc'),
            limit(50)
          )
        );

        if (!snapshot.empty) {
          return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              createdAt: data.criadoEm || data.createdAt || data.created_at
            };
          });
        }
      } catch (error) {
        console.warn(`Não foi possível ler notificações na coleção ${collectionName}:`, error);
      }
    }

    return [];
  } catch (error) {
    console.warn('Erro ao inicializar Firebase:', error);
    return [];
  }
}

async function synchronizeNotifications() {
  const [apiData, firestoreData] = await Promise.all([
    fetchNotificationsFromApi(),
    fetchNotificationsFromFirestore()
  ]);

  const localData = loadNotifications();
  const merged = mergeNotifications(localData, apiData, firestoreData);

  notifications = merged;

  if (!notifications.length) {
    persistNotifications([]);
  } else {
    persistNotifications(notifications);
  }

  renderSummary(notifications);
  applyFilter(currentFilter);
}

document.addEventListener('DOMContentLoaded', async () => {
  renderFeed(notifications);
  renderSummary(notifications);
  applyFilter('all');
  await synchronizeNotifications();

  document.querySelectorAll('.filter-chip').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      applyFilter(button.dataset.filter);
    });
  });

  const markAllBtn = document.querySelector('.hero-btn[data-action="mark-all"]');
  const clearAllBtn = document.querySelector('.hero-btn[data-action="clear-all"]');

  if (markAllBtn) {
    markAllBtn.addEventListener('click', markAllAsRead);
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearAll);
  }

  document.getElementById('notificationsFeed').addEventListener('click', event => {
    const actionLink = event.target.closest('button[data-link]');
    const markButton = event.target.closest('button.mark-read');

    if (actionLink) {
      const destination = actionLink.getAttribute('data-link');
      if (destination && destination !== '#') {
        window.location.href = destination;
      }
    }

    if (markButton) {
      const itemIndex = notifications.findIndex(notification => notification.id === markButton.dataset.id);
      if (itemIndex !== -1) {
        notifications[itemIndex].unread = !notifications[itemIndex].unread;
        persistNotifications(notifications);
        renderSummary(notifications);
        applyFilter(currentFilter);
      }
    }
  });
});

