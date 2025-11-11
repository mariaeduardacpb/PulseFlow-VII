import { initHeaderComponent } from '/client/public/js/components/header.js';
import { initDoctorSidebar } from '/client/public/js/components/sidebarDoctor.js';
import { API_URL } from '/client/public/js/config.js';

const selectors = {
  editModal: '#editModal',
  editForm: '#editForm',
  editLabel: '#editLabel',
  editInput: '#editInput',
  editError: '#editError',
  changePasswordModal: '#changePasswordModal',
  changePasswordForm: '#changePasswordForm',
  currentPassword: '#currentPassword',
  newPassword: '#newPassword',
  confirmPassword: '#confirmPassword'
};

function toggleModal(modalId, visible) {
  const modal = document.querySelector(modalId);
  if (!modal) return;
  if (visible) {
    modal.classList.add('visible');
  } else {
    modal.classList.remove('visible');
  }
}

function bindModals() {
  const editProfileBtn = document.getElementById('editProfileBtn');
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  const closeEditBtn = document.getElementById('closeModal');
  const cancelEditBtn = document.getElementById('cancelEdit');
  const closePasswordBtn = document.getElementById('closePasswordModal');
  const cancelPasswordBtn = document.getElementById('cancelPassword');

  editProfileBtn?.addEventListener('click', () => {
    window.location.href = '/client/views/perfilMedico.html';
  });

  changePasswordBtn?.addEventListener('click', () => {
    toggleModal(selectors.changePasswordModal, true);
  });

  [closePasswordBtn, cancelPasswordBtn].forEach(el =>
    el?.addEventListener('click', () => toggleModal(selectors.changePasswordModal, false))
  );

  document.querySelector(selectors.changePasswordForm)?.addEventListener('submit', async event => {
    event.preventDefault();
    const current = document.querySelector(selectors.currentPassword);
    const next = document.querySelector(selectors.newPassword);
    const confirm = document.querySelector(selectors.confirmPassword);
    const errors = {
      current: document.getElementById('currentPasswordError'),
      next: document.getElementById('newPasswordError'),
      confirm: document.getElementById('confirmPasswordError')
    };

    errors.current.textContent = '';
    errors.next.textContent = '';
    errors.confirm.textContent = '';

    if (!current.value.trim()) {
      errors.current.textContent = 'Informe sua senha atual.';
      return;
    }

    if (next.value.length < 6) {
      errors.next.textContent = 'A nova senha deve ter ao menos 6 caracteres.';
      return;
    }

    if (next.value !== confirm.value) {
      errors.confirm.textContent = 'As senhas não coincidem.';
      return;
    }

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Alterando...';

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          senhaAtual: current.value,
          senha: next.value
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Erro ao alterar senha');
      }

      toggleModal(selectors.changePasswordModal, false);
      current.value = '';
      next.value = '';
      confirm.value = '';

      await Swal.fire({
        icon: 'success',
        title: 'Senha atualizada',
        text: 'Sua senha foi alterada com sucesso.',
        confirmButtonColor: '#002A42'
      });
    } catch (error) {
      errors.current.textContent = error.message || 'Erro ao alterar senha. Tente novamente.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

function loadPreferences() {
  const preferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');
  
  const twoFactorToggle = document.getElementById('twoFactorToggle');
  const emailToggle = document.getElementById('emailNotificationsToggle');
  const pushToggle = document.getElementById('pushNotificationsToggle');

  if (twoFactorToggle) {
    twoFactorToggle.checked = preferences.twoFactorEnabled || false;
    const twoFactorLabel = document.getElementById('twoFactorLabel');
    if (twoFactorLabel) {
      twoFactorLabel.textContent = twoFactorToggle.checked ? 'Ativado' : 'Desativado';
    }
  }

  if (emailToggle) {
    emailToggle.checked = preferences.emailNotifications !== false;
    const emailLabel = document.getElementById('emailNotificationsLabel');
    if (emailLabel) {
      emailLabel.textContent = emailToggle.checked
        ? 'Receber notificações importantes'
        : 'Não receber notificações por email';
    }
  }

  if (pushToggle) {
    pushToggle.checked = preferences.pushNotifications !== false;
    const pushLabel = document.getElementById('pushNotificationsLabel');
    if (pushLabel) {
      pushLabel.textContent = pushToggle.checked
        ? 'Receber notificações em tempo real'
        : 'Não receber notificações push';
    }
  }
}

function savePreferences(preferences) {
  const current = JSON.parse(localStorage.getItem('userPreferences') || '{}');
  const updated = { ...current, ...preferences };
  localStorage.setItem('userPreferences', JSON.stringify(updated));
}

function bindToggles() {
  const twoFactorToggle = document.getElementById('twoFactorToggle');
  const emailToggle = document.getElementById('emailNotificationsToggle');
  const pushToggle = document.getElementById('pushNotificationsToggle');

  twoFactorToggle?.addEventListener('change', event => {
    const label = document.getElementById('twoFactorLabel');
    label.textContent = event.target.checked ? 'Ativado' : 'Desativado';
    savePreferences({ twoFactorEnabled: event.target.checked });
  });

  emailToggle?.addEventListener('change', event => {
    const label = document.getElementById('emailNotificationsLabel');
    label.textContent = event.target.checked
      ? 'Receber notificações importantes'
      : 'Não receber notificações por email';
    savePreferences({ emailNotifications: event.target.checked });
  });

  pushToggle?.addEventListener('change', event => {
    const label = document.getElementById('pushNotificationsLabel');
    label.textContent = event.target.checked
      ? 'Receber notificações em tempo real'
      : 'Não receber notificações push';
    savePreferences({ pushNotifications: event.target.checked });
  });

  loadPreferences();
}

function bindThemeSelect() {
  const select = document.getElementById('themeSelect');
  const display = document.getElementById('themeDisplay');

  if (!select || !display) {
    return;
  }

  const savedTheme = localStorage.getItem('theme') || 'light';
  const currentTheme = typeof window.getCurrentTheme === 'function' ? window.getCurrentTheme() : savedTheme;
  select.value = currentTheme;
  display.textContent = currentTheme === 'dark' ? 'Escuro' : currentTheme === 'auto' ? 'Automático' : 'Claro';

  select.addEventListener('change', event => {
    const value = event.target.value;
    const label = value === 'dark' ? 'Escuro' : value === 'auto' ? 'Automático' : 'Claro';
    display.textContent = label;
    localStorage.setItem('theme', value);
    if (typeof window.applyTheme === 'function') {
      window.applyTheme(value);
    }
  });
}

async function ensureProfile() {
  const token = localStorage.getItem('token');
  if (!token) {
    await Swal.fire({
      title: 'Erro',
      text: 'Você precisa estar logado para acessar esta página',
      icon: 'error',
      confirmButtonText: 'Ir para Login',
      confirmButtonColor: '#002A42'
    });
    window.location.href = '/client/views/login.html';
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/api/usuarios/perfil`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Falha ao carregar dados do usuário.');
    }

    const data = await response.json();
    document.getElementById('userNameDisplay').textContent = data.nome ?? '—';
    document.getElementById('userEmailDisplay').textContent = data.email ?? '—';

    // Atualiza o sidebar do médico (mesmo quando há paciente ativo, o nome do médico deve aparecer)
    if (window.updateDoctorSidebarInfo) {
      window.updateDoctorSidebarInfo(data.nome, data.areaAtuacao, data.genero);
    }

    return data;
  } catch (error) {
    await Swal.fire({
      title: 'Erro',
      text: 'Não foi possível carregar suas informações. Faça login novamente.',
      icon: 'error',
      confirmButtonText: 'Ir para Login',
      confirmButtonColor: '#002A42'
    });
    localStorage.removeItem('token');
    window.location.href = '/client/views/login.html';
    return null;
  }
}

function bindPasswordToggles() {
  document.querySelectorAll('.password-toggle').forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-target');
      const input = document.getElementById(targetId);
      const icon = button.querySelector('i');
      
      if (input && icon) {
        if (input.type === 'password') {
          input.type = 'text';
          icon.classList.remove('fa-eye');
          icon.classList.add('fa-eye-slash');
        } else {
          input.type = 'password';
          icon.classList.remove('fa-eye-slash');
          icon.classList.add('fa-eye');
        }
      }
    });
  });
}

function bindDeleteAccount() {
  const deleteBtn = document.getElementById('deleteAccountBtn');
  
  deleteBtn?.addEventListener('click', async () => {
    const result = await Swal.fire({
      title: 'Excluir conta?',
      text: 'Esta ação é permanente e não pode ser desfeita. Todos os seus dados serão removidos.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sim, excluir conta',
      cancelButtonText: 'Cancelar',
      input: 'password',
      inputPlaceholder: 'Digite sua senha para confirmar',
      inputValidator: (value) => {
        if (!value) {
          return 'Você precisa digitar sua senha para confirmar';
        }
      }
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/auth/delete-account`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            senha: result.value
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || data.message || 'Erro ao excluir conta');
        }

        await Swal.fire({
          icon: 'success',
          title: 'Conta excluída',
          text: 'Sua conta foi excluída com sucesso.',
          confirmButtonColor: '#002A42'
        });

        localStorage.clear();
        window.location.href = '/client/views/login.html';
      } catch (error) {
        await Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: error.message || 'Não foi possível excluir a conta. Verifique sua senha e tente novamente.',
          confirmButtonColor: '#002A42'
        });
      }
    }
  });
}

async function init() {
  initHeaderComponent({ title: 'Configurações' });
  initDoctorSidebar('configuracoes');

  const toggleButton = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');

  toggleButton?.addEventListener('click', () => {
    sidebar?.classList.toggle('active');
    toggleButton.classList.toggle('shifted');
  });

  bindModals();
  bindToggles();
  bindThemeSelect();
  bindPasswordToggles();
  bindDeleteAccount();
  await ensureProfile();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

