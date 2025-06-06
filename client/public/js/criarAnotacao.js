document.addEventListener('DOMContentLoaded', async () => {
  // Toggle da Sidebar
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.sidebar');
  const content = document.querySelector('.content');

  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
  });

  // Fechar sidebar ao clicar fora
  document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target) && sidebar.classList.contains('active')) {
      sidebar.classList.remove('active');
    }
  });

  // Carrega dados do médico logado
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'login.html';
      return;
    }

    const res = await fetch('http://localhost:65432/api/usuarios/perfil', {
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
      // Ajusta para o fuso horário brasileiro (UTC-3)
      const dataAjustada = new Date(hoje.getTime() - (hoje.getTimezoneOffset() * 60000));
      const dataFormatada = dataAjustada.toISOString().split('T')[0];
      dataInput.value = dataFormatada;
      dataInput.max = dataFormatada; // Não permite datas futuras
    }

    // Remove a classe touched de todos os campos ao carregar a página
    document.querySelectorAll('input, select, textarea').forEach(field => {
      field.classList.remove('touched');
    });

  } catch (error) {
    console.error("Erro ao carregar dados do médico:", error);
    mostrarAviso("Erro ao carregar dados do médico. Por favor, recarregue a página.");
  }
});

// Variável para controlar se o formulário já foi submetido
let formSubmitted = false;

// Função para mostrar mensagem de aviso
function mostrarAviso(mensagem) {
  const aviso = document.createElement('div');
  aviso.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #ffffff;
    color: #002A42;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 42, 66, 0.1);
    z-index: 1000;
    font-family: 'Montserrat', sans-serif;
    font-size: 14px;
    border: 1px solid #e1e5eb;
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 300px;
    max-width: 400px;
    animation: slideIn 0.3s ease-out;
  `;

  // Ícone de alerta
  const icon = document.createElement('div');
  icon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #00c3b7;">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  `;

  // Container do texto
  const textContainer = document.createElement('div');
  textContainer.style.cssText = `
    flex: 1;
    line-height: 1.4;
  `;
  textContainer.textContent = mensagem;

  // Botão de fechar
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
  `;
  closeButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;
  closeButton.onclick = () => {
    aviso.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      document.body.removeChild(aviso);
      document.head.removeChild(style);
    }, 300);
  };

  // Adiciona os elementos ao aviso
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

  // Remove o aviso após 5 segundos
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

document.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  // Marca que o formulário foi submetido
  formSubmitted = true;
  
  // Valida todos os campos
  if (!validarFormulario()) {
    mostrarAviso('Por favor, preencha todos os campos obrigatórios corretamente.');
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    mostrarAviso("Sessão expirada. Por favor, faça login novamente.");
    window.location.href = 'login.html';
    return;
  }

  // Recupera o CPF do paciente selecionado
  const paciente = JSON.parse(localStorage.getItem("pacienteSelecionado"));
  if (!paciente?.cpf) {
    mostrarAviso("Paciente não selecionado. Volte à tela de seleção.");
    window.location.href = 'selecao.html';
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

  try {
    const res = await fetch("http://localhost:65432/api/anotacoes/nova", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Erro ao salvar');

    mostrarAviso("Registro clínico salvo com sucesso!");
    document.querySelector("form").reset();
    
    // Redireciona para a página de histórico após salvar
    window.location.href = 'historicoProntuario.html';
  } catch (err) {
    mostrarAviso("Erro ao salvar: " + err.message);
  }
});

function mostrarErro(mensagem) {
  const erroBox = document.getElementById('erroPerfil');
  if (!erroBox) return;
  erroBox.textContent = `⚠️ ${mensagem}`;
  erroBox.style.display = 'block';
  erroBox.style.animation = 'fadeIn 0.3s ease-in';
}

async function carregarDadosMedico() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado. Por favor, faça login novamente.');
    }

    const res = await fetch('http://localhost:65432/api/usuarios/perfil', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Erro ao carregar dados do médico');
    }

    const medico = await res.json();
    const prefixo = medico.genero?.toLowerCase() === 'feminino' ? 'Dra.' : 'Dr.';
    const nomeFormatado = `${prefixo} ${medico.nome}`;
    
    const tituloSidebar = document.querySelector('.sidebar .profile h3');
    if (tituloSidebar) {
      tituloSidebar.textContent = nomeFormatado;
    }

    // Preenche o campo do médico responsável
    const campoMedico = document.getElementById('medico');
    if (campoMedico) {
      campoMedico.value = nomeFormatado;
    }

    return true;
  } catch (error) {
    console.error("Erro ao carregar dados do médico:", error);
    const fallback = document.querySelector('.sidebar .profile h3');
    if (fallback) fallback.textContent = 'Dr(a). Nome não encontrado';
    mostrarErro("Erro ao carregar dados do médico. Por favor, faça login novamente.");
    return false;
  }
}

// Inicialização
document.addEventListener("DOMContentLoaded", async function () {
  // Carrega os dados do médico primeiro
  await carregarDadosMedico();
  
  // Resto do código de inicialização
  // ... existing code ...
});
