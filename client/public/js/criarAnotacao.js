import { API_URL } from './config.js';
import { validateActivePatient, redirectToPatientSelection, handleApiError } from './utils/patientValidation.js';

document.addEventListener('DOMContentLoaded', async () => {
  const validation = validateActivePatient();
  if (!validation.valid) {
    redirectToPatientSelection(validation.error);
    return;
  }
  
  // Carrega os dados do médico primeiro (preenche campos automaticamente)
  try {
    await carregarDadosMedico();
  } catch (error) {
    console.error('Erro ao carregar dados do médico:', error);
  }
  
  // Inicializa o formulário
  inicializarFormulario();
});

// Variável para controlar se o formulário já foi submetido
let formSubmitted = false;

// Função para mostrar mensagem de aviso
function mostrarAviso(mensagem, tipo = 'success') {
  const icones = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: icones[tipo] || '',
      text: mensagem,
      icon: tipo,
      timer: 3000,
      timerProgressBar: true,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
      background: '#ffffff',
      color: '#1e293b',
      customClass: {
        popup: 'swal-popup-custom',
        title: 'swal-title-custom',
        content: 'swal-content-custom'
      }
    });
  } else {
    console.log(`${tipo.toUpperCase()}: ${mensagem}`);
  }
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

  const validation = validateActivePatient();
  if (!validation.valid) {
    redirectToPatientSelection(validation.error);
    return;
  }
  
  const paciente = validation.paciente;

  const body = {
    cpf: validation.cpf,
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

    const handled = await handleApiError(res);
    if (handled) {
      return;
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erro ao criar anotação');
    }

    // Atualizar progresso
    atualizarProgresso(3);
    
    // Mostrar popup de sucesso igual ao de salvar PDF
    Swal.fire({
      icon: 'success',
      title: 'Registro Criado!',
      text: 'O registro clínico foi salvo com sucesso.',
      confirmButtonColor: '#002A42'
    }).then(() => {
      window.location.href = 'historicoProntuario.html';
    });

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
      console.log('Campo médico preenchido:', nomeFormatado);
    } else {
      console.error('Campo médico não encontrado no DOM');
    }

    // Preenche o campo de especialidade
    const categoriaInput = document.getElementById("categoria");
    if (categoriaInput) {
      if (medico.areaAtuacao) {
        categoriaInput.value = medico.areaAtuacao;
        categoriaInput.readOnly = true;
        console.log('Campo categoria preenchido:', medico.areaAtuacao);
      } else {
        console.warn('Área de atuação não encontrada no perfil do médico');
        categoriaInput.value = 'Especialidade não informada';
        categoriaInput.readOnly = true;
      }
    } else {
      console.error('Campo categoria não encontrado no DOM');
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
