const inputCPF = document.querySelector('.input-cpf');
const btnAcesso = document.querySelector('.btn-acesso');
const msgErro = document.getElementById('mensagem-erro');

// Máscara de CPF (formata conforme digita)
inputCPF.addEventListener('input', () => {
  let value = inputCPF.value.replace(/\D/g, '').slice(0, 11);
  value = value.replace(/(\d{3})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  inputCPF.value = value;
});

// Clique no botão "Solicitar Acesso"
btnAcesso.addEventListener('click', async () => {
  const cpfLimpo = inputCPF.value.replace(/\D/g, '');

  // Limpa mensagens anteriores
  msgErro.textContent = '';
  msgErro.classList.remove('ativo');

  if (!cpfLimpo || cpfLimpo.length !== 11) {
    msgErro.textContent = '⚠️ CPF inválido. Verifique os 11 dígitos.';
    msgErro.classList.add('ativo');
    return;
  }

  try {
    const token = localStorage.getItem('token');

    const res = await fetch(`http://localhost:5000/api/pacientes/buscar?cpf=${cpfLimpo}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      msgErro.textContent = `⚠️ ${data.message || 'Erro ao buscar paciente.'}`;
      msgErro.classList.add('ativo');
      return;
    }

    // Armazena os dados e redireciona
    localStorage.setItem('pacienteSelecionado', JSON.stringify(data));
    window.location.href = 'perfilPaciente.html'; //mudando aq
  } catch (err) {
    console.error(err);
    msgErro.textContent = '⚠️ Erro de conexão com o servidor.';
    msgErro.classList.add('ativo');
  }
});