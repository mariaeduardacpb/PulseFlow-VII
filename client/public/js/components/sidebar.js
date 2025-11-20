import { API_URL } from '../config.js';
import { hasActivePatient, getActivePatient } from '../utils/patientValidation.js';

const icons = {
  perfilmedico: '<i class="fas fa-user-md"></i>',
  agendamentos: '<i class="fas fa-calendar-alt"></i>',
  selecao: '<i class="fas fa-search"></i>',
  notificacoes: '<i class="fas fa-bell"></i>',
  configuracoes: '<i class="fas fa-cog"></i>',
  perfilpaciente: '<i class="fas fa-user"></i>',
  historicoprontuario: '<i class="fas fa-file-medical"></i>',
  anexoexame: '<i class="fas fa-paperclip"></i>',
  historicoeventoclinico: '<i class="fas fa-clipboard-check"></i>',
  diabetes: '<i class="fas fa-tint"></i>',
  pressaoarterial: '<i class="fas fa-heartbeat"></i>',
  historicocrisegastrite: '<i class="fas fa-chart-line"></i>',
  ciclomenstrual: '<i class="fas fa-circle"></i>',
  hormonal: '<i class="fas fa-balance-scale"></i>',
  insonia: '<i class="fas fa-moon"></i>',
  enxaqueca: '<i class="fas fa-head-side-virus"></i>',
  suporte: '<i class="fas fa-comments"></i>',
  sobre: '<i class="fas fa-info-circle"></i>'
};

const primaryLinks = [
  { page: 'perfilmedico', label: 'Perfil do Médico', href: 'perfilMedico.html', icon: icons.perfilmedico },
  { page: 'agendamentos', label: 'Agendamentos', href: 'agendamentos.html', icon: icons.agendamentos },
  { page: 'selecao', label: 'Buscar Pacientes', href: 'selecao.html', icon: icons.selecao }
];

const secondaryLinks = [
  { page: 'notificacoes', label: 'Notificações', href: 'notificacoes.html', icon: icons.notificacoes },
  { page: 'configuracoes', label: 'Configurações', href: 'configuracoes.html', icon: icons.configuracoes }
];

const patientMainLinks = [
  { page: 'perfilpaciente', label: 'Perfil do Paciente', href: 'perfilPaciente.html', icon: icons.perfilpaciente },
  { page: 'agendamentos', label: 'Agendamentos', href: 'agendamentos.html', icon: icons.agendamentos },
  { page: 'notificacoes', label: 'Notificações', href: 'notificacoes.html', icon: icons.notificacoes },
  { page: 'historicoprontuario', label: 'Registro Clínico', href: 'historicoProntuario.html', icon: icons.historicoprontuario },
  { page: 'anexoexame', label: 'Anexo de Exames', href: 'anexoExame.html', icon: icons.anexoexame },
  { page: 'historicoeventoclinico', label: 'Eventos Clínicos', href: 'historicoEventoClinico.html', icon: icons.historicoeventoclinico }
];

const patientReportLinks = [
  { page: 'diabetes', label: 'Relatório de Diabetes', href: 'diabetes.html', icon: icons.diabetes },
  { page: 'pressaoarterial', label: 'Pressão Arterial', href: 'pressaoArterial.html', icon: icons.pressaoarterial },
  { page: 'historicocrisegastrite', label: 'Crise de Gastrite', href: 'historicoCriseGastrite.html', icon: icons.historicocrisegastrite },
  { page: 'ciclomenstrual', label: 'Ciclo Menstrual', href: 'cicloMenstrual.html', icon: icons.ciclomenstrual },
  { page: 'hormonal', label: 'Saúde Hormonal', href: 'hormonal.html', icon: icons.hormonal },
  { page: 'insonia', label: 'Relatório de Insônia', href: 'insonia.html', icon: icons.insonia },
  { page: 'enxaqueca', label: 'Relatório de Enxaqueca', href: 'enxaqueca.html', icon: icons.enxaqueca }
];

function buildLinks(links, activePage) {
  return links
    .map(link => {
      const isActive = link.page === activePage ? ' active' : '';
      const icon = link.icon || '<i class="fas fa-circle"></i>';
      return `<li><a class="sidebar-link${isActive}" data-page="${link.page}" href="${link.href}"><span class="sidebar-link-icon">${icon}</span><span class="sidebar-link-text">${link.label}</span></a></li>`;
    })
    .join('');
}

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
    
    if (window.updateSidebarInfo) {
      window.updateSidebarInfo(medico.nome, medico.areaAtuacao, medico.genero, medico.crm);
    }
  } catch (error) {
  }
}

function isDoctor() {
  const token = localStorage.getItem('token');
  return !!token;
}

