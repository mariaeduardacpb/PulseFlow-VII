import { API_URL } from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
  await carregarDadosMedico();
  inicializarFormulario();
});

// Variável para controlar se o formulário já foi submetido
let formSubmitted = false;

// Função para mostrar mensagem de aviso
function mostrarAviso(mensagem, tipo = 'success') {
  const aviso = document.createElement('div');
  aviso.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #ffffff;
    color: #1e293b;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    z-index: 1000;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    border: 2px solid ${tipo === 'error' ? '#fecaca' : '#bbf7d0'}; 
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 300px;
    max-width: 400px;
    animation: slideIn 0.3s ease-out;
  `;

  const icon = document.createElement('div');
  icon.innerHTML = tipo === 'error' ? `
    <svg width="24" height="24" stroke="currentColor" fill="none" style="color: #dc2626;">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ` : `
    <svg width="24" height="24" stroke="currentColor" fill="none" style="color: #059669;">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  `;

  const textContainer = document.createElement('div');
  textContainer.style.cssText = `
    flex: 1;
    line-height: 1.4;
  `;
  textContainer.textContent = mensagem;

  const closeButton = document.createElement('button');
  closeButton.style.cssText = `
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: #94a3b8;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
    border-radius: 4px;
  `;
  closeButton.innerHTML = `
    <svg width="20" height="20" stroke="currentColor" fill="none">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  `;
  closeButton.onclick = () => {
    aviso.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      if (document.body.contains(aviso)) {
        document.body.removeChild(aviso);
      }
    }, 300);
  };

  aviso.appendChild(icon);
  aviso.appendChild(textContainer);
  aviso.appendChild(closeButton);
  document.body.appendChild(aviso);

  // Adiciona estilo para a animação
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  setTimeout(() => {
    if (document.body.contains(aviso)) {
      aviso.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        if (document.body.contains(aviso)) {
          document.body.removeChild(aviso);
          document.head.removeChild(style);
        }
      }, 300);
    }
  }, 5000);
}

// Função para mostrar erro
function mostrarErro(mensagem) {
  const erroBox = document.getElementById('erroPerfil');
  if (!erroBox) return;
  
  erroBox.querySelector('#errorText').textContent = mensagem;
  erroBox.style.display = 'flex';
  erroBox.style.animation = 'slideDown 0.3s ease-out';
  
  setTimeout(() => {
    erroBox.style.display = 'none';
  }, 5000);
}

// Função para validar um campo específico
function validarCampo(campo) {
  if (!campo.readOnly) {
    campo.classList.add('touched');
    return campo.checkValidity();
  }
  return true;
}

// Função para validar todos os campos
function validarFormulario() {
  const campos = document.querySelectorAll('input, select, textarea');
  let valido = true;

  campos.forEach(campo => {
    if (!validarCampo(campo)) {
      valido = false;
    }
  });

  return valido;
}

// Função para inicializar o formulário
function inicializarFormulario() {
  // Contador de caracteres para textarea
  const textarea = document.getElementById('prontuario');
  const charCount = document.getElementById('charCount');
  
  if (textarea && charCount) {
    textarea.addEventListener('input', () => {
      const count = textarea.value.length;
      charCount.textContent = count;
      
      if (count > 1000) {
        charCount.style.color = '#dc2626';
      } else if (count > 800) {
        charCount.style.color = '#f59e0b';
      } else {
        charCount.style.color = '#6b7280';
      }
    });
  }

  // Validação em tempo real
  const campos = document.querySelectorAll('input, select, textarea');
  campos.forEach(campo => {
    campo.addEventListener('blur', () => {
      validarCampo(campo);
    });
    
    campo.addEventListener('input', () => {
      if (campo.classList.contains('touched')) {
        validarCampo(campo);
      }
    });
  });

  // Event listener para o formulário
  const form = document.getElementById('mainForm');
  if (form) {
    form.addEventListener('submit', handleSubmit);
  }
}

// Função para lidar com o envio do formulário
async function handleSubmit(e) {
  e.preventDefault();
  
  formSubmitted = true;
  
  if (!validarFormulario()) {
    mostrarAviso('Por favor, preencha todos os campos obrigatórios corretamente.', 'error');
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    mostrarAviso("Sessão expirada. Por favor, faça login novamente.", 'error');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
    return;
  }

  const paciente = JSON.parse(localStorage.getItem("pacienteSelecionado"));
  if (!paciente?.cpf) {
    mostrarAviso("Paciente não selecionado. Volte à tela de seleção.", 'error');
    setTimeout(() => {
      window.location.href = 'selecao.html';
    }, 2000);
    return;
  }

  const body = {
    cpf: paciente.cpf,
    titulo: document.getElementById("titulo").value.trim(),
    data: document.getElementById("data").value,
    categoria: document.getElementById("categoria").value,
    tipoConsulta: document.getElementById("tipoConsulta").value,
    medico: document.getElementById("medico").value,
    anotacao: document.getElementById("prontuario").value.trim(),
  };

  // Mostrar loading
  const submitBtn = document.querySelector('.btn-primary');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = `
    <svg width="20" height="20" stroke="currentColor" fill="none" style="animation: spin 1s linear infinite;">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
    Salvando...
  `;
  submitBtn.disabled = true;

  try {
    const res = await fetch(`${API_URL}/api/anotacoes/nova`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Erro ao criar anotação');
    }

    mostrarAviso('Registro clínico criado com sucesso!', 'success');
    
    // Atualizar progresso
    atualizarProgresso(3);
    
    setTimeout(() => {
      window.location.href = 'historicoProntuario.html';
    }, 2000);

  } catch (error) {
    console.error('Erro ao criar anotação:', error);
    mostrarAviso(error.message || 'Erro ao criar registro clínico. Tente novamente.', 'error');
  } finally {
    // Restaurar botão
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}

// Função para atualizar o progresso
function atualizarProgresso(step) {
  const steps = document.querySelectorAll('.progress-step');
  steps.forEach((stepEl, index) => {
    if (index < step) {
      stepEl.classList.add('active');
    } else {
      stepEl.classList.remove('active');
    }
  });
}

// Função para carregar dados do médico
async function carregarDadosMedico() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado');
    }

    const res = await fetch(`${API_URL}/api/usuarios/perfil`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error('Erro ao carregar dados do médico');
    }

    const medico = await res.json();
    
    // Preenche o campo de médico responsável
    const medicoInput = document.getElementById("medico");
    if (medicoInput) {
      const prefixo = medico.genero?.toLowerCase() === 'feminino' ? 'Dra.' : 'Dr.';
      const nomeFormatado = `${prefixo} ${medico.nome}`;
      medicoInput.value = nomeFormatado;
      medicoInput.readOnly = true;
    }

    // Preenche o campo de especialidade
    const categoriaInput = document.getElementById("categoria");
    if (medico.areaAtuacao) {
      categoriaInput.value = medico.areaAtuacao;
      categoriaInput.readOnly = true;
    }

    // Define a data atual como padrão
    const dataInput = document.getElementById("data");
    if (dataInput) {
      const hoje = new Date();
      const dataAjustada = new Date(hoje.getTime() - (hoje.getTimezoneOffset() * 60000));
      const dataFormatada = dataAjustada.toISOString().split('T')[0];
      dataInput.value = dataFormatada;
      dataInput.max = dataFormatada;
    }

    // Remove a classe touched de todos os campos
    document.querySelectorAll('input, select, textarea').forEach(field => {
      field.classList.remove('touched');
    });

    // Atualizar progresso inicial
    atualizarProgresso(1);

  } catch (error) {
    console.error("Erro ao carregar dados do médico:", error);
    mostrarErro("Erro ao carregar dados do médico. Por favor, recarregue a página.");
  }
}

// Adicionar estilos CSS para animações
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .btn-primary:disabled:hover {
    transform: none;
    box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
  }
`;
document.head.appendChild(style);
      const hoje = new Date();
      const dataAjustada = new Date(hoje.getTime() - (hoje.getTimezoneOffset() * 60000));
      const dataFormatada = dataAjustada.toISOString().split('T')[0];
      dataInput.value = dataFormatada;
      dataInput.max = dataFormatada;

    // Remove a classe touched de todos os campos
    document.querySelectorAll('input, select, textarea').forEach(field => {
      field.classList.remove('touched');
    });

    // Atualizar progresso inicial
    atualizarProgresso(1);

// Adicionar estilos CSS para animações
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .btn-primary:disabled:hover {
    transform: none;
    box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
  }
`;
document.head.appendChild(style);
// Inicialização
document.addEventListener("DOMContentLoaded", async function () {
  // Carrega os dados do médico primeiro
  await carregarDadosMedico();
  
  // Resto do código de inicialização
  // ... existing code ...
});
