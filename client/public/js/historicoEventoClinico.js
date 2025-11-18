import { validateActivePatient, redirectToPatientSelection, handleApiError } from './utils/patientValidation.js';

const API_URL = window.API_URL || 'http://localhost:65432';

document.addEventListener('DOMContentLoaded', async () => {
  const validation = validateActivePatient();
  if (!validation.valid) {
    redirectToPatientSelection(validation.error);
    return;
  }
  
  await carregarDadosMedico();
  inicializarComponentes();
  await carregarEventosClinicos();
});

let allEventos = [];
let eventosFiltrados = [];
let eventosPaginaAtual = 1;
const EVENTOS_POR_PAGINA = 12;
let ordenacaoAtual = 'dataDesc'; // dataDesc, dataAsc, titulo, especialidade
let medicoLogadoNome = null; // Nome do médico logado para usar nos cards

// Função para mostrar mensagem de aviso melhorada
function mostrarAviso(mensagem, tipo = 'info') {
  // Remover avisos existentes
  const avisosExistentes = document.querySelectorAll('.aviso-notificacao');
  avisosExistentes.forEach(aviso => {
    if (document.body.contains(aviso)) {
      document.body.removeChild(aviso);
    }
  });

  const aviso = document.createElement('div');
  aviso.className = 'aviso-notificacao';
  
  const cores = {
    error: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', icon: '#dc2626' },
    success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#059669', icon: '#059669' },
    info: { bg: '#eff6ff', border: '#bfdbfe', text: '#2563eb', icon: '#2563eb' },
    warning: { bg: '#fffbeb', border: '#fed7aa', text: '#d97706', icon: '#d97706' }
  };
  
  const cor = cores[tipo] || cores.info;
  
  aviso.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: ${cor.bg};
    color: ${cor.text};
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    z-index: 1000;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 500;
    border: 2px solid ${cor.border}; 
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 300px;
    max-width: 450px;
    animation: slideInNotification 0.3s ease-out;
    backdrop-filter: blur(10px);
  `;

  const icon = document.createElement('div');
  const icones = {
    error: `<svg width="24" height="24" stroke="currentColor" fill="none">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>`,
    success: `<svg width="24" height="24" stroke="currentColor" fill="none">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>`,
    info: `<svg width="24" height="24" stroke="currentColor" fill="none">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>`,
    warning: `<svg width="24" height="24" stroke="currentColor" fill="none">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>`
  };
  
  icon.innerHTML = icones[tipo] || icones.info;
  icon.style.color = cor.icon;

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
    color: ${cor.text};
    opacity: 0.7;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    border-radius: 4px;
  `;
  closeButton.innerHTML = `
    <svg width="20" height="20" stroke="currentColor" fill="none">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  `;
  closeButton.onclick = () => {
    aviso.style.animation = 'slideOutNotification 0.3s ease-out';
    setTimeout(() => {
      if (document.body.contains(aviso)) {
        document.body.removeChild(aviso);
      }
    }, 300);
  };

  closeButton.addEventListener('mouseenter', () => {
    closeButton.style.opacity = '1';
    closeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
  });

  closeButton.addEventListener('mouseleave', () => {
    closeButton.style.opacity = '0.7';
    closeButton.style.backgroundColor = 'transparent';
  });

  aviso.appendChild(icon);
  aviso.appendChild(textContainer);
  aviso.appendChild(closeButton);
  document.body.appendChild(aviso);

  // Adiciona estilo para as animações
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInNotification {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutNotification {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  // Auto-remover após 6 segundos
  setTimeout(() => {
    if (document.body.contains(aviso)) {
      aviso.style.animation = 'slideOutNotification 0.3s ease-out';
      setTimeout(() => {
        if (document.body.contains(aviso)) {
          document.body.removeChild(aviso);
        }
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      }, 300);
    }
  }, 6000);
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
    const prefixo = medico.genero?.toLowerCase() === 'feminino' ? 'Dra.' : 'Dr.';
    const nomeFormatado = `${prefixo} ${medico.nome}`;
    
    // Armazenar nome do médico para usar nos cards
    medicoLogadoNome = nomeFormatado;
    
    const tituloSidebar = document.querySelector('.sidebar .profile h3');
    if (tituloSidebar) {
      tituloSidebar.textContent = nomeFormatado;
    }

    return true;
  } catch (error) {
    console.error("Erro ao carregar dados do médico:", error);
    const fallback = document.querySelector('.sidebar .profile h3');
    if (fallback) fallback.textContent = 'Dr(a). Nome não encontrado';
    mostrarAviso("Erro ao carregar dados do médico. Por favor, faça login novamente.", 'error');
    return false;
  }
}

// Função para inicializar componentes
function inicializarComponentes() {
  // Configurar selects customizados - buscar pelo input e encontrar o parent .custom-select
  setupCustomSelectByIds('filterType', 'tiposList');
  setupCustomSelectByIds('filterIntensity', 'intensidadesList');
  
  // Inicializar valores padrão dos filtros
  const filterType = document.getElementById('filterType');
  const filterIntensity = document.getElementById('filterIntensity');
  if (filterType) {
    filterType.dataset.value = 'Todos os Tipos';
  }
  if (filterIntensity) {
    filterIntensity.dataset.value = 'Todas as Intensidades';
  }
  
  // Event listeners para filtros
  const btnLimparFiltros = document.getElementById('btnLimparFiltros');
  if (btnLimparFiltros) {
    btnLimparFiltros.addEventListener('click', limparFiltros);
  }
  
  // Event listener para busca textual
  const buscaInput = document.getElementById('buscaEventos');
  if (buscaInput) {
    let timeoutId;
    buscaInput.addEventListener('input', (e) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        aplicarFiltros();
      }, 300);
    });
  }
  
  // Event listener para ordenação
  const ordenacaoSelect = document.getElementById('ordenacaoSelect');
  if (ordenacaoSelect) {
    ordenacaoSelect.addEventListener('change', (e) => {
      ordenacaoAtual = e.target.value;
      aplicarFiltros();
    });
  }
  
  // Event listeners para paginação
  const btnAnterior = document.getElementById('btnAnterior');
  const btnProximo = document.getElementById('btnProximo');
  
  if (btnAnterior) {
    btnAnterior.addEventListener('click', () => {
      if (eventosPaginaAtual > 1) {
        eventosPaginaAtual--;
        renderizarEventos(eventosFiltrados);
        atualizarControlesPagina();
      }
    });
  }

  if (btnProximo) {
    btnProximo.addEventListener('click', () => {
      const totalPaginas = Math.ceil(eventosFiltrados.length / EVENTOS_POR_PAGINA);
      if (eventosPaginaAtual < totalPaginas) {
        eventosPaginaAtual++;
        renderizarEventos(eventosFiltrados);
        atualizarControlesPagina();
      }
    });
  }
}

