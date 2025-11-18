import { API_URL } from './config.js';
import { validateActivePatient, redirectToPatientSelection, handleApiError } from './utils/patientValidation.js';
import { startConnectionMonitoring, stopConnectionMonitoring } from './utils/connectionMonitor.js';

// Variáveis globais
let allAnotacoes = [];
let filteredAnotacoes = [];
let currentFilters = {
  category: '',
  doctor: '',
  date: ''
};
let registrosPaginaAtual = 1;
const REGISTROS_POR_PAGINA = 12;

// Elementos DOM
let recordsGrid, noRecords, totalRecords, filterCategory, filterDoctor, filterDate, btnLimparFiltros, btnNovoRegistro, btnNovoRegistroEmpty;
let btnAnterior, btnProximo, infoPagina, paginationControls;

document.addEventListener('DOMContentLoaded', async () => {
  
  const validation = validateActivePatient();
  if (!validation.valid) {
    redirectToPatientSelection(validation.error);
    return;
  }

  startConnectionMonitoring(5);
  
  // Aguardar carregamento dos componentes
  setTimeout(async () => {
    await carregarDadosMedico();
    await inicializarPagina();
  }, 500);
});

async function inicializarPagina() {
  try {
    // Validação já feita no DOMContentLoaded, mas garantir novamente
    const validation = validateActivePatient();
    if (!validation.valid) {
      return;
    }
    
    // Obter elementos DOM
    obterElementosDOM();
    
    // Configurar event listeners
    configurarEventListeners();
    
    // Carregar dados
    await carregarRegistros(validation.cpf);
    
    
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
  btnAnterior = document.getElementById('btnAnterior');
  btnProximo = document.getElementById('btnProximo');
  infoPagina = document.getElementById('infoPagina');
  paginationControls = document.getElementById('paginationControls');
}

function configurarEventListeners() {
  // Filtros
  if (filterCategory) {
    configurarSelectCustomizado('filterCategory', 'especialidadesList');
  }
  
  if (filterDoctor) {
    configurarSelectCustomizado('filterDoctor', 'medicosList');
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
  
  // Event listeners para paginação
  if (btnAnterior) {
    btnAnterior.addEventListener('click', () => {
      if (registrosPaginaAtual > 1) {
        registrosPaginaAtual--;
        renderizarRegistros(filteredAnotacoes);
        atualizarControlesPagina();
      }
    });
  }
  
  if (btnProximo) {
    btnProximo.addEventListener('click', () => {
      const totalPaginas = Math.ceil(filteredAnotacoes.length / REGISTROS_POR_PAGINA);
      if (registrosPaginaAtual < totalPaginas) {
        registrosPaginaAtual++;
        renderizarRegistros(filteredAnotacoes);
        atualizarControlesPagina();
      }
    });
  }
}

function configurarSelectCustomizado(inputId, optionsListId) {
  const filterInput = document.getElementById(inputId);
  if (!filterInput) return;
  
  const customSelect = filterInput.closest('.custom-select');
  const selectOptions = document.getElementById(optionsListId);
  
  if (!customSelect || !selectOptions) return;
  
  // Toggle do select ao clicar no input
  filterInput.addEventListener('focus', () => {
    customSelect.classList.add('active');
    filtrarOpcoes(inputId, optionsListId);
  });
  
  filterInput.addEventListener('click', (e) => {
    e.stopPropagation();
    customSelect.classList.add('active');
    filtrarOpcoes(inputId, optionsListId);
  });
  
  // Busca enquanto digita
  filterInput.addEventListener('input', (e) => {
    customSelect.classList.add('active');
    filtrarOpcoes(inputId, optionsListId);
    aplicarFiltros();
  });
  
  // Seleção de opção
  selectOptions.addEventListener('click', (e) => {
    if (e.target.classList.contains('option')) {
      const value = e.target.getAttribute('data-value');
      
      if (inputId === 'filterCategory') {
        filterInput.value = value === 'Todas as Especialidades' ? '' : value;
      } else if (inputId === 'filterDoctor') {
        filterInput.value = value === 'Todos os Médicos' ? '' : value;
      }
      
      // Atualizar visual
      selectOptions.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
      e.target.classList.add('selected');
      
      customSelect.classList.remove('active');
      aplicarFiltros();
    }
  });
  
  // Fechar ao clicar fora
  document.addEventListener('click', (e) => {
    if (!customSelect.contains(e.target)) {
      customSelect.classList.remove('active');
    }
  });
}

function filtrarOpcoes(inputId, optionsListId) {
  const filterInput = document.getElementById(inputId);
  const selectOptions = document.getElementById(optionsListId);
  
  if (!filterInput || !selectOptions) return;
  
  const searchTerm = filterInput.value.toLowerCase().trim();
  const allOptions = selectOptions.querySelectorAll('.option');
  
  allOptions.forEach(option => {
    const optionText = option.textContent.toLowerCase();
    const optionValue = option.getAttribute('data-value') || '';
    
    // Sempre mostrar a primeira opção (Todas as Especialidades/Todos os Médicos)
    if (optionValue === 'Todas as Especialidades' || optionValue === 'Todos os Médicos') {
      option.style.display = 'block';
      return;
    }
    
    // Filtrar outras opções baseado no texto digitado
    if (searchTerm === '' || optionText.includes(searchTerm) || optionValue.toLowerCase().includes(searchTerm)) {
      option.style.display = 'block';
    } else {
      option.style.display = 'none';
    }
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
    
    const handled = await handleApiError(response);
    if (handled) {
      return;
    }
    
    if (!response.ok) {
      if (response.status === 404) {
        allAnotacoes = [];
        filteredAnotacoes = [];
        renderizarRegistros([]);
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
    
    // Resetar paginação ao carregar registros
    registrosPaginaAtual = 1;
    
    filteredAnotacoes = [...allAnotacoes];
    
    // Atualizar opções de especialidade e médicos com base nos registros do paciente
    atualizarOpcoesEspecialidade();
    atualizarOpcoesMedicos();
    
    const dadosProcessados = {
      total: allAnotacoes.length,
      filtrados: filteredAnotacoes.length,
      primeiroRegistro: allAnotacoes[0] || 'Nenhum'
    };
    
    renderizarRegistros(filteredAnotacoes);
    
    // Removido snackbar de sucesso ao carregar registros
    // const total = allAnotacoes.length;
    // if (total > 0) {
    //   mostrarAviso(`${total} registro(s) clínico(s) carregado(s) com sucesso!`, 'success');
    // } else {
    //   mostrarAviso('Nenhum registro clínico encontrado para este paciente.', 'info');
    // }
    
    
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
    if (paginationControls) {
      paginationControls.style.display = 'none';
    }
    return;
  }
  
  recordsGrid.style.display = 'grid';
  noRecords.style.display = 'none';
  
  // Aplicar paginação
  const inicio = (registrosPaginaAtual - 1) * REGISTROS_POR_PAGINA;
  const fim = inicio + REGISTROS_POR_PAGINA;
  const registrosPagina = registros.slice(inicio, fim);
  
  // Renderizar cards
  const cardsHTML = registrosPagina.map((anotacao, index) => {
    return criarCardRegistro(anotacao);
  }).join('');
  
  recordsGrid.innerHTML = cardsHTML;
  
  // Mostrar/ocultar controles de paginação
  const totalPaginas = Math.ceil(registros.length / REGISTROS_POR_PAGINA);
  if (paginationControls) {
    if (totalPaginas > 1) {
      paginationControls.style.display = 'flex';
    } else {
      paginationControls.style.display = 'none';
    }
  }
  
  // Atualizar controles de paginação
  atualizarControlesPagina();
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
        <a href="/client/views/vizualizacaoAnotacao.html?id=${anotacao._id || anotacao.id || ''}" class="btn-view">
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
  const categoria = filterCategory?.value.toLowerCase().trim() || '';
  const medico = filterDoctor?.value.toLowerCase().trim() || '';
  const data = filterDate?.value || '';
  
  
  // Resetar paginação ao aplicar filtros
  registrosPaginaAtual = 1;
  
  filteredAnotacoes = allAnotacoes.filter(anotacao => {
    // Filtro de categoria - busca por texto digitado (permite busca parcial)
    let matchCategoria = true;
    if (categoria && categoria !== 'todas as especialidades') {
      const categoriaAnotacao = (anotacao.categoria || anotacao.especialidade || '').toLowerCase();
      // Busca parcial no nome da especialidade
      matchCategoria = categoriaAnotacao.includes(categoria);
    }
    
    // Filtro de médico - busca por texto digitado (permite busca parcial)
    let matchMedico = true;
    if (medico && medico !== 'todos os médicos') {
      const medicoAnotacao = (anotacao.medico || anotacao.medicoResponsavel || '').toLowerCase();
      const medicoNormalizado = medicoAnotacao.replace(/^(dra\.|draª|dr\.)\s*/i, '').trim();
      // Busca parcial no nome do médico
      matchMedico = medicoAnotacao.includes(medico) || medicoNormalizado.includes(medico);
    }
    
    const matchData = !data || 
      (anotacao.data && anotacao.data.startsWith(data));
    
    return matchCategoria && matchMedico && matchData;
  });
  
  renderizarRegistros(filteredAnotacoes);
}

function atualizarOpcoesEspecialidade() {
  const especialidadesList = document.getElementById('especialidadesList');
  if (!especialidadesList) return;
  
  // Extrair especialidades únicas dos registros do paciente
  const especialidadesUnicas = new Set();
  
  allAnotacoes.forEach(anotacao => {
    const especialidade = anotacao.categoria || anotacao.especialidade;
    if (especialidade && especialidade.trim() !== '') {
      especialidadesUnicas.add(especialidade.trim());
    }
  });
  
  // Ordenar especialidades alfabeticamente
  const especialidadesOrdenadas = Array.from(especialidadesUnicas).sort((a, b) => 
    a.localeCompare(b, 'pt-BR')
  );
  
  // Limpar lista atual (mantendo apenas a primeira opção "Todas as Especialidades")
  especialidadesList.innerHTML = '<div class="option" data-value="Todas as Especialidades">Todas as Especialidades</div>';
  
  // Adicionar especialidades do paciente
  especialidadesOrdenadas.forEach(especialidade => {
    const option = document.createElement('div');
    option.className = 'option';
    option.setAttribute('data-value', especialidade);
    option.textContent = especialidade;
    especialidadesList.appendChild(option);
  });
  
  // Se não houver especialidades, mostrar mensagem
  if (especialidadesOrdenadas.length === 0) {
    const option = document.createElement('div');
    option.className = 'option';
    option.setAttribute('data-value', '');
    option.textContent = 'Nenhuma especialidade encontrada';
    option.style.color = '#94a3b8';
    option.style.fontStyle = 'italic';
    especialidadesList.appendChild(option);
  }
}

function atualizarOpcoesMedicos() {
  const medicosList = document.getElementById('medicosList');
  if (!medicosList) return;
  
  // Extrair médicos únicos dos registros do paciente
  const medicosUnicos = new Set();
  
  allAnotacoes.forEach(anotacao => {
    const medico = anotacao.medico || anotacao.medicoResponsavel;
    if (medico && medico.trim() !== '') {
      // Remover prefixos como "Dr.", "Dra.", "Draª" para normalizar
      const medicoNormalizado = medico.trim().replace(/^(Dra\.|Draª|Dr\.)\s*/i, '').trim();
      if (medicoNormalizado) {
        medicosUnicos.add(medicoNormalizado);
      }
    }
  });
  
  // Ordenar médicos alfabeticamente
  const medicosOrdenados = Array.from(medicosUnicos).sort((a, b) => 
    a.localeCompare(b, 'pt-BR')
  );
  
  // Limpar lista atual (mantendo apenas a primeira opção "Todos os Médicos")
  medicosList.innerHTML = '<div class="option" data-value="Todos os Médicos">Todos os Médicos</div>';
  
  // Adicionar médicos do paciente
  medicosOrdenados.forEach(medico => {
    const option = document.createElement('div');
    option.className = 'option';
    option.setAttribute('data-value', medico);
    option.textContent = medico;
    medicosList.appendChild(option);
  });
  
  // Se não houver médicos, mostrar mensagem
  if (medicosOrdenados.length === 0) {
    const option = document.createElement('div');
    option.className = 'option';
    option.setAttribute('data-value', '');
    option.textContent = 'Nenhum médico encontrado';
    option.style.color = '#94a3b8';
    option.style.fontStyle = 'italic';
    medicosList.appendChild(option);
  }
}

function limparFiltros() {
  
  if (filterCategory) {
    filterCategory.value = '';
    const customSelectCategory = filterCategory.closest('.custom-select');
    if (customSelectCategory) {
      customSelectCategory.classList.remove('active');
    }
    // Remover seleção visual das opções de especialidade
    const especialidadesList = document.getElementById('especialidadesList');
    if (especialidadesList) {
      especialidadesList.querySelectorAll('.option').forEach(opt => {
        opt.classList.remove('selected');
        opt.style.display = 'block'; // Mostrar todas as opções novamente
      });
      // Marcar "Todas as Especialidades" como selecionada
      const primeiraOpcao = especialidadesList.querySelector('.option[data-value="Todas as Especialidades"]');
      if (primeiraOpcao) {
        primeiraOpcao.classList.add('selected');
      }
    }
    // Atualizar placeholder
    if (filterCategory) {
      filterCategory.placeholder = 'Selecione uma especialidade';
    }
  }
  
  if (filterDoctor) {
    filterDoctor.value = '';
    const customSelectDoctor = filterDoctor.closest('.custom-select');
    if (customSelectDoctor) {
      customSelectDoctor.classList.remove('active');
    }
    // Remover seleção visual das opções de médicos
    const medicosList = document.getElementById('medicosList');
    if (medicosList) {
      medicosList.querySelectorAll('.option').forEach(opt => {
        opt.classList.remove('selected');
        opt.style.display = 'block'; // Mostrar todas as opções novamente
      });
      // Marcar "Todos os Médicos" como selecionado
      const primeiraOpcao = medicosList.querySelector('.option[data-value="Todos os Médicos"]');
      if (primeiraOpcao) {
        primeiraOpcao.classList.add('selected');
      }
    }
    // Atualizar placeholder
    if (filterDoctor) {
      filterDoctor.placeholder = 'Selecione um médico';
    }
  }
  
  if (filterDate) {
    filterDate.value = '';
  }
  
  // Resetar paginação ao limpar filtros
  registrosPaginaAtual = 1;
  
  filteredAnotacoes = [...allAnotacoes];
  renderizarRegistros(filteredAnotacoes);
  
  // Removido snackbar ao limpar filtros
  // mostrarAviso('Filtros limpos', 'info');
}

// Função para atualizar controles de paginação
function atualizarControlesPagina() {
  const totalPaginas = Math.ceil(filteredAnotacoes.length / REGISTROS_POR_PAGINA);
  
  if (btnAnterior) {
    btnAnterior.disabled = registrosPaginaAtual === 1;
    btnAnterior.style.opacity = registrosPaginaAtual === 1 ? '0.5' : '1';
  }
  
  if (btnProximo) {
    btnProximo.disabled = registrosPaginaAtual === totalPaginas;
    btnProximo.style.opacity = registrosPaginaAtual === totalPaginas ? '0.5' : '1';
  }
  
  if (infoPagina) {
    const inicio = (registrosPaginaAtual - 1) * REGISTROS_POR_PAGINA + 1;
    const fim = Math.min(registrosPaginaAtual * REGISTROS_POR_PAGINA, filteredAnotacoes.length);
    infoPagina.textContent = `Mostrando ${inicio}-${fim} de ${filteredAnotacoes.length} registros`;
  }
}

function criarNovoRegistro() {
  window.location.href = '/client/views/criarAnotações.html';
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
  
  
  // Resetar paginação ao carregar dados de exemplo
  registrosPaginaAtual = 1;
  
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
                          
window.addEventListener('beforeunload', () => {
  stopConnectionMonitoring();
});
