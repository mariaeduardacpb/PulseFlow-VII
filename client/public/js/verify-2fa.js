import { API_URL } from './config.js';

function showUserMessage(msg, type = 'info') {
  const el = document.getElementById('user-message');
  el.textContent = msg;
  el.className = 'user-message ' + type;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, type === 'success' ? 3500 : 5000);
}

function clearUserMessage() {
  const el = document.getElementById('user-message');
  el.textContent = '';
  el.className = 'user-message';
  el.style.display = 'none';
}

document.getElementById('verifyBtn').addEventListener('click', async () => {
  const otp = document.getElementById('otpInput').value.trim();
  const errorMessage = document.getElementById('error-message');
  const verifyBtn = document.getElementById('verifyBtn');
  clearUserMessage();

  // Limpa mensagens de erro
  errorMessage.textContent = '';
  errorMessage.classList.remove('active');

  // Validação de entrada
  if (otp.length !== 6 || isNaN(otp)) {
    errorMessage.textContent = 'Por favor, insira um código de 6 dígitos válido.';
    errorMessage.classList.add('active');
    return;
  }

  const userId = localStorage.getItem('userId');
  if (!userId) {
    showUserMessage('Sessão expirada. Faça login novamente.', 'error');
    setTimeout(() => window.location.href = '/client/views/login.html', 2000);
    return;
  }

  // Ativa carregamento no botão
  verifyBtn.disabled = true;
  const originalText = verifyBtn.innerHTML;
  verifyBtn.innerHTML = `<span class="spinner"></span> Verificando...`;

  try {
    const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, code: otp }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Código inválido ou expirado.');
    }

    if (data.token) {
      localStorage.setItem('token', data.token);
      showUserMessage('Verificação realizada com sucesso!', 'success');
      setTimeout(() => {
        window.location.href = '/client/views/selecao.html';
      }, 1200);
    } else {
      showUserMessage(data.message || 'Código inválido ou expirado.', 'error');
    }
  } catch (err) {
    showUserMessage('Erro ao verificar. Tente novamente em instantes.', 'error');
    console.error('Erro ao verificar o código:', err);
  } finally {
    // Restaura botão
    verifyBtn.disabled = false;
    verifyBtn.innerHTML = originalText;
  }
});

// Modal de confirmação ao cancelar
const cancelBtn = document.getElementById('cancelBtn');
const modal = document.getElementById('cancel-modal');
const confirmCancel = document.getElementById('confirm-cancel');
const closeModal = document.getElementById('close-modal');

cancelBtn.addEventListener('click', (e) => {
  e.preventDefault();
  modal.style.display = 'flex';
});

confirmCancel.addEventListener('click', () => {
  window.location.href = '/client/views/login.html';
});

closeModal.addEventListener('click', () => {
  modal.style.display = 'none';
});

// Reenviar código (exemplo de mensagem)
const resendBtn = document.getElementById('resendBtn');
if (resendBtn) {
  resendBtn.addEventListener('click', async () => {
    clearUserMessage();
    resendBtn.disabled = true;
    resendBtn.innerHTML = `<span class="spinner"></span> Reenviando...`;
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`${API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('Erro ao reenviar código.');
      showUserMessage('Novo código enviado para seu e-mail!', 'success');
    } catch (err) {
      showUserMessage('Erro ao reenviar código. Tente novamente.', 'error');
    } finally {
      resendBtn.disabled = false;
      resendBtn.innerHTML = `<i class="fas fa-sync-alt"></i> Reenviar Código`;
    }
  });
}
