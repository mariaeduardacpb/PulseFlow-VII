(() => {
  const STORAGE_KEY = 'pf_theme';
  const root = document.documentElement;
  let mediaQuery = null;
  let mediaQueryListener = null;

  // Migrar de 'theme' para 'pf_theme' se necessário (compatibilidade)
  function migrateTheme() {
    const oldTheme = localStorage.getItem('theme');
    if (oldTheme && !localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, oldTheme);
      localStorage.removeItem('theme');
    }
  }

  // Obter a preferência do sistema
  function getSystemPreference() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // Aplicar o tema efetivo (resolvendo 'auto' para 'light' ou 'dark')
  function applyEffectiveTheme(theme) {
    if (theme === 'auto') {
      const systemTheme = getSystemPreference();
      root.setAttribute('data-theme', systemTheme);
      return systemTheme;
    } else {
      root.setAttribute('data-theme', theme);
      return theme;
    }
  }

  // Função principal para aplicar o tema
  function applyTheme(theme) {
    const normalized = ['light', 'dark', 'auto'].includes(theme) ? theme : 'light';
    
    // Remover listener anterior se existir
    if (mediaQueryListener && mediaQuery) {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', mediaQueryListener);
      } else {
        mediaQuery.removeListener(mediaQueryListener);
      }
      mediaQueryListener = null;
      mediaQuery = null;
    }

    // Se for automático, monitorar mudanças do sistema
    if (normalized === 'auto') {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQueryListener = (e) => {
        root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      };
      // Usar addEventListener (suportado em navegadores modernos) ou addListener (fallback)
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', mediaQueryListener);
      } else {
        mediaQuery.addListener(mediaQueryListener);
      }
    }

    // Aplicar o tema
    applyEffectiveTheme(normalized);
    
    // Salvar no localStorage
    localStorage.setItem(STORAGE_KEY, normalized);
  }

  // Obter o tema atual
  function getCurrentTheme() {
    return localStorage.getItem(STORAGE_KEY) || 'light';
  }

  // Sincronizar entre abas
  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY) {
      applyTheme(event.newValue || 'light');
    }
  });

  // Expor funções globalmente
  window.applyTheme = applyTheme;
  window.getCurrentTheme = getCurrentTheme;

  // Inicializar
  migrateTheme();
  applyTheme(getCurrentTheme());
})();





