(() => {
  const STORAGE_KEY = 'pf_theme';
  const root = document.documentElement;

  function applyTheme(theme) {
    const normalized = ['light', 'dark', 'auto'].includes(theme) ? theme : 'light';
    if (normalized === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', normalized);
    }
    localStorage.setItem(STORAGE_KEY, normalized);
  }

  function getCurrentTheme() {
    return localStorage.getItem(STORAGE_KEY) || 'light';
  }

  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY) {
      applyTheme(event.newValue);
    }
  });

  window.applyTheme = applyTheme;
  window.getCurrentTheme = getCurrentTheme;

  applyTheme(getCurrentTheme());
})();




