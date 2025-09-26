import { API_URL } from './config.js';

document.addEventListener("DOMContentLoaded", async () => {
  // Verificar se os elementos existem antes de adicionar event listeners
  const toggleButton = document.querySelector(".menu-toggle");
  const sidebar = document.querySelector(".sidebar");

  if (toggleButton && sidebar) {
    toggleButton.addEventListener("click", () => {
      sidebar.classList.toggle("active");
      toggleButton.classList.toggle("shifted");
    });
  }

  function mostrarErro(mensagem) {
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

    const icon = document.createElement('div');
    icon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #00c3b7;">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
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

    aviso.appendChild(icon);
    aviso.appendChild(textContainer);
    aviso.appendChild(closeButton);
    document.body.appendChild(aviso);

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

  async function carregarDadosMedico() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token não encontrado. Por favor, faça login novamente.');
      }

      const res = await fetch(`${API_URL}/api/usuarios/perfil`, {
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

      return true;
    } catch (error) {
      console.error("Erro ao carregar dados do médico:", error);
      const fallback = document.querySelector('.sidebar .profile h3');
      if (fallback) fallback.textContent = 'Dr(a). Nome não encontrado';
      mostrarErro("Erro ao carregar dados do médico. Por favor, faça login novamente.");
      return false;
    }
  }

  async function carregarDadosPaciente() {
    try {
      const tokenPaciente = localStorage.getItem('tokenPaciente');
      if (!tokenPaciente) {
        throw new Error('Token do paciente não encontrado. Por favor, selecione um paciente.');
      }

      const decodedPayload = JSON.parse(atob(tokenPaciente));
      const cpf = decodedPayload?.cpf?.replace(/[^\d]/g, '');

      if (!cpf) {
        throw new Error('CPF não encontrado no token do paciente.');
      }

      const tokenMedico = localStorage.getItem('token');
      if (!tokenMedico) {
        throw new Error('Token do médico não encontrado. Por favor, faça login novamente.');
      }

      const response = await fetch(`${API_URL}/api/pacientes/perfil/${cpf}`, {
        headers: {
          'Authorization': `Bearer ${tokenMedico}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar dados do paciente.');
      }

      const paciente = await response.json();
      preencherPerfil(paciente);
      return true;
    } catch (error) {
      console.error('Erro ao carregar dados do paciente:', error);
      mostrarErro(error.message);
      return false;
    }
  }

  function preencherPerfil(paciente) {
    if (!paciente) return;

    // Atualiza a foto do perfil
    const imagemPerfil = document.querySelector('.profile-box img');
    if (imagemPerfil) {
      imagemPerfil.src = paciente.fotoPerfil || '/client/public/assets/User_logonegativo.png';
      imagemPerfil.onerror = () => {
        imagemPerfil.src = '/client/public/assets/User_logonegativo.png';
      };
    }

    // Formata os dados antes de exibir
    const dadosFormatados = {
      nomePaciente: paciente.nome || '-',
      generoPaciente: paciente.genero || '-',
      idadePaciente: calcularIdadeTexto(paciente.dataNascimento),
      nacionalidadePaciente: paciente.nacionalidade || '-',
      alturaPaciente: paciente.altura ? `${paciente.altura} cm` : '-',
      pesoPaciente: paciente.peso ? `${paciente.peso} kg` : '-',
      profissaoPaciente: paciente.profissao || '-',
      emailPaciente: paciente.email || '-',
      telefonePaciente: formatarTelefone(paciente.telefone) || '-',
      observacoesPaciente: paciente.observacoes || 'Nenhuma'
    };

    // Atualiza cada campo individualmente
    Object.entries(dadosFormatados).forEach(([id, valor]) => {
      const elemento = document.getElementById(id);
      if (elemento) {
        elemento.textContent = valor;
      }
    });
  }

  function formatarTelefone(telefone) {
    if (!telefone) return '-';
    const numeros = telefone.replace(/\D/g, '');
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }

  function calcularIdadeTexto(dataISO) {
    if (!dataISO) return '-';
    try {
      const nascimento = new Date(dataISO);
      const hoje = new Date();
      
      if (isNaN(nascimento.getTime()) || nascimento > hoje) {
        return '-';
      }

      let anos = hoje.getFullYear() - nascimento.getFullYear();
      let meses = hoje.getMonth() - nascimento.getMonth();
      
      if (meses < 0 || (meses === 0 && hoje.getDate() < nascimento.getDate())) {
        anos--;
        meses += 12;
      }

      return `${anos} anos e ${meses} meses`;
    } catch (error) {
      console.error("Erro ao calcular idade:", error);
      return '-';
    }
  }

  async function carregarUltimosRegistros() {
    try {
      const tokenMedico = localStorage.getItem('token');
      const tokenPaciente = localStorage.getItem('tokenPaciente');

      if (!tokenMedico || !tokenPaciente) {
        mostrarErro("Sessão expirada. Faça login novamente!");
        return;
      }

      const decodedPayload = JSON.parse(atob(tokenPaciente));
      const cpf = decodedPayload?.cpf?.replace(/[^\d]/g, '');

      if (!cpf) {
        mostrarErro("CPF não encontrado no token do paciente.");
        return;
      }

      const response = await fetch(`${API_URL}/api/anotacoes/${cpf}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tokenMedico}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        mostrarErro("Erro ao buscar anotações!");
        return;
      }

      const data = await response.json();
      renderizarRegistros(data);
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
      mostrarErro("Erro interno ao carregar anotações.");
    }
  }

  function renderizarRegistros(registros) {
    const shortcutGrid = document.querySelector('.shortcut-grid');
    if (!shortcutGrid) return;

    shortcutGrid.innerHTML = '';

    if (!registros || registros.length === 0) {
      shortcutGrid.innerHTML = `
        <div class="no-data-msg">
          ⚠️ <span>Nenhuma anotação encontrada.</span>
        </div>
      `;
      return;
    }

    // Pega apenas os 3 registros mais recentes
    const registrosRecentes = registros.slice(0, 3);

    registrosRecentes.forEach(registro => {
      const card = document.createElement('div');
      card.className = 'shortcut-card';
      card.innerHTML = `
        <p>
          <strong>Motivo da Consulta:</strong> ${registro.titulo || 'Não informado'}<br>
          <strong>Médico Responsável:</strong> ${registro.medico || 'Não informado'}<br>
          <strong>Especialidade:</strong> ${registro.categoria || 'Não informada'}<br>
          <strong>Data:</strong> ${new Date(registro.data).toLocaleDateString()}
        </p>
        <button onclick="visualizarRegistro('${registro._id}')">Visualizar</button>
      `;
      shortcutGrid.appendChild(card);
    });
  }

  // Função para visualizar um registro específico
  window.visualizarRegistro = function(id) {
    if (!id) return;
    window.location.href = `vizualizacaoAnotacao.html?id=${encodeURIComponent(id)}`;
  };

  // Inicializar
  try {
    await carregarDadosMedico();
    await carregarDadosPaciente();
    await carregarUltimosRegistros();
  } catch (error) {
    console.error("Erro durante a inicialização:", error);
    mostrarErro("Ocorreu um erro ao carregar os dados. Por favor, tente novamente.");
  }
});