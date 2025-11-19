import { API_URL } from '../config.js';
import { hasActivePatient, getPatientCPF, clearPatientData } from './patientValidation.js';

let connectionCheckInterval = null;
let isChecking = false;

export function startConnectionMonitoring(intervalSeconds = 5) {
  if (connectionCheckInterval) {
    stopConnectionMonitoring();
  }

  if (!hasActivePatient()) {
    return;
  }

  const checkConnection = async () => {
    if (isChecking) {
      return;
    }

    if (!hasActivePatient()) {
      stopConnectionMonitoring();
      return;
    }

    isChecking = true;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        stopConnectionMonitoring();
        return;
      }

      const cpf = getPatientCPF();
      if (!cpf) {
        stopConnectionMonitoring();
        return;
      }

      const response = await fetch(`${API_URL}/api/pacientes/verificar-conexao/${cpf}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 403 || errorData.codigo === 'CONEXAO_INATIVA') {
          handleConnectionLost();
          return;
        }
      }

      const data = await response.json();
      if (!data.conectado) {
        handleConnectionLost();
        return;
      }
    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
    } finally {
      isChecking = false;
    }
  };

  checkConnection();
  connectionCheckInterval = setInterval(checkConnection, intervalSeconds * 1000);
}

export function stopConnectionMonitoring() {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
    connectionCheckInterval = null;
  }
  isChecking = false;
}

function handleConnectionLost() {
  stopConnectionMonitoring();
  clearPatientData();

  const message = 'Acesso revogado. O paciente desconectou você. Por favor, solicite acesso novamente.';

  if (typeof Swal !== 'undefined') {
    Swal.fire({
      icon: 'warning',
      title: 'Acesso Revogado',
      text: message,
      confirmButtonText: 'Selecionar Paciente',
      confirmButtonColor: '#002A42',
      allowOutsideClick: false,
      allowEscapeKey: false
    }).then(() => {
      window.location.href = 'selecao.html';
    });
  } else {
    alert(message);
    window.location.href = 'selecao.html';
  }
}




