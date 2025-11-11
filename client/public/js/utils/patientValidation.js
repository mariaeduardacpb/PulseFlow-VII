export function hasActivePatient() {
  const pacienteSelecionado = localStorage.getItem('pacienteSelecionado');
  const tokenPaciente = localStorage.getItem('tokenPaciente');
  return !!(pacienteSelecionado && tokenPaciente);
}

export function getActivePatient() {
  try {
    const pacienteSelecionado = localStorage.getItem('pacienteSelecionado');
    if (pacienteSelecionado) {
      return JSON.parse(pacienteSelecionado);
    }
  } catch (error) {
    console.error('Erro ao obter informações do paciente:', error);
  }
  return null;
}

export function getPatientCPF() {
  const paciente = getActivePatient();
  if (paciente?.cpf) {
    return paciente.cpf.replace(/[^\d]/g, '');
  }
  
  const tokenPaciente = localStorage.getItem('tokenPaciente');
  if (tokenPaciente) {
    try {
      const decodedPayload = JSON.parse(atob(tokenPaciente));
      return decodedPayload?.cpf?.replace(/[^\d]/g, '');
    } catch (error) {
      console.error('Erro ao decodificar token do paciente:', error);
    }
  }
  
  return null;
}

export function validateActivePatient() {
  if (!hasActivePatient()) {
    return {
      valid: false,
      error: 'Nenhum paciente selecionado. Por favor, selecione um paciente primeiro.',
      redirect: 'selecao.html'
    };
  }
  
  const paciente = getActivePatient();
  const cpf = getPatientCPF();
  
  if (!paciente || !cpf) {
    return {
      valid: false,
      error: 'Dados do paciente incompletos. Por favor, selecione um paciente novamente.',
      redirect: 'selecao.html'
    };
  }
  
  return {
    valid: true,
    paciente: paciente,
    cpf: cpf
  };
}

export function redirectToPatientSelection(message = null) {
  clearPatientData();
  if (message) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'warning',
        title: 'Atenção',
        text: message,
        confirmButtonText: 'Selecionar Paciente',
        confirmButtonColor: '#002A42'
      }).then(() => {
        window.location.href = 'selecao.html';
      });
    } else {
      alert(message);
      window.location.href = 'selecao.html';
    }
  } else {
    window.location.href = 'selecao.html';
  }
}

export function clearPatientData() {
  localStorage.removeItem('pacienteSelecionado');
  localStorage.removeItem('tokenPaciente');
}

export async function handleApiError(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    if (response.status === 403 && errorData.codigo === 'CONEXAO_INATIVA') {
      clearPatientData();
      const message = errorData.message || 'Acesso negado. Você não tem uma conexão ativa com este paciente. Por favor, solicite acesso novamente.';
      
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'warning',
          title: 'Acesso Revogado',
          text: message,
          confirmButtonText: 'Selecionar Paciente',
          confirmButtonColor: '#002A42'
        }).then(() => {
          window.location.href = 'selecao.html';
        });
      } else {
        alert(message);
        window.location.href = 'selecao.html';
      }
      return true;
    }
  }
  return false;
}

