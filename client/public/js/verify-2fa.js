document.getElementById('verifyBtn').addEventListener('click', async () => {
  const otp = document.getElementById('otpInput').value.trim();
  const errorMessage = document.getElementById('error-message');
  const verifyBtn = document.getElementById('verifyBtn');

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
    alert('Sessão expirada. Faça login novamente.');
    window.location.href = '/client/views/login.html';
    return;
  }

  // Ativa carregamento no botão
  verifyBtn.disabled = true;
  const originalText = verifyBtn.innerHTML;
  verifyBtn.innerHTML = `<span class="spinner"></span> Verificando...`;

  try {
    const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, code: otp }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (data.token) {
      localStorage.setItem('token', data.token);
      alert('Verificação realizada com sucesso!');
      window.location.href = '/client/views/selecao.html'; //mudando aquii
    } else {
      alert(data.message || 'Código inválido ou expirado.');
    }
  } catch (err) {
    console.error('Erro ao verificar o código:', err);
    alert('Erro ao verificar. Tente novamente em instantes.');
  } finally {
    // Restaura botão
    verifyBtn.disabled = false;
    verifyBtn.innerHTML = originalText;
  }
});

document.getElementById('cancelBtn').addEventListener('click', () => {
  window.location.href = '/client/views/login.html';
});
