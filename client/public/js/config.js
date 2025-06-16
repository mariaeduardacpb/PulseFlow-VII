const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:65432'
  : 'https://pulseflow-vii.onrender.com';

const RESET_PASSWORD_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:65432/client/views/reset-password-form.html'
  : 'https://pulseflow-vii.onrender.com/client/views/reset-password-form.html';

export { API_URL, RESET_PASSWORD_URL }; 