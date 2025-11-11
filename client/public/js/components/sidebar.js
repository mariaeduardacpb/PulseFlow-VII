const mainLinks = [
  { page: 'perfilpaciente', label: 'Perfil do Paciente', href: 'perfilPaciente.html' },
  { page: 'agendamentos', label: 'Agendamentos', href: 'agendamentos.html' },
  { page: 'notificacoes', label: 'Notificações', href: 'notificacoes.html' },
  { page: 'historicoprontuario', label: 'Registro Clínico', href: 'historicoProntuario.html' },
  { page: 'anexoexame', label: 'Anexo de Exames', href: 'anexoExame.html' },
  { page: 'historicoeventoclinico', label: 'Eventos Clínicos', href: 'historicoEventoClinico.html' },
  { page: 'criaranotacoes', label: 'Anotações Clínicas', href: 'criarAnotações.html' }
];

const reportLinks = [
  { page: 'diabetes', label: 'Relatório de Diabetes', href: 'diabetes.html' },
  { page: 'pressaoarterial', label: 'Pressão Arterial', href: 'pressaoArterial.html' },
  { page: 'historicocrisegastrite', label: 'Crise de Gastrite', href: 'historicoCriseGastrite.html' },
  { page: 'ciclomenstrual', label: 'Ciclo Menstrual', href: 'cicloMenstrual.html' },
  { page: 'hormonal', label: 'Saúde Hormonal', href: 'hormonal.html' },
  { page: 'insonia', label: 'Relatório de Insônia', href: 'insonia.html' },
  { page: 'enxaqueca', label: 'Relatório de Enxaqueca', href: 'enxaqueca.html' }
];

function buildLinks(links, activePage) {
  return links.map(link => {
    const isActive = link.page === activePage ? ' active' : '';
    return `<li><a class="sidebar-link${isActive}" data-page="${link.page}" href="${link.href}">${link.label}</a></li>`;
  }).join('');
}

export function initSidebarComponent(activePage = '') {
  const container = document.getElementById('sidebar-component');
  if (!container) {
    return;
  }

  const normalizedPage = activePage.trim().toLowerCase();
  const mainLinksHtml = buildLinks(mainLinks, normalizedPage);
  const reportLinksHtml = buildLinks(reportLinks, normalizedPage);
  const reportsActive = reportLinks.some(link => link.page === normalizedPage);
  const sectionClass = reportsActive ? 'nav-section active' : 'nav-section';

  container.innerHTML = `
    <aside class="sidebar">
      <div class="profile">
        <div class="profile-info">
          <h3 id="medicoNomeSidebar">Dr(a). Nome</h3>
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

  window.updateSidebarDoctorName = function(name) {
    const sidebarName = container.querySelector('#medicoNomeSidebar');
    if (sidebarName) {
      sidebarName.textContent = name && name.trim() ? name : 'Dr(a). Nome';
    }
  };
}

