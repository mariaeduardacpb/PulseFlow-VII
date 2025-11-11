import { API_URL } from '../config.js';

export function initHeaderComponent({ title = '' } = {}) {
  const container = document.getElementById('header-component');
  if (!container) {
    return;
  }

  const heading = title.trim() ? title : 'Painel Clínico';

  container.innerHTML = `
    <header class="app-header">
      <div class="header-left">
        <button type="button" class="menu-toggle" aria-label="Alternar menu" aria-expanded="false">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div class="header-title-group">
          <img class="header-logo" src="/client/public/assets/PulseNegativo.png" alt="PulseFlow">
          <h1 class="header-title">${heading}</h1>
        </div>
      </div>
      <div class="header-right">
        <div class="header-actions">
          <button type="button" class="header-action" aria-label="Notificações" data-action="notifications">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2a6 6 0 0 0-6 6v4l-1.29 1.29A1 1 0 0 0 5.41 15h13.18a1 1 0 0 0 .7-1.71L18 12V8a6 6 0 0 0-6-6zm0 20a3 3 0 0 1-3-3h6a3 3 0 0 1-3 3z" fill="currentColor"/>
            </svg>
          </button>
          <button type="button" class="header-action" aria-label="Agendamentos" data-action="appointments">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1zm12 7H5v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1z" fill="currentColor"/>
              <path d="M9 12h6v2H9zm0 3h4v2H9z" fill="currentColor"/>
            </svg>
          </button>
        </div>
        <button type="button" class="header-logout" id="headerLogoutButton" aria-label="Sair">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10 3a1 1 0 0 0-1 1v3h2V5h8v14h-8v-2H9v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1zm-.707 6.293-1.414 1.414L10.172 14H3v2h7.172l-2.293 2.293 1.414 1.414L15 14z" fill="currentColor"/>
          </svg>
          <span>Sair</span>
        </button>
      </div>
    </header>
  `;

  const menuToggle = container.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');

  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      const isActive = sidebar.classList.toggle('active');
      menuToggle.classList.toggle('shifted', isActive);
      menuToggle.setAttribute('aria-expanded', isActive);
    });

    document.addEventListener('click', (event) => {
      const isClickInsideSidebar = sidebar.contains(event.target);
      const isClickOnToggle = menuToggle.contains(event.target);
      const isClickInsideHeader = container.contains(event.target);

      if (!isClickInsideSidebar && !isClickOnToggle && !isClickInsideHeader && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        menuToggle.classList.remove('shifted');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const actions = [
    { selector: '[data-action="notifications"]', target: '/client/views/notificacoes.html' },
    { selector: '[data-action="appointments"]', target: '/client/views/agendamentos.html' }
  ];

  actions.forEach(action => {
    const button = container.querySelector(action.selector);
    if (button) {
      button.addEventListener('click', () => {
        window.location.href = action.target;
      });
    }
  });

  const logoutButton = container.querySelector('#headerLogoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Sair da conta?',
          text: 'Tem certeza que deseja fazer logout?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#1d4ed8',
          cancelButtonColor: '#64748b',
          confirmButtonText: 'Sim, sair',
          cancelButtonText: 'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            localStorage.removeItem('token');
            localStorage.removeItem('tokenPaciente');
            window.location.href = '/client/views/login.html';
          }
        });
      } else {
        if (confirm('Tem certeza que deseja fazer logout?')) {
          localStorage.removeItem('token');
          localStorage.removeItem('tokenPaciente');
          window.location.href = '/client/views/login.html';
        }
      }
    });
  }

  window.updateHeaderDoctorInfo = function() {};
}