// Função para configurar select customizado
function setupCustomSelectByIds(inputId, optionsId) {
  const input = document.getElementById(inputId);
  const options = document.getElementById(optionsId);
  
  if (!input || !options) return;
  
  // Encontrar o parent .custom-select
  const customSelect = input.closest('.custom-select');
  if (!customSelect) return;

  // Toggle do dropdown ao clicar no input
  input.addEventListener('focus', () => {
    customSelect.classList.add('active');
    filtrarOpcoesSelect(inputId, optionsId);
  });

  input.addEventListener('click', (e) => {
    e.stopPropagation();
    customSelect.classList.add('active');
    filtrarOpcoesSelect(inputId, optionsId);
    // Fechar outros dropdowns
    document.querySelectorAll('.custom-select').forEach(select => {
      if (select !== customSelect) {
        select.classList.remove('active');
      }
    });
  });

  // Busca enquanto digita
  input.addEventListener('input', (e) => {
    customSelect.classList.add('active');
    filtrarOpcoesSelect(inputId, optionsId);
    
    // Se o input foi limpo manualmente, resetar o dataset.value para a opção padrão
    if (!input.value || input.value.trim() === '') {
      if (inputId === 'filterType') {
        input.dataset.value = 'Todos os Tipos';
      } else if (inputId === 'filterIntensity') {
        input.dataset.value = 'Todas as Intensidades';
      }
    } else {
      // Se está digitando, limpar o dataset.value para permitir busca livre
      input.dataset.value = '';
    }
    
    aplicarFiltros();
  });

  // Seleção de opção
  options.addEventListener('click', (e) => {
    if (e.target.classList.contains('option')) {
      const value = e.target.dataset.value;
      const text = e.target.textContent;
      
      if (inputId === 'filterType') {
        input.value = value === 'Todos os Tipos' ? '' : value;
        input.dataset.value = value;
      } else if (inputId === 'filterIntensity') {
        input.value = value === 'Todas as Intensidades' ? '' : value;
      } else {
        input.value = text;
      }
      input.dataset.value = value;
      
      // Remover seleção anterior
      options.querySelectorAll('.option').forEach(option => {
        option.classList.remove('selected');
      });
      
      // Adicionar seleção atual
      e.target.classList.add('selected');
      
      // Fechar dropdown
      customSelect.classList.remove('active');
      
      // Aplicar filtros
      aplicarFiltros();
    }
  });

  // Fechar dropdown ao clicar fora
  document.addEventListener('click', (e) => {
    if (!customSelect.contains(e.target)) {
      customSelect.classList.remove('active');
    }
  });
}

