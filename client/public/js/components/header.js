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
            <i class="far fa-bell"></i>
          </button>
          <button type="button" class="header-action" aria-label="Agendamentos" data-action="appointments">
            <i class="far fa-calendar"></i>
          </button>
        </div>
        <button type="button" class="header-logout" id="headerLogoutButton" aria-label="Sair">
          <i class="fas fa-power-off"></i>
          <span>Sair</span>
        </button>
      </div>
    </header>
  `;

  let overlay = document.querySelector('.sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
  }

  const menuToggle = container.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');

  function toggleSidebar() {
    const isActive = sidebar.classList.toggle('active');
    menuToggle.classList.toggle('shifted', isActive);
    menuToggle.setAttribute('aria-expanded', isActive);
    
    if (window.innerWidth <= 1024) {
      if (isActive) {
        overlay.classList.add('active');
        document.body.classList.add('sidebar-open');
      } else {
        overlay.classList.remove('active');
        document.body.classList.remove('sidebar-open');
      }
    }
  }

  function closeSidebar() {
    sidebar.classList.remove('active');
    menuToggle.classList.remove('shifted');
    menuToggle.setAttribute('aria-expanded', 'false');
    overlay.classList.remove('active');
    document.body.classList.remove('sidebar-open');
  }

  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', toggleSidebar);

    overlay.addEventListener('click', closeSidebar);

    document.addEventListener('click', (event) => {
      const isClickInsideSidebar = sidebar.contains(event.target);
      const isClickOnToggle = menuToggle.contains(event.target);
      const isClickInsideHeader = container.contains(event.target);

      if (!isClickInsideSidebar && !isClickOnToggle && !isClickInsideHeader && sidebar.classList.contains('active') && window.innerWidth <= 1024) {
        closeSidebar();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024) {
        sidebar.classList.add('active');
        overlay.classList.remove('active');
        document.body.classList.remove('sidebar-open');
      } else if (window.innerWidth <= 1024 && !sidebar.classList.contains('active')) {
        overlay.classList.remove('active');
        document.body.classList.remove('sidebar-open');
      }
    });

    if (window.innerWidth > 1024) {
      sidebar.classList.add('active');
    }
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

