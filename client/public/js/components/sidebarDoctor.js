import { API_URL } from '../config.js';
import { hasActivePatient, getActivePatient } from '../utils/patientValidation.js';

const primaryLinks = [
  { page: 'perfilmedico', label: 'Perfil do Médico', href: 'perfilMedico.html' },
  { page: 'agendamentos', label: 'Agendamentos', href: 'agendamentos.html' },
  { page: 'selecao', label: 'Buscar Pacientes', href: 'selecao.html' }
];

const secondaryLinks = [
  { page: 'notificacoes', label: 'Notificações', href: 'notificacoes.html' },
  { page: 'configuracoes', label: 'Configurações', href: 'configuracoes.html' }
];

// Links do paciente (quando médico está visualizando paciente ativo)
const patientMainLinks = [
  { page: 'perfilpaciente', label: 'Perfil do Paciente', href: 'perfilPaciente.html' },
  { page: 'agendamentos', label: 'Agendamentos', href: 'agendamentos.html' },
  { page: 'notificacoes', label: 'Notificações', href: 'notificacoes.html' },
  { page: 'historicoprontuario', label: 'Registro Clínico', href: 'historicoProntuario.html' },
  { page: 'anexoexame', label: 'Anexo de Exames', href: 'anexoExame.html' },
  { page: 'historicoeventoclinico', label: 'Eventos Clínicos', href: 'historicoEventoClinico.html' }
];

const patientReportLinks = [
  { page: 'diabetes', label: 'Relatório de Diabetes', href: 'diabetes.html' },
  { page: 'pressaoarterial', label: 'Pressão Arterial', href: 'pressaoArterial.html' },
  { page: 'historicocrisegastrite', label: 'Crise de Gastrite', href: 'historicoCriseGastrite.html' },
  { page: 'ciclomenstrual', label: 'Ciclo Menstrual', href: 'cicloMenstrual.html' },
  { page: 'hormonal', label: 'Saúde Hormonal', href: 'hormonal.html' },
  { page: 'insonia', label: 'Relatório de Insônia', href: 'insonia.html' },
  { page: 'enxaqueca', label: 'Relatório de Enxaqueca', href: 'enxaqueca.html' }
];

function buildLinks(links, activePage) {
  return links
    .map(link => {
      const isActive = link.page === activePage ? ' active' : '';
      return `<li><a class="sidebar-link${isActive}" data-page="${link.page}" href="${link.href}">${link.label}</a></li>`;
    })
    .join('');
}

// Carrega o nome do médico para exibir no sidebar do paciente
async function loadDoctorNameForPatientSidebar() {
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
    
    // Atualiza o sidebar usando a função padrão updateDoctorSidebarInfo
    if (window.updateDoctorSidebarInfo) {
      window.updateDoctorSidebarInfo(medico.nome, medico.areaAtuacao, medico.genero);
    }
  } catch (error) {
    console.error('Erro ao carregar nome do médico:', error);
  }
}

