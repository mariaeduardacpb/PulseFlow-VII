import { API_URL } from './config.js';

// Variáveis globais
let allAnotacoes = [];
let filteredAnotacoes = [];
let currentFilters = {
  category: '',
  doctor: '',
  date: ''
};

// Elementos DOM
let recordsGrid, noRecords, totalRecords, filterCategory, filterDoctor, filterDate, btnLimparFiltros, btnNovoRegistro, btnNovoRegistroEmpty;

document.addEventListener('DOMContentLoaded', async () => {
  
  // Aguardar carregamento dos componentes
  setTimeout(async () => {
    await carregarDadosMedico();
    await inicializarPagina();
  }, 500);
});

async function inicializarPagina() {
  try {
    
    // Obter elementos DOM
    obterElementosDOM();
    
    // Verificar paciente selecionado
    const paciente = JSON.parse(localStorage.getItem('pacienteSelecionado'));
    if (!paciente?.cpf) {
      mostrarErro('Nenhum paciente selecionado. Por favor, selecione um paciente primeiro.');
      return;
    }
    
    
    // Configurar event listeners
    configurarEventListeners();
    
    // Mostrar loading
    mostrarAviso('Carregando registros clínicos...', 'info');
    
    // Carregar dados
    await carregarRegistros(paciente.cpf);
    
    
  } catch (error) {
    console.error('Erro ao inicializar página:', error);
    mostrarErro('Erro ao carregar a página. Por favor, recarregue.');
  }
}

function obterElementosDOM() {
  recordsGrid = document.getElementById('recordsGrid');
  noRecords = document.getElementById('noRecords');
  totalRecords = document.getElementById('totalRecords');
  filterCategory = document.getElementById('filterCategory');
  filterDoctor = document.getElementById('filterDoctor');
  filterDate = document.getElementById('filterDate');
  btnLimparFiltros = document.getElementById('btnLimparFiltros');
  btnNovoRegistro = document.getElementById('btnNovoRegistro');
  btnNovoRegistroEmpty = document.getElementById('btnNovoRegistroEmpty');
}

function configurarEventListeners() {
  // Filtros
  if (filterCategory) {
    filterCategory.addEventListener('input', aplicarFiltros);
    configurarSelectCustomizado();
  }
  
  if (filterDoctor) {
    filterDoctor.addEventListener('input', aplicarFiltros);
  }
  
  if (filterDate) {
    filterDate.addEventListener('change', aplicarFiltros);
  }
  
  // Botões
  if (btnLimparFiltros) {
    btnLimparFiltros.addEventListener('click', limparFiltros);
  }
  
  if (btnNovoRegistro) {
    btnNovoRegistro.addEventListener('click', criarNovoRegistro);
  }
  
  if (btnNovoRegistroEmpty) {
    btnNovoRegistroEmpty.addEventListener('click', criarNovoRegistro);
  }
}

function configurarSelectCustomizado() {
  const customSelect = document.querySelector('.custom-select');
  const selectOptions = document.getElementById('especialidadesList');
  
  if (!customSelect || !selectOptions) return;
  
  // Toggle do select
  customSelect.addEventListener('click', (e) => {
    e.stopPropagation();
    customSelect.classList.toggle('active');
  });
  
  // Seleção de opção
  selectOptions.addEventListener('click', (e) => {
    if (e.target.classList.contains('option')) {
      const value = e.target.getAttribute('data-value');
      filterCategory.value = value;
      
      // Atualizar visual
      selectOptions.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
      e.target.classList.add('selected');
      
      customSelect.classList.remove('active');
      aplicarFiltros();
    }
  });
  
  // Fechar ao clicar fora
  document.addEventListener('click', () => {
    customSelect.classList.remove('active');
  });
}