// Função para filtrar opções do select baseado no texto digitado
function filtrarOpcoesSelect(inputId, optionsId) {
  const input = document.getElementById(inputId);
  const options = document.getElementById(optionsId);
  
  if (!input || !options) return;
  
  const searchTerm = input.value.toLowerCase().trim();
  const allOptions = options.querySelectorAll('.option');
  
  allOptions.forEach(option => {
    const optionText = option.textContent.toLowerCase();
    const optionValue = option.getAttribute('data-value') || '';
    
    // Sempre mostrar a primeira opção (Todos os Tipos/Todas as Intensidades) e "Outros"
    if (optionValue === 'Todos os Tipos' || optionValue === 'Todas as Intensidades' || optionValue === 'Outros') {
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

// Função para aplicar filtros
function aplicarFiltros() {
  const tipoInput = document.getElementById('filterType');
  const tipoValue = tipoInput?.value || '';
  const tipoDataset = tipoInput?.dataset.value || '';
  const tipo = tipoValue.toLowerCase().trim() || tipoDataset.toLowerCase();
  
  const intensidadeInput = document.getElementById('filterIntensity');
  const intensidadeValue = intensidadeInput?.value || '';
  const intensidadeDataset = intensidadeInput?.dataset.value || '';
  const intensidade = intensidadeValue.toLowerCase().trim() || intensidadeDataset.toLowerCase();
  
  const buscaTexto = document.getElementById('buscaEventos')?.value.toLowerCase() || '';

  eventosFiltrados = allEventos.filter(evento => {
    // Filtro de tipo - busca por texto digitado (permite busca parcial)
    let matchTipo = true;
    
    // Verificar se "Todos os Tipos" está selecionado
    // Pode estar no dataset.value ou no value (quando selecionado da lista)
    const isTodosTipos = 
      tipoDataset === 'Todos os Tipos' || 
      tipoValue === 'Todos os Tipos' ||
      (!tipoValue && tipoDataset === 'Todos os Tipos') ||
      (tipoValue === '' && tipoDataset === 'Todos os Tipos') ||
      (!tipoValue && !tipoDataset);
    
    if (!isTodosTipos) {
      const tipoLower = tipo.toLowerCase();
      if (tipoLower === 'outros' || tipoDataset === 'Outros') {
        // Se selecionou "Outros", buscar eventos que não correspondem aos tipos padrão
        const tiposPadrao = [
          'crise / emergência',
          'acompanhamento de condição crônica',
          'episódio psicológico ou emocional',
          'evento relacionado à medicação'
        ];
        const tipoEvento = (evento.tipoEvento || '').toLowerCase();
        matchTipo = !tiposPadrao.includes(tipoEvento);
      } else {
        const tipoEvento = (evento.tipoEvento || '').toLowerCase();
        matchTipo = tipoEvento.includes(tipoLower) || tipoEvento === tipoLower;
      }
    }
    
    // Filtro de intensidade - verificar se corresponde à faixa ou busca por texto
    let matchIntensidade = true;
    
    // Verificar se "Todas as Intensidades" está selecionado
    const isTodasIntensidades = !intensidade || intensidade === '' || intensidadeDataset === 'Todas as Intensidades' || intensidadeValue === 'Todas as Intensidades';
    
    if (!isTodasIntensidades) {
      // Se for um valor numérico ou faixa (0, 1-3, 4-6, etc), usar verificação de faixa
      if (intensidade.match(/^\d+$|^\d+-\d+$/)) {
        matchIntensidade = verificarIntensidade(evento.intensidadeDor, intensidade);
      } else {
        // Busca parcial por texto (ex: "leve", "moderada")
        const intensidadeTexto = getIntensityText(evento.intensidadeDor).toLowerCase();
        matchIntensidade = intensidadeTexto.includes(intensidade);
      }
    }
    
    const matchBusca = !buscaTexto || 
      (evento.titulo && evento.titulo.toLowerCase().includes(buscaTexto)) ||
      (evento.descricao && evento.descricao.toLowerCase().includes(buscaTexto)) ||
      (evento.especialidade && evento.especialidade.toLowerCase().includes(buscaTexto)) ||
      (evento.tipoEvento && evento.tipoEvento.toLowerCase().includes(buscaTexto));
    
    return matchTipo && matchIntensidade && matchBusca;
  });

  // Aplicar ordenação
  eventosFiltrados = ordenarEventos(eventosFiltrados, ordenacaoAtual);
  
  // Resetar página para 1
  eventosPaginaAtual = 1;
  
  renderizarEventos(eventosFiltrados);
  atualizarControlesPagina();
}

// Função para ordenar eventos
function ordenarEventos(eventos, ordenacao) {
  return [...eventos].sort((a, b) => {
    switch (ordenacao) {
      case 'dataDesc':
        return new Date(b.dataHora) - new Date(a.dataHora);
      case 'dataAsc':
        return new Date(a.dataHora) - new Date(b.dataHora);
      case 'titulo':
        return a.titulo.localeCompare(b.titulo, 'pt-BR');
      case 'especialidade':
        return a.especialidade.localeCompare(b.especialidade, 'pt-BR');
      default:
        return 0;
    }
  });
}

// Função para atualizar controles de paginação
function atualizarControlesPagina() {
  const totalPaginas = Math.ceil(eventosFiltrados.length / EVENTOS_POR_PAGINA);
  const btnAnterior = document.getElementById('btnAnterior');
  const btnProximo = document.getElementById('btnProximo');
  const infoPagina = document.getElementById('infoPagina');
  
  if (btnAnterior) {
    btnAnterior.disabled = eventosPaginaAtual === 1;
    btnAnterior.style.opacity = eventosPaginaAtual === 1 ? '0.5' : '1';
  }
  
  if (btnProximo) {
    btnProximo.disabled = eventosPaginaAtual === totalPaginas;
    btnProximo.style.opacity = eventosPaginaAtual === totalPaginas ? '0.5' : '1';
  }
  
  if (infoPagina) {
    const inicio = (eventosPaginaAtual - 1) * EVENTOS_POR_PAGINA + 1;
    const fim = Math.min(eventosPaginaAtual * EVENTOS_POR_PAGINA, eventosFiltrados.length);
    infoPagina.textContent = `Mostrando ${inicio}-${fim} de ${eventosFiltrados.length} eventos`;
  }
}

// Função para verificar intensidade da dor
function verificarIntensidade(intensidadeEvento, filtroIntensidade) {
  if (!intensidadeEvento) return false;
  
  const intensidade = parseInt(intensidadeEvento);
  
  switch (filtroIntensidade) {
    case '0':
      return intensidade === 0;
    case '1-3':
      return intensidade >= 1 && intensidade <= 3;
    case '4-6':
      return intensidade >= 4 && intensidade <= 6;
    case '7-9':
      return intensidade >= 7 && intensidade <= 9;
    case '10':
      return intensidade === 10;
    default:
      return true;
  }
}

// Função para atualizar opções de tipos de evento
function atualizarOpcoesTiposEvento() {
  const tiposList = document.getElementById('tiposList');
  if (!tiposList) return;
  
  // Extrair tipos únicos dos eventos do paciente
  const tiposUnicos = new Set();
  
  allEventos.forEach(evento => {
    const tipo = evento.tipoEvento;
    if (tipo && tipo.trim() !== '') {
      tiposUnicos.add(tipo.trim());
    }
  });
  
  // Ordenar tipos alfabeticamente
  const tiposOrdenados = Array.from(tiposUnicos).sort((a, b) => 
    a.localeCompare(b, 'pt-BR')
  );
  
  // Limpar lista atual (mantendo apenas a primeira opção "Todos os Tipos")
  tiposList.innerHTML = '<div class="option" data-value="Todos os Tipos">Todos os Tipos</div>';
  
  // Adicionar tipos do paciente
  tiposOrdenados.forEach(tipo => {
    const option = document.createElement('div');
    option.className = 'option';
    option.setAttribute('data-value', tipo);
    option.textContent = tipo;
    tiposList.appendChild(option);
  });
  
  // Sempre adicionar a opção "Outros" no final
  const optionOutros = document.createElement('div');
  optionOutros.className = 'option';
  optionOutros.setAttribute('data-value', 'Outros');
  optionOutros.textContent = 'Outros';
  tiposList.appendChild(optionOutros);
  
  // Se não houver tipos além de "Outros", não mostrar mensagem
}

// Função para atualizar opções de intensidade
function atualizarOpcoesIntensidade() {
  const intensidadesList = document.getElementById('intensidadesList');
  if (!intensidadesList) return;
  
  // Extrair intensidades únicas dos eventos do paciente
  const intensidadesUnicas = new Set();
  
  allEventos.forEach(evento => {
    const intensidade = evento.intensidadeDor;
    if (intensidade !== undefined && intensidade !== null && intensidade !== '') {
      const intensidadeNum = parseInt(intensidade);
      if (!isNaN(intensidadeNum)) {
        // Agrupar por faixas
        if (intensidadeNum === 0) {
          intensidadesUnicas.add('0');
        } else if (intensidadeNum >= 1 && intensidadeNum <= 3) {
          intensidadesUnicas.add('1-3');
        } else if (intensidadeNum >= 4 && intensidadeNum <= 6) {
          intensidadesUnicas.add('4-6');
        } else if (intensidadeNum >= 7 && intensidadeNum <= 9) {
          intensidadesUnicas.add('7-9');
        } else if (intensidadeNum === 10) {
          intensidadesUnicas.add('10');
        }
      }
    }
  });
  
  // Ordenar intensidades (0, 1-3, 4-6, 7-9, 10)
  const ordemIntensidade = ['0', '1-3', '4-6', '7-9', '10'];
  const intensidadesOrdenadas = Array.from(intensidadesUnicas).sort((a, b) => {
    const indexA = ordemIntensidade.indexOf(a);
    const indexB = ordemIntensidade.indexOf(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
  
  // Limpar lista atual (mantendo apenas a primeira opção "Todas as Intensidades")
  intensidadesList.innerHTML = '<div class="option" data-value="Todas as Intensidades">Todas as Intensidades</div>';
  
  // Mapear valores para textos
  const textosIntensidade = {
    '0': 'Sem dor (0)',
    '1-3': 'Leve (1-3)',
    '4-6': 'Moderada (4-6)',
    '7-9': 'Intensa (7-9)',
    '10': 'Dor insuportável (10)'
  };
  
  // Adicionar intensidades do paciente
  intensidadesOrdenadas.forEach(intensidade => {
    const option = document.createElement('div');
    option.className = 'option';
    option.setAttribute('data-value', intensidade);
    option.textContent = textosIntensidade[intensidade] || intensidade;
    intensidadesList.appendChild(option);
  });
  
  // Se não houver intensidades, mostrar mensagem
  if (intensidadesOrdenadas.length === 0) {
    const option = document.createElement('div');
    option.className = 'option';
    option.setAttribute('data-value', '');
    option.textContent = 'Nenhuma intensidade encontrada';
    option.style.color = '#94a3b8';
    option.style.fontStyle = 'italic';
    intensidadesList.appendChild(option);
  }
}

// Função para limpar filtros
function limparFiltros() {
  const filterType = document.getElementById('filterType');
  const filterIntensity = document.getElementById('filterIntensity');
  const buscaInput = document.getElementById('buscaEventos');
  const ordenacaoSelect = document.getElementById('ordenacaoSelect');
  
  if (filterType) {
    filterType.value = '';
    filterType.dataset.value = 'Todos os Tipos';
    filterType.placeholder = 'Selecione um tipo';
    const customSelectType = filterType.closest('.custom-select');
    if (customSelectType) {
      customSelectType.classList.remove('active');
    }
    const tiposList = document.getElementById('tiposList');
    if (tiposList) {
      tiposList.querySelectorAll('.option').forEach(opt => {
        opt.classList.remove('selected');
        opt.style.display = 'block';
      });
      const primeiraOpcao = tiposList.querySelector('.option[data-value="Todos os Tipos"]');
      if (primeiraOpcao) {
        primeiraOpcao.classList.add('selected');
      }
    }
  }
  
  if (filterIntensity) {
    filterIntensity.value = '';
    filterIntensity.dataset.value = 'Todas as Intensidades';
    filterIntensity.placeholder = 'Selecione uma intensidade';
    const customSelectIntensity = filterIntensity.closest('.custom-select');
    if (customSelectIntensity) {
      customSelectIntensity.classList.remove('active');
    }
    const intensidadesList = document.getElementById('intensidadesList');
    if (intensidadesList) {
      intensidadesList.querySelectorAll('.option').forEach(opt => {
        opt.classList.remove('selected');
        opt.style.display = 'block';
      });
      const primeiraOpcao = intensidadesList.querySelector('.option[data-value="Todas as Intensidades"]');
      if (primeiraOpcao) {
        primeiraOpcao.classList.add('selected');
      }
    }
  }
  
  if (buscaInput) {
    buscaInput.value = '';
  }
  
  if (ordenacaoSelect) {
    ordenacaoSelect.value = 'dataDesc';
    ordenacaoAtual = 'dataDesc';
  }
  
  // Fechar dropdowns
  document.querySelectorAll('.custom-select').forEach(select => {
    select.classList.remove('active');
  });
  
  // Resetar paginação
  eventosPaginaAtual = 1;
  
  eventosFiltrados = [...allEventos];
  renderizarEventos(eventosFiltrados);
  atualizarControlesPagina();
}

// Função para carregar eventos clínicos
async function carregarEventosClinicos() {
  try {
    const paciente = JSON.parse(localStorage.getItem('pacienteSelecionado'));
    const cpf = paciente?.cpf;

    if (!cpf) {
      mostrarAviso('Paciente não selecionado.', 'error');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      mostrarAviso('Token não encontrado. Faça login novamente.', 'error');
      return;
    }

    const response = await fetch(`${API_URL}/api/eventos-clinicos/medico?cpf=${cpf}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const handled = await handleApiError(response);
    if (handled) {
      return;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erro ao buscar eventos clínicos');
    }

    allEventos = await response.json();
    eventosFiltrados = [...allEventos];
    eventosPaginaAtual = 1;
    
    // Atualizar opções de filtros com base nos eventos do paciente
    atualizarOpcoesTiposEvento();
    atualizarOpcoesIntensidade();
    
    renderizarEventos(eventosFiltrados);
    atualizarEstatisticas(allEventos);
    atualizarControlesPagina();

    // Removido snackbar de sucesso/info ao carregar eventos
    // if (allEventos.length === 0) {
    //   mostrarAviso('Nenhum evento clínico encontrado para este paciente.', 'info');
    // } else {
    //   mostrarAviso(`${allEventos.length} evento${allEventos.length !== 1 ? 's' : ''} clínico${allEventos.length !== 1 ? 's' : ''} carregado${allEventos.length !== 1 ? 's' : ''} com sucesso.`, 'success');
    // }

  } catch (error) {
    console.error('Erro ao carregar eventos clínicos:', error);
    mostrarAviso(`Erro ao carregar eventos clínicos: ${error.message}`, 'error');
  }
}

// Função para atualizar estatísticas
function atualizarEstatisticas(eventos) {
  const totalEventos = eventos.length;
  const totalEventosEl = document.getElementById('totalEventos');
  if (totalEventosEl) {
    totalEventosEl.textContent = totalEventos;
  }
}

// Função para renderizar eventos
function renderizarEventos(eventos) {
  const eventGrid = document.getElementById('eventGrid');
  const noRecords = document.getElementById('noRecords');
  const totalEventosEl = document.getElementById('totalEventos');
  const paginationControls = document.getElementById('paginationControls');

  if (!eventGrid || !noRecords) return;

  eventGrid.innerHTML = '';

  // Atualizar contador
  if (totalEventosEl) {
    totalEventosEl.textContent = eventos.length;
  }

  if (eventos.length === 0) {
    noRecords.style.display = 'flex';
    eventGrid.style.display = 'none';
    if (paginationControls) {
      paginationControls.style.display = 'none';
    }
    return;
  }

  noRecords.style.display = 'none';
  eventGrid.style.display = 'grid';

  // Aplicar paginação
  const inicio = (eventosPaginaAtual - 1) * EVENTOS_POR_PAGINA;
  const fim = inicio + EVENTOS_POR_PAGINA;
  const eventosPagina = eventos.slice(inicio, fim);

  eventosPagina.forEach(evento => {
    const card = criarCardEvento(evento);
    eventGrid.appendChild(card);
  });

  // Mostrar/ocultar controles de paginação
  const totalPaginas = Math.ceil(eventos.length / EVENTOS_POR_PAGINA);
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

// Função para obter nome do médico do evento
function obterNomeMedico(evento) {
  let medicoNome = 'Não informado';
  
  if (evento.medico) {
    medicoNome = evento.medico;
  } else if (evento.medicoNome) {
    medicoNome = evento.medicoNome;
  } else if (evento.medicoResponsavel) {
    medicoNome = evento.medicoResponsavel;
  } else if (evento.createdBy) {
    medicoNome = evento.createdBy;
  } else if (evento.paciente && evento.paciente.medico) {
    medicoNome = evento.paciente.medico;
  } else if (evento.paciente && evento.paciente.medicoNome) {
    medicoNome = evento.paciente.medicoNome;
  } else if (evento.paciente && evento.paciente.medicoResponsavel) {
    medicoNome = evento.paciente.medicoResponsavel;
  } else {
    // Tentar obter do médico logado (armazenado na variável global)
    if (medicoLogadoNome) {
      medicoNome = medicoLogadoNome;
    } else {
      medicoNome = 'Não informado';
    }
  }
  
  return medicoNome;
}

// Função para criar card do evento no estilo record-card
function criarCardEvento(evento) {
  const card = document.createElement('div');
  card.className = 'record-card';
  card.setAttribute('data-id', evento._id || '');

  const dataEvento = new Date(evento.dataHora);
  const dataFormatada = dataEvento.toLocaleDateString('pt-BR');
  const medico = obterNomeMedico(evento);
  const titulo = evento.titulo || 'Evento Clínico';
  const tipoEvento = evento.tipoEvento || '';

  card.innerHTML = `
    <div class="record-header">
      <div>
        <div class="record-title">${titulo}</div>
      </div>
    </div>
    
    <div class="record-info">
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
            <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.5 0 2.9.37 4.13 1.02"></path>
            <path d="M16 2l4 4-4 4"></path>
          </svg>
        </div>
        <div class="record-info-label">Tipo de Evento:</div>
        <div class="record-info-value">${tipoEvento || 'Não informado'}</div>
      </div>
      
      <div class="record-info-item">
        <div class="record-info-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
          </svg>
        </div>
        <div class="record-info-label">Intensidade:</div>
        <div class="record-info-value">${getIntensityText(evento.intensidadeDor)}</div>
      </div>
    </div>
    
    <div class="record-actions">
      <a href="/client/views/vizualizacaoEventoClinico.html?id=${evento._id || ''}" class="btn-view" onclick="event.stopPropagation();">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
        Visualizar Registro
      </a>
    </div>
  `;

  return card;
}

// Helper para texto de intensidade (exibe faixa + valor)
function getIntensityText(valor) {
  if (valor === undefined || valor === null || valor === '') return 'Não informado';
  const n = parseInt(valor, 10);
  if (isNaN(n)) return String(valor);
  if (n === 0) return 'Sem dor (0/10)';
  if (n <= 3) return `Leve (${n}/10)`;
  if (n <= 6) return `Moderada (${n}/10)`;
  if (n <= 9) return `Intensa (${n}/10)`;
  if (n === 10) return 'Insuportável (10/10)';
  return `${n}/10`;
}

// Função auxiliar para truncar texto
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Função para obter prioridade do evento
function getPrioridadeEvento(evento, diferencaDias) {
  if (evento.tipoEvento === 'Crise / Emergência') {
    return { text: 'URGENTE', class: 'urgent' };
  }
  if (diferencaDias <= 1) {
    return { text: 'ALTA', class: 'high' };
  }
  if (diferencaDias <= 7) {
    return { text: 'MÉDIA', class: 'medium' };
  }
  return { text: 'BAIXA', class: 'low' };
}

// Função para obter status do evento
function getStatusEvento(diferencaDias) {
  if (diferencaDias === 0) {
    return { text: 'HOJE', class: 'today' };
  }
  if (diferencaDias === 1) {
    return { text: 'ONTEM', class: 'yesterday' };
  }
  if (diferencaDias <= 7) {
    return { text: 'ESTA SEMANA', class: 'this-week' };
  }
  return { text: 'ANTIGO', class: 'old' };
}

// Função para gerar escala visual de dor
function generatePainScale(intensidade) {
  const escala = [];
  for (let i = 1; i <= 10; i++) {
    const classe = i <= intensidade ? 'active' : '';
    escala.push(`<span class="pain-dot ${classe}"></span>`);
  }
  return escala.join('');
}

// Função para copiar evento
function copiarEvento(idEvento) {
  const evento = allEventos.find(e => e._id === idEvento);
  if (!evento) return;
  
  const textoPartes = [
    `Evento Clínico: ${evento.titulo}`,
    `Data: ${new Date(evento.dataHora).toLocaleDateString('pt-BR')} às ${new Date(evento.dataHora).toLocaleTimeString('pt-BR')}`,
    evento.tipoEvento ? `Tipo: ${evento.tipoEvento}` : '',
    evento.intensidadeDor ? `Intensidade da Dor: ${evento.intensidadeDor}/10` : '',
    `Descrição: ${evento.descricao || ''}`
  ].filter(Boolean);
  const textoCopiado = textoPartes.join('\n');
  
  navigator.clipboard.writeText(textoCopiado).then(() => {
    mostrarAviso('Evento copiado para a área de transferência!', 'success');
  }).catch(() => {
    mostrarAviso('Erro ao copiar evento.', 'error');
  });
}

// Função para obter informações do tipo de evento
function getEventTypeInfo(tipoEvento) {
  switch (tipoEvento) {
    case 'Crise / Emergência':
      return { 
        description: 'Crise / Emergência', 
        className: 'emergency',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>`
      };
    case 'Acompanhamento de Condição Crônica':
      return { 
        description: 'Condição Crônica', 
        className: 'chronic',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          <path d="M9 12l2 2 4-4"></path>
        </svg>`
      };
    case 'Episódio Psicológico ou Emocional':
      return { 
        description: 'Psicológico', 
        className: 'psychological',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 12l2 2 4-4"></path>
          <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.5 0 2.9.37 4.13 1.02"></path>
          <path d="M16 2l4 4-4 4"></path>
        </svg>`
      };
    case 'Evento Relacionado à Medicação':
      return { 
        description: 'Medicação', 
        className: 'medication',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"></path>
          <path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08L12 14l2.96-2.96a2.17 2.17 0 0 0 0-3.08L12 5Z"></path>
        </svg>`
      };
    default:
      return { 
        description: tipoEvento || 'Evento Clínico', 
        className: 'default',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 12l2 2 4-4"></path>
          <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.5 0 2.9.37 4.13 1.02"></path>
          <path d="M16 2l4 4-4 4"></path>
        </svg>`
      };
  }
}

// Função para visualizar evento
window.visualizarEvento = function(idEvento) {
  window.location.href = `/client/views/vizualizacaoEventoClinico.html?id=${idEvento}`;
};