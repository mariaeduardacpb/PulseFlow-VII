import { API_URL } from './config.js';
import { validateActivePatient, redirectToPatientSelection, handleApiError } from './utils/patientValidation.js';
import { startConnectionMonitoring, stopConnectionMonitoring } from './utils/connectionMonitor.js';
import { initHeaderComponent } from './components/header.js';
import { initSidebar } from './components/sidebar.js';

// Elementos DOM
let examsGrid, emptyState, loadingState, examsCount, totalExames, examesMes, categorias;
let filtroNome, filtroCategoria, filtroData, btnLimparFiltros, btnNovoExame, btnNovoExameEmpty;
let examModal, modalClose, modalTitle, modalNomeExame, modalCategoria, modalData, modalDescricao, modalImage;
let btnDownload, btnImprimir;
let uploadModal, uploadModalClose, uploadForm, btnSelectFile, arquivoExame, fileName, btnCancelUpload, btnSubmitUpload;

// Variáveis globais
let allExames = [];
let filteredExames = [];
let currentExamId = null;
let selectedPatient = null;

document.addEventListener('DOMContentLoaded', async () => {
  initHeaderComponent({ title: 'Anexo de Exames' });
  initSidebar('anexoexame');
  
  const validation = validateActivePatient();
  if (!validation.valid) {
    redirectToPatientSelection(validation.error);
    return;
  }

  startConnectionMonitoring(5);
  
  const toggleButton = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  
  if (toggleButton && sidebar) {
    toggleButton.addEventListener('click', () => {
      sidebar.classList.toggle('active');
      toggleButton.classList.toggle('shifted');
    });
  }
  
  setTimeout(async () => {
    await inicializarPagina();
    await carregarDadosMedico();
  }, 100);
});

async function carregarDadosMedico() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    const response = await fetch(`${API_URL}/api/usuarios/perfil`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) return;

    const medico = await response.json();
    
    if (window.updateSidebarInfo) {
      window.updateSidebarInfo(medico.nome, medico.areaAtuacao || 'Acompanhamento Integrado', medico.genero, medico.crm);
    }
  } catch (error) {
    console.error('Erro ao carregar dados do médico:', error);
  }
}

async function inicializarPagina() {
  try {
    // Inicializar elementos DOM
    inicializarElementosDOM();
    
    // Configurar event listeners
    configurarEventListeners();
    
    // Carregar dados
    await carregarExames();
    
    // Atualizar estatísticas
    atualizarEstatisticas();
    
  } catch (error) {
    console.error('Erro ao inicializar página:', error);
    mostrarErro('Erro ao inicializar a página');
  }
}

function inicializarElementosDOM() {
  // Elementos principais
  examsGrid = document.getElementById('examsGrid');
  emptyState = document.getElementById('emptyState');
  loadingState = document.getElementById('loadingState');
  examsCount = document.getElementById('examsCount');
  
  // Estatísticas
  totalExames = document.getElementById('totalExames');
  examesMes = document.getElementById('examesMes');
  categorias = document.getElementById('categorias');
  
  // Filtros
  filtroNome = document.getElementById('filtroNome');
  filtroCategoria = document.getElementById('filtroCategoria');
  filtroData = document.getElementById('filtroData');
  btnLimparFiltros = document.getElementById('btnLimparFiltros');
  btnNovoExame = document.getElementById('btnNovoExame');
  btnNovoExameEmpty = document.getElementById('btnNovoExameEmpty');
  
  // Modal
  examModal = document.getElementById('examModal');
  modalClose = document.getElementById('modalClose');
  modalTitle = document.getElementById('modalTitle');
  modalNomeExame = document.getElementById('modalNomeExame');
  modalCategoria = document.getElementById('modalCategoria');
  modalData = document.getElementById('modalData');
  modalDescricao = document.getElementById('modalDescricao');
  modalImage = document.getElementById('modalImage');
  btnDownload = document.getElementById('btnDownload');
  btnImprimir = document.getElementById('btnImprimir');
  
  // Modal Upload
  uploadModal = document.getElementById('uploadModal');
  uploadModalClose = document.getElementById('uploadModalClose');
  uploadForm = document.getElementById('uploadForm');
  btnSelectFile = document.getElementById('btnSelectFile');
  arquivoExame = document.getElementById('arquivoExame');
  fileName = document.getElementById('fileName');
  btnCancelUpload = document.getElementById('btnCancelUpload');
  btnSubmitUpload = document.getElementById('btnSubmitUpload');
}

