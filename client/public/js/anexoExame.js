import { API_URL } from './config.js';

document.addEventListener("DOMContentLoaded", () => {
  const examGrid = document.getElementById("examGrid");
  const semExamesMsg = document.getElementById("no-data-msg");
  const contadorExames = document.getElementById("contador-exames");

  const toggleButton = document.querySelector(".menu-toggle");
  const sidebar = document.querySelector(".sidebar");

  toggleButton.addEventListener("click", () => {
    sidebar.classList.toggle("active");
    toggleButton.classList.toggle("shifted");
  });

  let examesCarregados = []; // <<< variável global para armazenar exames

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

  function renderizarExames(listaExames) {
    examGrid.innerHTML = "";

    if (listaExames.length === 0) {
      semExamesMsg.style.display = "block";
      contadorExames.style.display = "none";
    } else {
      semExamesMsg.style.display = "none";
      contadorExames.style.display = "block";
      contadorExames.textContent = `🔎 ${listaExames.length} exame${listaExames.length > 1 ? 's' : ''} encontrado${listaExames.length > 1 ? 's' : ''}.`;

      // Ordenar exames por data (mais recentes primeiro)
      const examesOrdenados = listaExames.sort((a, b) => new Date(b.data) - new Date(a.data));

      examesOrdenados.forEach((exame) => {
        const card = document.createElement("div");
        card.className = "exam-card";
        
        // Determinar ícone baseado no tipo de arquivo
        const extensao = exame.filePath.split('.').pop().toLowerCase();
        let icone = '📄';
        if (extensao === 'pdf') icone = '📕';
        else if (['jpg', 'jpeg', 'png', 'heic'].includes(extensao)) icone = '🖼️';
        
        // Formatar data
        const dataFormatada = new Date(exame.data).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });

        card.innerHTML = `
          <div class="exam-header">
            <span class="exam-icon">${icone}</span>
            <div class="exam-info">
              <h3>${exame.nome}</h3>
              <p class="exam-category">${exame.categoria}</p>
              <p class="exam-date">📅 ${dataFormatada}</p>
            </div>
          </div>
          <div class="exam-actions">
            <button class="btn-view" onclick="visualizarExame('${exame._id}', '${exame.nome}', '${extensao}')">
              👁️ Visualizar
            </button>
            <button class="btn-download" onclick="baixarExame('${exame._id}', '${exame.nome}')">
              ⬇️ Baixar
            </button>
          </div>
        `;
        examGrid.appendChild(card);
      });
    }
  }

  async function buscarExamesPaciente() {
    try {
      const tokenMedico = localStorage.getItem('token');
      const tokenPaciente = localStorage.getItem('tokenPaciente');

      // Verificar se os tokens existem
      if (!tokenMedico || !tokenPaciente) {
        console.error('Tokens ausentes:', {
          tokenMedico: !tokenMedico,
          tokenPaciente: !tokenPaciente
        });
        mostrarErro("Sessão expirada. Faça login novamente!");
        return;
      }

      try {
        // Decodificar o token JWT simples
        let decodedPayload;
        try {
          // JWT simples com apenas payload (sem header e signature)
          decodedPayload = JSON.parse(atob(tokenPaciente));
        } catch (decodeError) {
          console.error('Erro ao decodificar token:', decodeError);
          console.log('Token recebido:', tokenPaciente);
          mostrarErro("Erro ao decodificar token do paciente.");
          return;
        }
        
        const cpf = decodedPayload?.cpf?.replace(/[^\d]/g, '');

        if (!cpf) {
          mostrarErro("CPF não encontrado no token do paciente.");
          return;
        }
        
        const response = await fetch(`${API_URL}/api/anexoExame/medico?cpf=${cpf}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${tokenMedico}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          mostrarErro(`Erro ao buscar exames: ${response.status} - ${errorText}`);
          return;
        }

        const exames = await response.json();

        examesCarregados = exames;
        renderizarExames(examesCarregados);

      } catch (error) {
        console.error('Erro ao buscar exames:', error);
        mostrarErro("Erro interno ao buscar exames.");
      }
    } catch (error) {
      console.error('Erro ao buscar exames:', error);
      mostrarErro("Erro interno ao buscar exames.");
    }
  }

  // Função para visualizar exame
  window.visualizarExame = async function (idExame, nomeExame, extensao) {
    try {
      const token = localStorage.getItem('token');
      
      // Mostrar modal de carregamento
      const modal = document.createElement('div');
      modal.className = 'exam-modal';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>${nomeExame}</h3>
            <button class="close-modal" onclick="fecharModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="loading-spinner">
              <div class="spinner"></div>
              <p>Carregando exame...</p>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const response = await fetch(`${API_URL}/api/anexoExame/download/${idExame}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar o exame');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Atualizar modal com conteúdo
      const modalBody = modal.querySelector('.modal-body');
      
      if (extensao === 'pdf') {
        modalBody.innerHTML = `
          <iframe src="${url}" width="100%" height="600px" style="border: none;"></iframe>
          <div class="modal-actions">
            <button class="btn-download" onclick="baixarExame('${idExame}', '${nomeExame}')">
              ⬇️ Baixar PDF
            </button>
          </div>
        `;
      } else if (['jpg', 'jpeg', 'png', 'heic'].includes(extensao)) {
        modalBody.innerHTML = `
          <div class="image-container">
            <img src="${url}" alt="${nomeExame}" style="max-width: 100%; max-height: 70vh; object-fit: contain;">
          </div>
          <div class="modal-actions">
            <button class="btn-download" onclick="baixarExame('${idExame}', '${nomeExame}')">
              ⬇️ Baixar Imagem
            </button>
          </div>
        `;
      } else {
        modalBody.innerHTML = `
          <div class="unsupported-file">
            <p>⚠️ Tipo de arquivo não suportado para visualização</p>
            <p>Extensão: .${extensao}</p>
            <div class="modal-actions">
              <button class="btn-download" onclick="baixarExame('${idExame}', '${nomeExame}')">
                ⬇️ Baixar Arquivo
              </button>
            </div>
          </div>
        `;
      }

    } catch (error) {
      console.error('Erro ao visualizar exame:', error);
      mostrarErro("Erro ao carregar o exame para visualização.");
      
      // Fechar modal se existir
      const modal = document.querySelector('.exam-modal');
      if (modal) {
        document.body.removeChild(modal);
      }
    }
  };

  // Função para fechar modal
  window.fecharModal = function() {
    const modal = document.querySelector('.exam-modal');
    if (modal) {
      document.body.removeChild(modal);
    }
  };

  // Função para baixar exame
  window.baixarExame = async function (idExame, nomeExame) {
    try {
      const token = localStorage.getItem('token');
  
      const response = await fetch(`${API_URL}/api/anexoExame/download/${idExame}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      if (!response.ok) {
        mostrarErro("Erro ao baixar o exame!");
        return;
      }
  
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
  
      // Pega a extensão real pelo tipo MIME retornado
      const contentType = response.headers.get("Content-Type");
      let extensao = '';
  
      if (contentType.includes('pdf')) {
        extensao = 'pdf';
      } else if (contentType.includes('jpeg')) {
        extensao = 'jpg'; // para imagens JPEG ou JFIF
      } else if (contentType.includes('jfif')) {
        extensao = 'jfif';
      } else if (contentType.includes('png')) {
        extensao = 'png';
      } else {
        extensao = 'file'; // fallback
      }
  
      const a = document.createElement('a');
      a.href = url;
      a.download = `${nomeExame}.${extensao}`; // agora usa a extensão real!
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar exame:', error);
      mostrarErro("Erro interno ao baixar exame.");
    }
  };

  // Filtro local dos exames carregados
  document.getElementById("buscarExameBtn").addEventListener("click", () => {
    const nomeBusca = document.getElementById('nomeExame').value.trim().toLowerCase();
    const especialidadeBusca = document.getElementById('especialidade').value.trim().toLowerCase();
    const dataBusca = document.getElementById('dataExame').value;

    const examesFiltrados = examesCarregados.filter(exame => {
      const nomeExame = exame.nome.toLowerCase();
      const categoriaExame = exame.categoria.toLowerCase();
      const dataExame = new Date(exame.data);
      const dataExameFormatada = `${dataExame.getFullYear()}-${String(dataExame.getMonth() + 1).padStart(2, '0')}-${String(dataExame.getDate()).padStart(2, '0')}`;

      let nomeCombina = true;
      let especialidadeCombina = true;
      let dataCombina = true;

      if (nomeBusca) {
        nomeCombina = nomeExame.includes(nomeBusca);
      }

      if (especialidadeBusca) {
        especialidadeCombina = categoriaExame.includes(especialidadeBusca);
      }

      if (dataBusca) {
        dataCombina = dataBusca === dataExameFormatada;
      }

      return nomeCombina && especialidadeCombina && dataCombina;
    });

    renderizarExames(examesFiltrados);
  });

  // Busca em tempo real nos campos de filtro
  document.getElementById('nomeExame').addEventListener('input', () => {
    aplicarFiltros();
  });

  document.getElementById('especialidade').addEventListener('input', () => {
    aplicarFiltros();
  });

  document.getElementById('dataExame').addEventListener('change', () => {
    aplicarFiltros();
  });

  // Função para aplicar filtros automaticamente
  function aplicarFiltros() {
    const nomeBusca = document.getElementById('nomeExame').value.trim().toLowerCase();
    const especialidadeBusca = document.getElementById('especialidade').value.trim().toLowerCase();
    const dataBusca = document.getElementById('dataExame').value;

    const examesFiltrados = examesCarregados.filter(exame => {
      const nomeExame = exame.nome.toLowerCase();
      const categoriaExame = exame.categoria.toLowerCase();
      const dataExame = new Date(exame.data);
      const dataExameFormatada = `${dataExame.getFullYear()}-${String(dataExame.getMonth() + 1).padStart(2, '0')}-${String(dataExame.getDate()).padStart(2, '0')}`;

      let nomeCombina = true;
      let especialidadeCombina = true;
      let dataCombina = true;

      if (nomeBusca) {
        nomeCombina = nomeExame.includes(nomeBusca);
      }

      if (especialidadeBusca) {
        especialidadeCombina = categoriaExame.includes(especialidadeBusca);
      }

      if (dataBusca) {
        dataCombina = dataBusca === dataExameFormatada;
      }

      return nomeCombina && especialidadeCombina && dataCombina;
    });

    renderizarExames(examesFiltrados);
  }

  // Função para limpar filtros
  function limparFiltros() {
    document.getElementById('nomeExame').value = '';
    document.getElementById('especialidade').value = '';
    document.getElementById('dataExame').value = '';
    renderizarExames(examesCarregados);
  }

  // Adicionar botão de limpar filtros
  document.addEventListener("DOMContentLoaded", () => {
    const formActions = document.querySelector('.form-actions');
    if (formActions) {
      const clearButton = document.createElement('button');
      clearButton.className = 'btn-secondary';
      clearButton.textContent = 'Limpar Filtros';
      clearButton.onclick = limparFiltros;
      formActions.appendChild(clearButton);
    }
  });

  // Função de debug para testar a API
  async function debugAPI() {
    try {
      console.log('=== TESTANDO ROTA DE DEBUG ===');
      const response = await fetch(`${API_URL}/api/anexoExame/debug`);
      const data = await response.json();
      console.log('Debug API response:', data);
      
      if (data.totalExames === 0) {
        mostrarErro("Nenhum exame encontrado no banco de dados. Verifique se há exames cadastrados.");
      } else {
        console.log(`Encontrados ${data.totalExames} exames no banco de dados`);
        
        // Testar com o primeiro paciente encontrado
        if (data.pacientes && data.pacientes.length > 0) {
          const primeiroPaciente = data.pacientes[0];
          console.log('Testando com paciente:', primeiroPaciente);
          await testarBuscaComCPF(primeiroPaciente.cpf);
        }
      }
    } catch (error) {
      console.error('Erro no debug da API:', error);
    }
  }

  // Função para testar busca com CPF específico
  async function testarBuscaComCPF(cpf) {
    try {
      console.log('=== TESTANDO BUSCA COM CPF ===');
      console.log('CPF para teste:', cpf);
      
      const tokenMedico = localStorage.getItem('token');
      const cpfLimpo = cpf.replace(/[^\d]/g, '');
      
      const response = await fetch(`${API_URL}/api/anexoExame/medico?cpf=${cpfLimpo}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tokenMedico}`,
          "Content-Type": "application/json"
        }
      });

      console.log('Status da resposta:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta:', errorText);
        return;
      }

      const exames = await response.json();
      console.log('Exames encontrados para o paciente:', exames);
      
      if (exames.length > 0) {
        console.log('✅ SUCESSO: Exames encontrados!');
        examesCarregados = exames;
        renderizarExames(examesCarregados);
      } else {
        console.log('⚠️ Nenhum exame encontrado para este paciente');
      }
    } catch (error) {
      console.error('Erro ao testar busca:', error);
    }
  }

  // Função global para testar API (chamada pelo botão)
  window.testarAPI = async function() {
    console.log('=== TESTE MANUAL DA API ===');
    
    // Testar com CPF conhecido do debug
    const cpfTeste = '51232056839'; // CPF da Manuela Tagliatti
    console.log('Testando com CPF:', cpfTeste);
    
    await testarBuscaComCPF(cpfTeste);
  };

  carregarDadosMedico();
  // Carrega os exames assim que a página abrir
  buscarExamesPaciente();
});
