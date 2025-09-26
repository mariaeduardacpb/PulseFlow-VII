import { API_URL } from './config.js';

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
    console.log('Buscando paciente com CPF:', cpfLimpo);
    console.log('URL:', `${API_URL}/api/pacientes/buscar?cpf=${cpfLimpo}`);

    const res = await fetch(`${API_URL}/api/pacientes/buscar?cpf=${cpfLimpo}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
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

    // Garante que o CPF está limpo antes de codificar
    const cpfCodificado = cpfLimpo.replace(/[^\d]/g, '');
    const tokenPaciente = btoa(JSON.stringify({ cpf: cpfCodificado }));
    console.log('Token do paciente gerado:', tokenPaciente);
    localStorage.setItem('tokenPaciente', tokenPaciente);

    // Verifica se o token foi salvo corretamente
    const tokenVerificado = localStorage.getItem('tokenPaciente');
    console.log('Token verificado:', tokenVerificado);

    window.location.href = 'perfilPaciente.html';
  } catch (err) {
    console.error(err);
    msgErro.textContent = '⚠️ Erro de conexão com o servidor.';
    msgErro.classList.add('ativo');
  }
});