function configurarEventListeners() {
  // Filtros
  if (filtroNome) filtroNome.addEventListener('input', aplicarFiltros);
  if (filtroCategoria) filtroCategoria.addEventListener('change', aplicarFiltros);
  if (filtroData) filtroData.addEventListener('change', aplicarFiltros);
  
  // Botões
  if (btnLimparFiltros) btnLimparFiltros.addEventListener('click', limparFiltros);
  if (btnNovoExame) btnNovoExame.addEventListener('click', criarNovoExame);
  if (btnNovoExameEmpty) btnNovoExameEmpty.addEventListener('click', criarNovoExame);
  
  // Modal
  if (modalClose) modalClose.addEventListener('click', fecharModal);
  if (btnDownload) btnDownload.addEventListener('click', downloadExame);
  if (btnImprimir) btnImprimir.addEventListener('click', imprimirExame);
  
  // Fechar modal com ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && examModal.classList.contains('show')) {
      fecharModal();
    }
  });
  
  // Fechar modal clicando fora
  if (examModal) {
    examModal.addEventListener('click', (e) => {
      if (e.target === examModal) {
        fecharModal();
      }
    });
  }
  
  // Modal Upload
  if (btnSelectFile && arquivoExame) {
    btnSelectFile.addEventListener('click', () => {
      arquivoExame.click();
    });
  }
  
  if (arquivoExame) {
    arquivoExame.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        fileName.textContent = file.name;
        fileName.style.color = '#1e293b';
      } else {
        fileName.textContent = 'Nenhum arquivo selecionado';
        fileName.style.color = '#64748b';
      }
    });
  }
  
  if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await enviarExame();
    });
  }
  
  if (uploadModalClose) {
    uploadModalClose.addEventListener('click', fecharModalUpload);
  }
  
  if (btnCancelUpload) {
    btnCancelUpload.addEventListener('click', fecharModalUpload);
  }
  
  if (uploadModal) {
    uploadModal.addEventListener('click', (e) => {
      if (e.target === uploadModal) {
        fecharModalUpload();
      }
    });
  }
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (uploadModal && uploadModal.classList.contains('show')) {
        fecharModalUpload();
      }
    }
  });
}