export function initSidebar(activePage = '') {
  const container = document.getElementById('sidebar-component');
  if (!container) {
    return;
  }

  const normalizedPage = activePage.trim().toLowerCase();
  const isMedico = isDoctor();
  const hasPatient = hasActivePatient();

  if (isMedico && hasPatient) {
    const mainLinksHtml = buildLinks(patientMainLinks, normalizedPage);
    const reportLinksHtml = buildLinks(patientReportLinks, normalizedPage);
    const reportsActive = patientReportLinks.some(link => link.page === normalizedPage);
    const sectionClass = reportsActive ? 'nav-section active' : 'nav-section';
    
    const doctorName = 'Dr(a). Nome';

    container.innerHTML = `
      <aside class="sidebar">
        <div class="profile">
          <div class="profile-info">
            <h3 id="sidebarName">${doctorName}</h3>
            <p class="profile-role" id="sidebarSpecialty">Acompanhamento Integrado</p>
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
            <span class="sidebar-link-icon">${icons.selecao}</span>
            <span class="sidebar-link-text">Trocar de Paciente</span>
          </a>
          <a class="sidebar-link alt" data-page="configuracoes" href="configuracoes.html">
            <span class="sidebar-link-icon">${icons.configuracoes}</span>
            <span class="sidebar-link-text">Configurações</span>
          </a>
        </div>
      </aside>
    `;

    container.querySelectorAll('[data-page]').forEach(link => {
      if (link.dataset.page === normalizedPage) {
        link.classList.add('active');
      }
    });

    window.updateSidebarInfo = function(name, specialty, genero, crm) {
      const nameElement = container.querySelector('#sidebarName');
      const specialtyElement = container.querySelector('#sidebarSpecialty');
      const resolvedName = name && name.trim() ? name.trim() : 'Nome';
      const isFeminino = (genero || '').toString().toLowerCase().startsWith('f');
      const prefix = isFeminino ? 'Dra.' : 'Dr.';
      
      if (nameElement) {
        const nameParts = resolvedName.split(' ');
        if (nameParts.length > 2) {
          const firstName = nameParts.slice(0, -1).join(' ');
          const lastName = nameParts[nameParts.length - 1];
          nameElement.innerHTML = `${prefix} ${firstName}<br>${lastName}`;
        } else {
          nameElement.textContent = `${prefix} ${resolvedName}`;
        }
      }
      if (specialtyElement) {
        const specialtyText = specialty && specialty.trim() ? specialty : 'Acompanhamento Integrado';
        const crmText = crm && crm.trim() ? `CRM ${crm.trim()}` : '';
        specialtyElement.textContent = crmText ? `${specialtyText} - ${crmText}` : specialtyText;
      }
    };

    loadDoctorNameForPatientSidebar();
    return;
  }

  if (isMedico) {
    const primary = buildLinks(primaryLinks, normalizedPage);
    const secondary = buildLinks(secondaryLinks, normalizedPage);

    container.innerHTML = `
      <aside class="sidebar">
        <div class="profile">
          <div class="profile-info">
            <h3 id="sidebarName">Dr(a). Nome</h3>
            <p class="profile-role" id="sidebarSpecialty">Especialista PulseFlow</p>
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
            <span class="sidebar-link-icon">${icons.suporte}</span>
            <span class="sidebar-link-text">Suporte PulseFlow</span>
          </a>
          <a class="sidebar-link alt" data-page="sobre" href="sobreNos.html">
            <span class="sidebar-link-icon">${icons.sobre}</span>
            <span class="sidebar-link-text">Sobre a Plataforma</span>
          </a>
        </div>
      </aside>
    `;

    container.querySelectorAll('[data-page]').forEach(link => {
      if (link.dataset.page === normalizedPage) {
        link.classList.add('active');
      }
    });

    window.updateSidebarInfo = function(name, specialty, genero, crm) {
      const nameElement = container.querySelector('#sidebarName');
      const specialtyElement = container.querySelector('#sidebarSpecialty');
      const resolvedName = name && name.trim() ? name.trim() : 'Nome';
      const isFeminino = (genero || '').toString().toLowerCase().startsWith('f');
      const prefix = isFeminino ? 'Dra.' : 'Dr.';
      
      if (nameElement) {
        const nameParts = resolvedName.split(' ');
        if (nameParts.length > 2) {
          const firstName = nameParts.slice(0, -1).join(' ');
          const lastName = nameParts[nameParts.length - 1];
          nameElement.innerHTML = `${prefix} ${firstName}<br>${lastName}`;
        } else {
          nameElement.textContent = `${prefix} ${resolvedName}`;
        }
      }
      if (specialtyElement) {
        const specialtyText = specialty && specialty.trim() ? specialty : 'Especialista PulseFlow';
        const crmText = crm && crm.trim() ? `CRM ${crm.trim()}` : '';
        specialtyElement.textContent = crmText ? `${specialtyText} - ${crmText}` : specialtyText;
      }
    };
    return;
  }

  const mainLinksHtml = buildLinks(patientMainLinks, normalizedPage);
  const reportLinksHtml = buildLinks(patientReportLinks, normalizedPage);
  const reportsActive = patientReportLinks.some(link => link.page === normalizedPage);
  const sectionClass = reportsActive ? 'nav-section active' : 'nav-section';

  container.innerHTML = `
    <aside class="sidebar">
      <div class="profile">
        <div class="profile-info">
          <h3 id="sidebarName">Dr(a). Nome</h3>
          <p class="profile-role">Acompanhamento Integrado</p>
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
          <span class="sidebar-link-icon">${icons.selecao}</span>
          <span class="sidebar-link-text">Trocar de Paciente</span>
        </a>
        <a class="sidebar-link alt" data-page="configuracoes" href="configuracoes.html">
          <span class="sidebar-link-icon">${icons.configuracoes}</span>
          <span class="sidebar-link-text">Configurações</span>
        </a>
      </div>
    </aside>
  `;

  container.querySelectorAll('[data-page]').forEach(link => {
    if (link.dataset.page === normalizedPage) {
      link.classList.add('active');
    }
  });

  window.updateSidebarInfo = function(name) {
    const sidebarName = container.querySelector('#sidebarName');
    if (sidebarName) {
      sidebarName.textContent = name && name.trim() ? name : 'Dr(a). Nome';
    }
  };
}
