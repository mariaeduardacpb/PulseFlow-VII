import { API_URL } from './config.js';

const inputCPF = document.querySelector('.input-cpf');
const inputCodigo = document.querySelector('.input-codigo');
const btnAcesso = document.querySelector('#btn-acesso');
const msgErro = document.getElementById('mensagem-erro');
const codigoGroup = document.getElementById('codigo-group');

let cpfValido = false;

// Máscara de CPF (formata conforme digita)
inputCPF.addEventListener('input', () => {
  let value = inputCPF.value.replace(/\D/g, '').slice(0, 11);
  value = value.replace(/(\d{3})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  inputCPF.value = value;
});

// Máscara para código de acesso (apenas números, máximo 6 dígitos)
inputCodigo.addEventListener('input', () => {
  let value = inputCodigo.value.replace(/\D/g, '').slice(0, 6);
  inputCodigo.value = value;
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

  // Se ainda não validou o CPF, faz a primeira verificação
  if (!cpfValido) {
    await verificarCPF(cpfLimpo);
  } else {
    // Se CPF já foi validado, agora busca com código
    await buscarComCodigo(cpfLimpo);
  }
});

// Função para enviar notificação ao paciente
async function enviarNotificacaoPaciente(cpfLimpo) {
  try {
    // Buscar dados do médico logado
    const token = localStorage.getItem('token');
    if (!token) return;

    const resMedico = await fetch(`${API_URL}/api/usuarios/perfil`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (resMedico.ok) {
      const medico = await resMedico.json();
      
      // Enviar notificação
      await fetch(`${API_URL}/api/access-code/notificar-solicitacao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cpf: cpfLimpo,
          medicoNome: medico.nome,
          especialidade: medico.areaAtuacao || medico.especialidade
        })
      });
      
      console.log('✅ Notificação enviada ao paciente');
    }
  } catch (error) {
    console.log('⚠️ Não foi possível enviar notificação:', error);
  }
}

// Função para verificar se o CPF existe
async function verificarCPF(cpfLimpo) {
  try {
    const res = await fetch(`${API_URL}/api/pacientes/buscar?cpf=${cpfLimpo}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await res.json();

    if (!res.ok) {
      msgErro.textContent = `⚠️ ${data.message || 'CPF não encontrado.'}`;
      msgErro.classList.add('ativo');
      return;
    }

    cpfValido = true;
    codigoGroup.style.display = 'block';
    btnAcesso.textContent = 'Acessar com Código';
    inputCodigo.focus();
    
    msgErro.textContent = '✅ CPF encontrado! Digite o código de acesso do paciente.';
    msgErro.classList.add('ativo');
    msgErro.style.color = '#4CAF50';

    // Enviar notificação ao paciente
    await enviarNotificacaoPaciente(cpfLimpo);

  } catch (err) {
    console.error(err);
    msgErro.textContent = '⚠️ Erro de conexão com o servidor.';
    msgErro.classList.add('ativo');
  }
}

// Função para buscar paciente com CPF + código
async function buscarComCodigo(cpfLimpo) {
  const codigoAcesso = inputCodigo.value.replace(/\D/g, '');

  if (!codigoAcesso || codigoAcesso.length !== 6) {
    msgErro.textContent = '⚠️ Código de acesso inválido. Digite os 6 dígitos.';
    msgErro.classList.add('ativo');
    return;
  }

  try {
    const requestBody = {
      cpf: cpfLimpo,
      codigoAcesso: codigoAcesso
    };

    const res = await fetch(`${API_URL}/api/pacientes/buscar-com-codigo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await res.json();

    if (!res.ok) {
      msgErro.textContent = `⚠️ ${data.message || 'Código de acesso inválido ou expirado.'}`;
      msgErro.classList.add('ativo');
      return;
    }

    localStorage.setItem('pacienteSelecionado', JSON.stringify(data));

    const cpfCodificado = cpfLimpo.replace(/[^\d]/g, '');
    const tokenPaciente = btoa(JSON.stringify({ cpf: cpfCodificado }));
    localStorage.setItem('tokenPaciente', tokenPaciente);

    window.location.href = 'perfilPaciente.html';
  } catch (err) {
    console.error(err);
    msgErro.textContent = '⚠️ Erro de conexão com o servidor.';
    msgErro.classList.add('ativo');
  }
}