async function carregarExames() {
  try {
    mostrarLoading(true);
    
    const validation = validateActivePatient();
    if (!validation.valid) {
      redirectToPatientSelection(validation.error);
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado');
    }
    
    // Definir paciente selecionado globalmente
    selectedPatient = validation.paciente;
    
    // Buscar exames da API usando CPF do paciente
    const cpfPaciente = validation.cpf;
    const response = await fetch(`${API_URL}/api/anexoExame/medico?cpf=${cpfPaciente}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const handled = await handleApiError(response);
    if (handled) {
      mostrarLoading(false);
      return;
    }
    
    if (!response.ok) {
      if (response.status === 404) {
        // Nenhum exame encontrado - não é erro
        allExames = [];
        filteredExames = [];
        atualizarEstatisticas();
        mostrarLoading(false);
        return;
      }
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Processar dados da API
    if (Array.isArray(data)) {
      allExames = data.map(exame => ({
        id: exame._id?.$oid || exame._id,
        nome: exame.nome || 'Exame sem nome',
        categoria: exame.categoria || 'Sem categoria',
        data: exame.data,
        filePath: exame.filePath,
        paciente: exame.paciente?.$oid || exame.paciente,
        descricao: `Exame de ${exame.categoria || 'categoria não especificada'}`
      }));
    } else {
      allExames = [];
    }
    
    filteredExames = [...allExames];
    atualizarEstatisticas();
    
  } catch (error) {
    console.error('Erro ao carregar exames:', error);
    mostrarErro(`Erro ao carregar exames: ${error.message}`);
    allExames = [];
    filteredExames = [];
  } finally {
    mostrarLoading(false);
  }
}

function renderizarExames(exames = filteredExames) {
  if (!examsGrid) return;
  
  // Atualizar contador
  if (examsCount) {
    examsCount.textContent = `${exames.length} exame${exames.length !== 1 ? 's' : ''} encontrado${exames.length !== 1 ? 's' : ''}`;
  }
  
  // Sempre ocultar estados primeiro
  if (emptyState) emptyState.style.display = 'none';
  if (loadingState) loadingState.style.display = 'none';
  
  if (exames.length === 0) {
    examsGrid.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }
  
  // Mostrar grid e renderizar exames
  examsGrid.style.display = 'grid';
  examsGrid.innerHTML = exames.map(exame => criarCardExame(exame)).join('');
  
  // Adicionar event listeners aos cards
  document.querySelectorAll('.exam-card').forEach(card => {
    card.addEventListener('click', () => abrirModalExame(card.dataset.id));
  });
  
  // Adicionar event listeners aos botões
  document.querySelectorAll('.btn-view').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      abrirModalExame(btn.dataset.id);
    });
  });
  
  document.querySelectorAll('.btn-download').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      downloadExame(btn.dataset.id);
    });
  });
}

function criarCardExame(exame) {
  const dataFormatada = formatarData(exame.data);
  
  return `
    <div class="exam-card" data-id="${exame.id}">
      <div class="exam-header">
        <h3 class="exam-title">${exame.nome}</h3>
        <span class="exam-category">${exame.categoria}</span>
      </div>
      <div class="exam-info">
        <div class="exam-date">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          ${dataFormatada}
        </div>
        <p class="exam-description">${exame.descricao}</p>
      </div>
      <div class="exam-actions">
        <button class="btn-view" data-id="${exame.id}">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          Visualizar
        </button>
        <button class="btn-download" data-id="${exame.id}">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7,10 12,15 17,10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Download
        </button>
      </div>
    </div>
  `;
}

function aplicarFiltros() {
  const nome = filtroNome?.value.toLowerCase() || '';
  const categoria = filtroCategoria?.value || '';
  const data = filtroData?.value || '';
  
  filteredExames = allExames.filter(exame => {
    const matchNome = !nome || exame.nome.toLowerCase().includes(nome);
    const matchCategoria = !categoria || exame.categoria === categoria;
    
    let matchData = true;
    if (data && exame.data) {
      const dataExame = new Date(exame.data).toISOString().split('T')[0]; // YYYY-MM-DD
      matchData = dataExame === data;
    }
    
    return matchNome && matchCategoria && matchData;
  });
  
  renderizarExames();
}

function limparFiltros() {
  if (filtroNome) filtroNome.value = '';
  if (filtroCategoria) filtroCategoria.value = '';
  if (filtroData) filtroData.value = '';
  
  filteredExames = [...allExames];
  renderizarExames();
}

function atualizarEstatisticas() {
  if (totalExames) totalExames.textContent = allExames.length;
  
  // Exames deste mês
  const mesAtual = new Date().toISOString().slice(0, 7); // YYYY-MM
  const examesMesAtual = allExames.filter(exame => {
    if (!exame.data) return false;
    const dataExame = new Date(exame.data).toISOString().slice(0, 7);
    return dataExame === mesAtual;
  });
  if (examesMes) examesMes.textContent = examesMesAtual.length;
  
  // Categorias únicas
  const categoriasUnicas = [...new Set(allExames.map(exame => exame.categoria))];
  if (categorias) categorias.textContent = categoriasUnicas.length;
}

async function abrirModalExame(exameId) {
  const exame = allExames.find(e => e.id === exameId);
  if (!exame) return;
  
  currentExamId = exameId;
  
  if (modalTitle) modalTitle.textContent = exame.nome;
  if (modalNomeExame) modalNomeExame.textContent = exame.nome;
  if (modalCategoria) modalCategoria.textContent = exame.categoria;
  if (modalData) modalData.textContent = formatarData(exame.data);
  if (modalDescricao) modalDescricao.textContent = exame.descricao;
  
  if (modalImage) {
    modalImage.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 200px;">
        <div class="loading-spinner" style="width: 40px; height: 40px; border: 4px solid #e5e7eb; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      </div>
    `;
    
    await carregarPreviewExame(exame);
  }
  
  if (examModal) {
    examModal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
}

async function carregarPreviewExame(exame) {
  if (!exame || !exame.id) {
    if (modalImage) {
      modalImage.innerHTML = `
        <div style="text-align: center; color: #94a3b8; padding: 40px 20px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14,2 14,8 20,8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
          <p style="margin-top: 12px;">Nenhum arquivo disponível</p>
        </div>
      `;
    }
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado');
    }
    
    const previewUrl = `${API_URL}/api/anexoExame/preview/${exame.id}`;
    const response = await fetch(previewUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const contentType = blob.type;
    const url = window.URL.createObjectURL(blob);
    
    let extensao = '';
    if (exame.filePath) {
      const partes = exame.filePath.split('.');
      if (partes.length > 1) {
        extensao = partes[partes.length - 1].toLowerCase();
      }
    }
    
    if (contentType.startsWith('image/') || extensao === 'png' || extensao === 'jpg' || extensao === 'jpeg' || extensao === 'heic') {
      if (modalImage) {
        modalImage.innerHTML = `
          <img src="${url}" alt="${exame.nome}" style="max-width: 100%; max-height: 500px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); object-fit: contain;">
        `;
        
        const img = modalImage.querySelector('img');
        if (img) {
          img.onload = () => {
            window.URL.revokeObjectURL(url);
          };
          img.onerror = () => {
            window.URL.revokeObjectURL(url);
            mostrarPreviewErro();
          };
        }
      }
    } else if (contentType === 'application/pdf' || extensao === 'pdf') {
      if (modalImage) {
        modalImage.innerHTML = `
          <div style="width: 100%; height: 500px; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
            <iframe src="${url}" style="width: 100%; height: 100%; border: none;"></iframe>
          </div>
          <div style="margin-top: 12px; text-align: center;">
            <a href="${url}" target="_blank" style="color: #3b82f6; text-decoration: none; font-weight: 500;">
              Abrir PDF em nova aba
            </a>
          </div>
        `;
      }
    } else {
      mostrarPreviewErro();
    }
  } catch (error) {
    console.error('Erro ao carregar preview:', error);
    mostrarPreviewErro();
  }
}

function mostrarPreviewErro() {
  if (modalImage) {
    modalImage.innerHTML = `
      <div style="text-align: center; color: #94a3b8; padding: 40px 20px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14,2 14,8 20,8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
        <p style="margin-top: 12px;">Prévia não disponível</p>
        <p style="font-size: 12px; color: #64748b; margin-top: 8px;">Use o botão Download para visualizar o arquivo</p>
      </div>
    `;
  }
}

function fecharModal() {
  if (examModal) {
    examModal.classList.remove('show');
    document.body.style.overflow = '';
  }
}

async function downloadExame(exameId = null) {
  const exameIdToUse = exameId || currentExamId;
  const exame = allExames.find(e => e.id === exameIdToUse);
  if (!exame) {
    mostrarAviso('Nenhum exame selecionado para download.', 'warning');
    return;
  }
  
  const token = localStorage.getItem('token');
  if (!token) {
    mostrarAviso('Token não encontrado. Faça login novamente.', 'error');
    return;
  }
  
  if (!exameIdToUse) {
    mostrarAviso('ID do exame não encontrado.', 'error');
    return;
  }
  
  try {
    const downloadUrl = `${API_URL}/api/anexoExame/download/${exameIdToUse}`;
    
    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const handled = await handleApiError(response);
    if (handled) {
      return;
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    let extensao = 'pdf';
    if (exame.filePath) {
      const partes = exame.filePath.split('.');
      if (partes.length > 1) {
        extensao = partes[partes.length - 1].toLowerCase();
      }
    }
    
    const contentType = response.headers.get('content-type') || blob.type;
    if (contentType) {
      const extensoesPorTipo = {
        'application/pdf': 'pdf',
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/heic': 'heic'
      };
      
      if (extensoesPorTipo[contentType]) {
        extensao = extensoesPorTipo[contentType];
      }
    }
    
    const nomeArquivo = `${exame.nome.replace(/[^a-z0-9]/gi, '_')}.${extensao}`;
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
    
    mostrarAviso(`Download do exame "${exame.nome}" iniciado!`, 'success');
  } catch (error) {
    console.error('Erro ao fazer download:', error);
    mostrarAviso(`Erro ao fazer download: ${error.message}`, 'error');
  }
}

function imprimirExame() {
  const exame = allExames.find(e => e.id === currentExamId);
  if (!exame) {
    mostrarAviso('Nenhum exame selecionado para impressão.', 'warning');
    return;
  }
  
  // Criar conteúdo para impressão
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Relatório Médico - ${exame.nome}</title>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.5;
          color: #1a1a1a;
          background: #ffffff;
          font-size: 13px;
          max-height: 100vh;
          overflow: hidden;
        }
        
        .page {
          width: 100%;
          height: 100vh;
          padding: 25px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 30px;
          padding-bottom: 20px;
        }
        
        .logo-section {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .logo {
          width: 45px;
          height: 45px;
          background: url('/client/public/assets/pulseLogo.png') no-repeat center;
          background-size: contain;
        }
        
        .brand-info {
          display: flex;
          flex-direction: column;
        }
        
        .brand-name {
          font-size: 20px;
          font-weight: 700;
          color: #3b82f6;
          margin-bottom: 2px;
        }
        
        .brand-subtitle {
          font-size: 11px;
          color: #666;
          font-weight: 400;
        }
        
        .document-info {
          text-align: right;
          font-size: 11px;
          color: #666;
        }
        
        .document-title {
          font-size: 18px;
          font-weight: 600;
          color: #1a1a1a;
          text-align: center;
          margin: 30px 0;
          padding: 20px 0;
        }
        
        .content-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          flex: 1;
          margin-bottom: 30px;
        }
        
        .left-column {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }
        
        .right-column {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }
        
        .section {
          background: #ffffff;
        }
        
        .section-title {
          font-size: 12px;
          font-weight: 600;
          color: #3b82f6;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 15px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
          padding: 15px;
          background: #f8f9fa;
        }
        
        .info-label {
          font-size: 10px;
          font-weight: 500;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        
        .info-value {
          font-size: 13px;
          font-weight: 500;
          color: #1a1a1a;
        }
        
        .image-container {
          text-align: center;
          margin: 20px 0;
        }
        
        .exam-image {
          max-width: 100%;
          max-height: 350px;
          height: auto;
          object-fit: contain;
        }
        
        .no-image {
          padding: 50px 20px;
          background: #f8f9fa;
          color: #6b7280;
          font-size: 12px;
          text-align: center;
        }
        
        .signature-section {
          margin-top: 30px;
          padding: 25px 0;
          background: #f8f9fa;
        }
        
        .signature-line {
          text-align: center;
          max-width: 350px;
          margin: 0 auto;
        }
        
        .signature-space {
          border-bottom: 2px solid #1a1a1a;
          width: 100%;
          margin: 0 auto 10px;
          height: 25px;
          position: relative;
        }
        
        .signature-space::before {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          height: 1px;
          background: repeating-linear-gradient(
            to right,
            transparent 0px,
            transparent 8px,
            #1a1a1a 8px,
            #1a1a1a 10px
          );
        }
        
        .signature-label {
          font-size: 11px;
          color: #666;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 8px;
        }
        
        .signature-info {
          font-size: 9px;
          color: #999;
          margin-top: 8px;
          font-style: italic;
        }
        
        .footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 20px;
          font-size: 10px;
          color: #666;
        }
        
        .footer-left {
          display: flex;
          flex-direction: column;
        }
        
        .footer-right {
          text-align: right;
        }
        
        @media print {
          body { 
            margin: 0; 
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .page {
            height: 100vh;
            padding: 20px;
          }
          .content-grid {
            gap: 25px;
          }
          .exam-image {
            max-height: 300px;
          }
        }
        
        @media screen and (max-width: 600px) {
          .content-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .header {
            flex-direction: column;
            gap: 10px;
            text-align: center;
          }
          .logo-section {
            justify-content: center;
          }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div class="logo-section">
            <div class="logo"></div>
            <div class="brand-info">
              <div class="brand-name">PulseFlow</div>
              <div class="brand-subtitle">Sistema de Monitoramento Médico</div>
            </div>
          </div>
          <div class="document-info">
            <div>Relatório Médico</div>
            <div>${new Date().toLocaleDateString('pt-BR')}</div>
          </div>
        </div>
        
        <div class="document-title">${exame.nome}</div>
        
              <div class="content-grid">
                <div class="left-column">
                  <div class="section">
                    <div class="section-title">Dados do Exame</div>
                    <div class="info-grid">
                      <div class="info-item">
                        <div class="info-label">Categoria</div>
                        <div class="info-value">${exame.categoria}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">Data</div>
                        <div class="info-value">${formatarData(exame.data)}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="section">
                    <div class="section-title">Dados do Paciente</div>
                    <div class="info-grid">
                      <div class="info-item">
                        <div class="info-label">Nome</div>
                        <div class="info-value">${selectedPatient?.nome || 'N/A'}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">CPF</div>
                        <div class="info-value">${selectedPatient?.cpf || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="right-column">
                  <div class="image-container">
                    ${exame.filePath ? `
                      <img src="${exame.filePath}" alt="${exame.nome}" class="exam-image">
                    ` : `
                      <div class="no-image">
                        <div>📄</div>
                        <div>Nenhuma imagem disponível</div>
                      </div>
                    `}
                  </div>
                </div>
              </div>
        
        <div class="signature-section">
          <div class="signature-line">
            <div class="signature-space"></div>
            <div class="signature-label">Assinatura do Médico Responsável</div>
            <div class="signature-info">Nome completo e CRM</div>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-left">
            <div>Documento gerado em: ${new Date().toLocaleString('pt-BR')}</div>
            <div>PulseFlow - Sistema de Monitoramento Médico</div>
          </div>
          <div class="footer-right">
            <div>Documento médico oficial</div>
            <div>Válido com assinatura</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  // Criar janela de impressão
  const printWindow = window.open('', '_blank');
  printWindow.document.write(printContent);
  printWindow.document.close();
  
  // Aguardar carregamento e imprimir
  printWindow.onload = function() {
    printWindow.print();
    printWindow.close();
  };
  
  mostrarAviso(`Impressão do exame "${exame.nome}" iniciada!`, 'success');
}

function criarNovoExame() {
  const validation = validateActivePatient();
  if (!validation.valid) {
    redirectToPatientSelection(validation.error);
    return;
  }
  
  if (uploadModal) {
    if (uploadForm) {
      uploadForm.reset();
    }
    if (fileName) {
      fileName.textContent = 'Nenhum arquivo selecionado';
      fileName.style.color = '#64748b';
    }
    if (arquivoExame) {
      arquivoExame.value = '';
    }
    const hoje = new Date().toISOString().split('T')[0];
    const dataExame = document.getElementById('dataExame');
    if (dataExame) {
      dataExame.value = hoje;
    }
    
    uploadModal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
}

function fecharModalUpload() {
  if (uploadModal) {
    uploadModal.classList.remove('show');
    document.body.style.overflow = '';
  }
}

async function enviarExame() {
  const validation = validateActivePatient();
  if (!validation.valid) {
    redirectToPatientSelection(validation.error);
    return;
  }
  
  const nome = document.getElementById('nomeExame')?.value.trim();
  const categoria = document.getElementById('categoriaExame')?.value;
  const data = document.getElementById('dataExame')?.value;
  const arquivo = arquivoExame?.files[0];
  
  if (!nome || !categoria || !data || !arquivo) {
    mostrarAviso('Por favor, preencha todos os campos obrigatórios.', 'warning');
    return;
  }
  
  if (arquivo.size > 10 * 1024 * 1024) {
    mostrarAviso('O arquivo é muito grande. Tamanho máximo permitido: 10MB', 'warning');
    return;
  }
  
  const formData = new FormData();
  formData.append('arquivo', arquivo);
  formData.append('nome', nome);
  formData.append('categoria', categoria);
  formData.append('data', data);
  formData.append('cpf', validation.cpf);
  
  if (btnSubmitUpload) {
    btnSubmitUpload.disabled = true;
    btnSubmitUpload.classList.add('btn-submit-loading');
    const originalText = btnSubmitUpload.innerHTML;
    btnSubmitUpload.innerHTML = `
      <div class="loading-spinner" style="width: 16px; height: 16px; border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; display: inline-block;"></div>
      Enviando...
    `;
  }
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado');
    }
    
    const response = await fetch(`${API_URL}/api/anexoExame/medico/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const handled = await handleApiError(response);
    if (handled) {
      if (btnSubmitUpload) {
        btnSubmitUpload.disabled = false;
        btnSubmitUpload.classList.remove('btn-submit-loading');
        btnSubmitUpload.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7,10 12,15 17,10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Enviar Exame
        `;
      }
      return;
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    mostrarAviso('Exame enviado com sucesso!', 'success');
    fecharModalUpload();
    
    await carregarExames();
    atualizarEstatisticas();
    
  } catch (error) {
    console.error('Erro ao enviar exame:', error);
    mostrarAviso(`Erro ao enviar exame: ${error.message}`, 'error');
  } finally {
    if (btnSubmitUpload) {
      btnSubmitUpload.disabled = false;
      btnSubmitUpload.classList.remove('btn-submit-loading');
      btnSubmitUpload.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7,10 12,15 17,10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Enviar Exame
      `;
    }
  }
}

function mostrarLoading(show) {
  if (loadingState) {
    loadingState.style.display = show ? 'flex' : 'none';
  }
  
  if (show) {
    // Durante loading, ocultar outros estados
    if (examsGrid) examsGrid.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
  } else {
    // Após loading, renderizar exames normalmente
    renderizarExames();
  }
}

function formatarData(data) {
  if (!data) return '-';
  const date = new Date(data);
  return date.toLocaleDateString('pt-BR');
}

function mostrarAviso(mensagem, tipo = 'success') {
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: tipo === 'success' ? 'Sucesso!' : tipo === 'error' ? 'Erro!' : 'Informação',
      text: mensagem,
      icon: tipo,
      timer: 3000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  } else {
    console.log(`${tipo.toUpperCase()}: ${mensagem}`);
  }
}

// Função de debug para verificar localStorage
window.debugPaciente = function() {
  console.log('=== DEBUG PACIENTE ===');
  console.log('Token:', localStorage.getItem('token'));
  
  const chavesPaciente = ['selectedPatient', 'pacienteSelecionado', 'selectedPatientData'];
  chavesPaciente.forEach(chave => {
    const dados = localStorage.getItem(chave);
    console.log(`${chave}:`, dados);
    if (dados) {
      try {
        const parsed = JSON.parse(dados);
        console.log(`${chave} (parsed):`, parsed);
      } catch (e) {
        console.log(`${chave} (erro ao parsear):`, e.message);
      }
    }
  });
  
  // Listar todas as chaves do localStorage
  console.log('Todas as chaves do localStorage:');
  for (let i = 0; i < localStorage.length; i++) {
    const chave = localStorage.key(i);
    console.log(`- ${chave}: ${localStorage.getItem(chave)}`);
  }
};

function mostrarErro(mensagem) {
  mostrarAviso(mensagem, 'error');
}

// Funções globais para debug
window.debugExames = function() {
  console.log('=== DEBUG EXAMES ===');
  console.log('Total de exames:', allExames.length);
  console.log('Exames filtrados:', filteredExames.length);
  console.log('Elementos DOM:', {
    examsGrid: !!examsGrid,
    emptyState: !!emptyState,
    loadingState: !!loadingState,
    examsCount: !!examsCount
  });
};

window.forcarCarregamentoExames = async function() {
  console.log('=== FORÇANDO CARREGAMENTO DE EXAMES ===');
  await carregarExames();
};

window.testarRenderizacao = function() {
  if (allExames.length > 0) {
    renderizarExames(allExames);
  } else {
    console.log('Nenhum exame para renderizar');
  }
};

window.addEventListener('beforeunload', () => {
  stopConnectionMonitoring();
});
