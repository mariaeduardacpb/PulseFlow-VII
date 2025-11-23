const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'pulseflow-f9154';
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT || '';

let accessToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  const now = Date.now();
  
  if (accessToken && now < tokenExpiry) {
    return accessToken;
  }

  if (!FIREBASE_SERVICE_ACCOUNT) {
    return null;
  }

  try {
    const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
    const jwt = await createJWT(serviceAccount);
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      return null;
    }

    const tokenData = await tokenResponse.json();
    accessToken = tokenData.access_token;
    tokenExpiry = now + (tokenData.expires_in * 1000) - 60000;
    
    return accessToken;
  } catch (error) {
    return null;
  }
}

async function createJWT(serviceAccount) {
  const jwt = (await import('jsonwebtoken')).default;
  
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging'
  };

  return jwt.sign(payload, serviceAccount.private_key, { algorithm: 'RS256' });
}

async function sendFCMNotification(token, title, body, data = {}) {
  if (!token) {
    return { success: false, error: 'Token FCM não fornecido' };
  }

  try {
    const accessToken = await getAccessToken();
    
    if (!accessToken) {
      return { success: false, error: 'Token de acesso não disponível' };
    }

    const message = {
      message: {
        token: token,
        notification: {
          title: title,
          body: body
        },
        data: {
          ...data,
          click_action: data.link || '/client/views/notificacoes.html'
        },
        webpush: {
          notification: {
            title: title,
            body: body,
            icon: '/client/public/assets/pulseLogo.png',
            badge: '/client/public/assets/pulseLogo.png'
          },
          fcm_options: {
            link: data.link || '/client/views/notificacoes.html'
          }
        }
      }
    };

    const response = await fetch(`https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Erro ao enviar notificação: ${errorText}` };
    }

    const result = await response.json();
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function sendNotificationToUser(userId, userModel, title, body, data = {}) {
  try {
    let user;
    
    if (userModel === 'Paciente') {
      const Paciente = (await import('../models/Paciente.js')).default;
      user = await Paciente.findById(userId);
    } else if (userModel === 'User') {
      const User = (await import('../models/User.js')).default;
      user = await User.findById(userId);
    }

    if (!user || !user.fcmToken) {
      return { success: false, error: 'Usuário não encontrado ou sem token FCM' };
    }

    return await sendFCMNotification(user.fcmToken, title, body, data);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export { sendFCMNotification };