async function carregarRegistros(cpf) {
  try {
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }
    
    
    const url = `${API_URL}/api/anotacoes/${cpf}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    
    if (!response.ok) {
      if (response.status === 404) {
        allAnotacoes = [];
        filteredAnotacoes = [];
        renderizarRegistros([]);
        mostrarAviso('Este paciente ainda não possui registros clínicos.', 'info');
        return;
      }
      
      const errorText = await response.text();
      console.error('Erro na resposta:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }
    
    const dados = await response.json();
    
    // Processar dados
    if (Array.isArray(dados)) {
      allAnotacoes = dados;
    } else if (dados && typeof dados === 'object') {
      // Se retornar um objeto com propriedade anotacoes ou registros
      if (dados.anotacoes && Array.isArray(dados.anotacoes)) {
        allAnotacoes = dados.anotacoes;
      } else if (dados.registros && Array.isArray(dados.registros)) {
        allAnotacoes = dados.registros;
      } else {
        // Se for um único registro, converter para array
        allAnotacoes = [dados];
      }
    } else {
      console.warn('⚠️ Formato de dados inesperado:', dados);
      allAnotacoes = [];
    }
    
    filteredAnotacoes = [...allAnotacoes];
    
    const dadosProcessados = {
      total: allAnotacoes.length,
      filtrados: filteredAnotacoes.length,
      primeiroRegistro: allAnotacoes[0] || 'Nenhum'
    };
    
    renderizarRegistros(filteredAnotacoes);
    
    const total = allAnotacoes.length;
    if (total > 0) {
      mostrarAviso(`${total} registro(s) clínico(s) carregado(s) com sucesso!`, 'success');
    } else {
      mostrarAviso('Nenhum registro clínico encontrado para este paciente.', 'info');
    }
    
    
  } catch (error) {
    console.error('❌ ERRO AO CARREGAR REGISTROS:', error);
    console.error('Detalhes do erro:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    mostrarErro(`Erro ao carregar registros: ${error.message}`);
    renderizarRegistros([]);
    
    // Tentar carregar dados de exemplo para debug
    if (process.env.NODE_ENV === 'development') {
      carregarDadosExemplo();
    }
  }
}

function renderizarRegistros(registros) {
  
  if (!recordsGrid || !totalRecords) {
    console.error('❌ Elementos DOM não encontrados:', { recordsGrid: !!recordsGrid, totalRecords: !!totalRecords });
    return;
  }
  
  // Atualizar contador
  totalRecords.textContent = registros.length;
  
  if (registros.length === 0) {
    recordsGrid.style.display = 'none';
    noRecords.style.display = 'flex';
    return;
  }
  
  recordsGrid.style.display = 'grid';
  noRecords.style.display = 'none';
  
  // Renderizar cards
  const cardsHTML = registros.map((anotacao, index) => {
    return criarCardRegistro(anotacao);
  }).join('');
  
  recordsGrid.innerHTML = cardsHTML;
}

function criarCardRegistro(anotacao) {
  
  const dataFormatada = formatarData(anotacao.data);
  const especialidade = anotacao.categoria || anotacao.especialidade || 'Não informado';
  const medico = formatarNomeMedico(anotacao.medico || anotacao.medicoResponsavel || 'Não informado');
  const titulo = anotacao.titulo || anotacao.tituloRegistro || 'Registro Clínico';
  
  const dadosProcessados = {
    dataFormatada,
    especialidade,
    medico,
    titulo
  };
  
  return `
    <div class="record-card" data-id="${anotacao._id || anotacao.id || ''}">
      <div class="record-header">
        <div>
          <div class="record-title">${titulo}</div>
          <div class="record-date">${dataFormatada}</div>
        </div>
        <div class="record-badge">${especialidade}</div>
      </div>
      
      <div class="record-info">
        <div class="record-info-item">
          <div class="record-info-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div class="record-info-label">Médico:</div>
          <div class="record-info-value">${medico}</div>
        </div>
        
        <div class="record-info-item">
          <div class="record-info-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div class="record-info-label">Data:</div>
          <div class="record-info-value">${dataFormatada}</div>
        </div>
        
        <div class="record-info-item">
          <div class="record-info-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 12l2 2 4-4"></path>
              <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path>
              <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path>
              <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3"></path>
              <path d="M12 21c0-1 1-3 3-3s3 2 3 3-1 3-3 3-3-2-3-3"></path>
            </svg>
          </div>
          <div class="record-info-label">Especialidade:</div>
          <div class="record-info-value">${especialidade}</div>
        </div>
      </div>
      
      <div class="record-actions">
        <a href="/client/views/vizualizarAnotacao.html?id=${anotacao._id || anotacao.id || ''}" class="btn-view">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          Visualizar Registro
        </a>
      </div>
    </div>
  `;
}

function aplicarFiltros() {
  const categoria = filterCategory?.value.toLowerCase() || '';
  const medico = filterDoctor?.value.toLowerCase() || '';
  const data = filterDate?.value || '';
  
  
  filteredAnotacoes = allAnotacoes.filter(anotacao => {
    const matchCategoria = !categoria || categoria === 'todas as especialidades' || 
      (anotacao.categoria && anotacao.categoria.toLowerCase().includes(categoria));
    
    const matchMedico = !medico || 
      (anotacao.medico && anotacao.medico.toLowerCase().includes(medico));
    
    const matchData = !data || 
      (anotacao.data && anotacao.data.startsWith(data));
    
    return matchCategoria && matchMedico && matchData;
  });
  
  renderizarRegistros(filteredAnotacoes);
}

function limparFiltros() {
  
  if (filterCategory) {
    filterCategory.value = '';
    const customSelect = document.querySelector('.custom-select');
    if (customSelect) {
      customSelect.classList.remove('active');
    }
  }
  
  if (filterDoctor) {
    filterDoctor.value = '';
  }
  
  if (filterDate) {
    filterDate.value = '';
  }
  
  filteredAnotacoes = [...allAnotacoes];
  renderizarRegistros(filteredAnotacoes);
  
  mostrarAviso('Filtros limpos', 'info');
}

function criarNovoRegistro() {
  window.location.href = '/client/views/criarAnotacao.html';
}

function formatarData(data) {
  if (!data) return 'Data não informada';
  
  try {
    const dataObj = new Date(data);
    return dataObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return 'Data inválida';
  }
}

function formatarNomeMedico(nome) {
  if (!nome) return 'Não informado';
  
  // Remover prefixos existentes
  nome = nome.replace(/^(Dra\.|Draª|Dr\.)\s*/i, '');
  
  // Adicionar prefixo padrão
  return `Draª ${nome}`;
}

function mostrarErro(mensagem) {
  const erroElement = document.getElementById('erroProntuario');
  if (erroElement) {
    erroElement.style.display = 'flex';
    document.getElementById('errorText').textContent = mensagem;
  }
  
  // Também mostrar SweetAlert
  mostrarAviso(mensagem, 'error');
}

function mostrarAviso(mensagem, tipo = 'info') {
  const cores = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };
  
  const icones = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  Swal.fire({
    title: icones[tipo],
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
}

// Função para carregar dados do médico na sidebar
async function carregarDadosMedico() {
  try {
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('⚠️ Token não encontrado para carregar dados do médico');
      return;
    }


    const url = `${API_URL}/api/usuarios/perfil`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });


    if (response.ok) {
      const medico = await response.json();
      
      // Aguardar um pouco para garantir que o sidebar foi carregado
      setTimeout(() => {
        atualizarNomeMedico(medico);
      }, 1000);
      
    } else {
      const errorText = await response.text();
      console.error('❌ Erro ao carregar dados do médico:', response.status, errorText);
      
      // Tentar endpoint alternativo
      await tentarEndpointAlternativo(token);
    }
  } catch (error) {
    console.error('❌ Erro ao carregar dados do médico:', error);
    
    // Tentar endpoint alternativo
    const token = localStorage.getItem('token');
    if (token) {
      await tentarEndpointAlternativo(token);
    }
  }
}

async function tentarEndpointAlternativo(token) {
  try {
    
    const url = `${API_URL}/api/usuarios/perfil`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const medico = await response.json();
      
      setTimeout(() => {
        atualizarNomeMedico(medico);
      }, 1000);
    } else {
      console.warn('⚠️ Endpoint alternativo também falhou:', response.status);
    }
  } catch (error) {
    console.error('❌ Erro no endpoint alternativo:', error);
  }
}

function atualizarNomeMedico(medico) {
  
  // Usar a função global do sidebar se disponível
  if (window.updateSidebarDoctorName) {
    window.updateSidebarDoctorName(medico.nome);
    return;
  }
  
  // Fallback: tentar diferentes seletores para encontrar o elemento
  const seletores = [
    '#medicoNomeSidebar',
    '#sidebar-component #medicoNomeSidebar',
    '.sidebar #medicoNomeSidebar',
    '#sidebar-component .profile-info h3',
    '.sidebar .profile-info h3'
  ];
  
  let medicoElement = null;
  
  for (const seletor of seletores) {
    medicoElement = document.querySelector(seletor);
    if (medicoElement) {
      break;
    }
  }
  
  if (medicoElement) {
    const nomeCompleto = medico.nome || medico.nomeCompleto || medico.nomeMedico || 'Dr(a). Médico';
    const prefixo = nomeCompleto.startsWith('Dr') ? '' : 'Dr(a). ';
    medicoElement.textContent = `${prefixo}${nomeCompleto}`;
    
  } else {
    console.warn('⚠️ Elemento do nome do médico não encontrado');
    
    // Tentar criar o elemento se não existir
    criarElementoMedico(medico);
  }
}

function criarElementoMedico(medico) {
  
  const sidebar = document.querySelector('#sidebar-component') || document.querySelector('.sidebar');
  if (!sidebar) {
    console.warn('⚠️ Sidebar não encontrada para criar elemento do médico');
    return;
  }
  
  const profileSection = sidebar.querySelector('.profile');
  if (!profileSection) {
    console.warn('⚠️ Seção de perfil não encontrada');
    return;
  }
  
  const nomeCompleto = medico.nome || medico.nomeCompleto || medico.nomeMedico || 'Dr(a). Médico';
  const prefixo = nomeCompleto.startsWith('Dr') ? '' : 'Dr(a). ';
  
  const medicoElement = document.createElement('h3');
  medicoElement.textContent = `${prefixo}${nomeCompleto}`;
  medicoElement.className = 'medico-nome';
  medicoElement.setAttribute('data-medico-nome', 'true');
  
  profileSection.appendChild(medicoElement);
  
}

// Funções globais para debug
window.forcarCarregamentoRegistros = async function() {
  const paciente = JSON.parse(localStorage.getItem('pacienteSelecionado'));
  if (paciente?.cpf) {
    await carregarRegistros(paciente.cpf);
  } else {
    console.error('❌ Nenhum paciente selecionado');
    mostrarErro('Nenhum paciente selecionado. Por favor, selecione um paciente primeiro.');
  }
};

window.limparTodosFiltros = function() {
  limparFiltros();
};

window.testarAPI = async function() {
  try {
    const response = await fetch(`${API_URL}/api/health`);
    if (response.ok) {
      mostrarAviso('API está funcionando corretamente!', 'success');
    } else {
      mostrarAviso(`API retornou erro: ${response.status}`, 'error');
    }
  } catch (error) {
    mostrarAviso(`Erro de conectividade: ${error.message}`, 'error');
  }
};

window.carregarDadosExemplo = function() {
  
  const dadosExemplo = [
    {
      _id: 'exemplo1',
      titulo: 'Consulta de Rotina',
      data: '2024-01-15T10:30:00Z',
      categoria: 'Clínica médica',
      medico: 'Maria Silva',
      descricao: 'Consulta de rotina para acompanhamento geral'
    },
    {
      _id: 'exemplo2',
      titulo: 'Exame Cardiológico',
      data: '2024-01-20T14:00:00Z',
      categoria: 'Cardiologia',
      medico: 'João Santos',
      descricao: 'Eletrocardiograma e ecocardiograma realizados'
    },
    {
      _id: 'exemplo3',
      titulo: 'Consulta Dermatológica',
      data: '2024-01-25T09:15:00Z',
      categoria: 'Dermatologia',
      medico: 'Ana Costa',
      descricao: 'Avaliação de lesões cutâneas'
    }
  ];
  
  
  allAnotacoes = dadosExemplo;
  filteredAnotacoes = [...allAnotacoes];
  
  renderizarRegistros(filteredAnotacoes);
  
  mostrarAviso(`${dadosExemplo.length} registros de exemplo carregados!`, 'success');
};

window.debugRegistros = function() {
  const elementosDOM = {
    recordsGrid: !!recordsGrid,
    totalRecords: !!totalRecords,
    noRecords: !!noRecords
  };
};

window.debugHeaderHistorico = function() {
  console.log('=== DEBUG HEADER HISTÓRICO ===');
  
  const headerComponent = document.getElementById('header-component');
  const mainHeader = document.querySelector('#header-component .main-header');
  const actionButtons = document.querySelectorAll('#header-component .main-header .action-btn');
  const svgIcons = document.querySelectorAll('#header-component .main-header .action-btn svg');
  
  console.log('Elementos encontrados:', {
    headerComponent: !!headerComponent,
    mainHeader: !!mainHeader,
    actionButtonsCount: actionButtons.length,
    svgIconsCount: svgIcons.length
  });
  
  if (actionButtons.length > 0) {
    console.log('Primeiro botão:', actionButtons[0]);
    console.log('Estilos do primeiro botão:', {
      display: getComputedStyle(actionButtons[0]).display,
      visibility: getComputedStyle(actionButtons[0]).visibility,
      opacity: getComputedStyle(actionButtons[0]).opacity,
      color: getComputedStyle(actionButtons[0]).color
    });
  }
  
  if (svgIcons.length > 0) {
    console.log('Primeiro SVG:', svgIcons[0]);
    console.log('Estilos do primeiro SVG:', {
      display: getComputedStyle(svgIcons[0]).display,
      visibility: getComputedStyle(svgIcons[0]).visibility,
      opacity: getComputedStyle(svgIcons[0]).opacity,
      stroke: getComputedStyle(svgIcons[0]).stroke,
      fill: getComputedStyle(svgIcons[0]).fill
    });
  }
  
  console.log('✅ Debug do header concluído');
};

window.testarRenderizacao = function() {
  if (allAnotacoes.length > 0) {
    renderizarRegistros(allAnotacoes);
  } else {
    carregarDadosExemplo();
  }
};

window.testarAutenticacao = async function() {
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ Token não encontrado');
    mostrarAviso('Token não encontrado. Faça login novamente.', 'error');
    return;
  }
  
  
  try {
    // Testar endpoint de perfil do médico
    const response = await fetch(`${API_URL}/api/usuarios/perfil`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    
    if (response.ok) {
      const medico = await response.json();
      mostrarAviso(`Médico autenticado: ${medico.nome || 'Nome não disponível'}`, 'success');
      
      // Atualizar nome na sidebar
      atualizarNomeMedico(medico);
    } else {
      const errorText = await response.text();
      console.error('❌ Erro na autenticação:', response.status, errorText);
      mostrarAviso(`Erro na autenticação: ${response.status}`, 'error');
    }
  } catch (error) {
    console.error('❌ Erro ao testar autenticação:', error);
    mostrarAviso(`Erro ao testar autenticação: ${error.message}`, 'error');
  }
};

window.forcarCarregamentoMedico = async function() {
  await carregarDadosMedico();
};

window.forcarAtualizacaoMedico = function() {
  
  // Tentar usar a função global do sidebar primeiro
  if (window.forceUpdateDoctorName) {
    window.forceUpdateDoctorName();
    return;
  }
  
  // Fallback: buscar dados e atualizar manualmente
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ Token não encontrado');
    return;
  }
  
  fetch(`${API_URL}/api/usuarios/perfil`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(medico => {
    atualizarNomeMedico(medico);
  })
  .catch(error => {
    console.error('❌ Erro ao carregar dados do médico:', error);
  });
};
                          