export function initDoctorSidebar(activePage = '') {
  const container = document.getElementById('sidebar-component');
  if (!container) {
    return;
  }

  const normalizedPage = activePage.trim().toLowerCase();
  const hasPatient = hasActivePatient();
  const patientInfo = hasPatient ? getActivePatient() : null;

  // Se há paciente ativo, renderiza o sidebar do paciente (mas com nome do médico no topo)
  if (hasPatient) {
    const mainLinksHtml = buildLinks(patientMainLinks, normalizedPage);
    const reportLinksHtml = buildLinks(patientReportLinks, normalizedPage);
    const reportsActive = patientReportLinks.some(link => link.page === normalizedPage);
    const sectionClass = reportsActive ? 'nav-section active' : 'nav-section';
    
    // Nome do médico será atualizado quando os dados forem carregados
    const doctorName = 'Dr(a). Nome';

    container.innerHTML = `
      <aside class="sidebar">
        <div class="profile">
          <div class="profile-info">
            <h3 id="doctorSidebarName">${doctorName}</h3>
            <p class="profile-role" id="doctorSidebarSpecialty">Acompanhamento Integrado</p>
          </div>
        </div>
        <nav class="sidebar-nav">
          <ul class="nav-main">
            ${mainLinksHtml}
          </ul>
          <div class="${sectionClass}">
            <p class="nav-heading">Relatórios e Dashboards</p>
            <ul class="nav-sub">
              ${reportLinksHtml}
            </ul>
          </div>
        </nav>
        <div class="sidebar-footer">
          <a class="sidebar-link alt" data-page="selecao" href="selecao.html">
            <span class="sidebar-link-icon">⏎</span>
            Trocar de Paciente
          </a>
          <a class="sidebar-link alt" data-page="configuracoes" href="configuracoes.html">
            <span class="sidebar-link-icon">⚙️</span>
            Configurações
          </a>
        </div>
      </aside>
    `;

    container.querySelectorAll('[data-page]').forEach(link => {
      if (link.dataset.page === normalizedPage) {
        link.classList.add('active');
      }
    });

    // Função para atualizar informações do médico no sidebar (quando há paciente ativo)
    window.updateDoctorSidebarInfo = function(name, specialty, genero) {
      const nameElement = container.querySelector('#doctorSidebarName');
      const specialtyElement = container.querySelector('#doctorSidebarSpecialty');
      const resolvedName = name && name.trim() ? name.trim() : 'Nome';
      const isFeminino = (genero || '').toString().toLowerCase().startsWith('f');
      const prefix = isFeminino ? 'Dra.' : 'Dr.';
      if (nameElement) {
        nameElement.textContent = `${prefix} ${resolvedName}`;
      }
      if (specialtyElement) {
        specialtyElement.textContent = specialty && specialty.trim() ? specialty : 'Acompanhamento Integrado';
      }
    };

    // Tenta carregar o nome do médico automaticamente
    loadDoctorNameForPatientSidebar();

    return;
  }

  // Se não há paciente ativo, renderiza o sidebar do médico (comportamento original)
  const primary = buildLinks(primaryLinks, normalizedPage);
  const secondary = buildLinks(secondaryLinks, normalizedPage);

  container.innerHTML = `
    <aside class="sidebar">
      <div class="profile">
        <div class="profile-info">
          <h3 id="doctorSidebarName">Dr(a). Nome</h3>
          <p class="profile-role" id="doctorSidebarSpecialty">Especialista PulseFlow</p>
        </div>
      </div>
      <nav class="sidebar-nav">
        <ul class="nav-main">
          ${primary}
        </ul>
        <div class="nav-section">
          <p class="nav-heading">Central</p>
          <ul class="nav-sub">
            ${secondary}
          </ul>
        </div>
      </nav>
      <div class="sidebar-footer">
        <a class="sidebar-link alt" data-page="suporte" href="contato.html">
          <span class="sidebar-link-icon">💬</span>
          Suporte PulseFlow
        </a>
        <a class="sidebar-link alt" data-page="sobre" href="sobreNos.html">
          <span class="sidebar-link-icon">ℹ️</span>
          Sobre a Plataforma
        </a>
      </div>
    </aside>
  `;

  container.querySelectorAll('[data-page]').forEach(link => {
    if (link.dataset.page === normalizedPage) {
      link.classList.add('active');
    }
  });

  window.updateDoctorSidebarInfo = function(name, specialty, genero) {
    const nameElement = container.querySelector('#doctorSidebarName');
    const specialtyElement = container.querySelector('#doctorSidebarSpecialty');
    const resolvedName = name && name.trim() ? name.trim() : 'Nome';
    const isFeminino = (genero || '').toString().toLowerCase().startsWith('f');
    const prefix = isFeminino ? 'Dra.' : 'Dr.';
    if (nameElement) {
      nameElement.textContent = `${prefix} ${resolvedName}`;
    }
    if (specialtyElement) {
      specialtyElement.textContent = specialty && specialty.trim() ? specialty : 'Especialista PulseFlow';
    }
  };
}

