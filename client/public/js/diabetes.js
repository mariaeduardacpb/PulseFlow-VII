import { validateActivePatient, redirectToPatientSelection, handleApiError } from './utils/patientValidation.js';

// Configuração da API
const API_URL = window.API_URL || 'http://localhost:65432';

document.addEventListener("DOMContentLoaded", async () => {
  console.log('Página de diabetes carregada, iniciando...');
  
  const validation = validateActivePatient();
  if (!validation.valid) {
    redirectToPatientSelection(validation.error);
    return;
  }
  
  await carregarDadosMedico();
  await inicializarPagina();
});

// Função para mostrar erro
function mostrarErro(mensagem) {
  Swal.fire({
    icon: 'error',
    title: 'Erro',
    text: mensagem,
    confirmButtonText: 'OK',
    confirmButtonColor: '#3b82f6',
    customClass: {
      popup: 'swal-popup',
      title: 'swal-title',
      content: 'swal-content'
    }
  });
}

// Função para mostrar sucesso
function mostrarSucesso(mensagem) {
  Swal.fire({
    icon: 'success',
    title: 'Sucesso',
    text: mensagem,
    confirmButtonText: 'OK',
    confirmButtonColor: '#3b82f6',
    customClass: {
      popup: 'swal-popup',
      title: 'swal-title',
      content: 'swal-content'
    }
  });
}

// Função para carregar dados do médico
async function carregarDadosMedico() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado. Por favor, faça login novamente.');
    }

    const res = await fetch(`${API_URL}/api/usuarios/perfil`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Erro ao carregar dados do médico');
    }

    const medico = await res.json();
    console.log('Dados do médico carregados:', medico);
    
    // Atualizar nome do médico no sidebar se disponível
    if (typeof window.atualizarNomeMedico === 'function') {
      window.atualizarNomeMedico(medico);
    }

    return true;
  } catch (error) {
    console.error("Erro ao carregar dados do médico:", error);
    mostrarErro("Erro ao carregar dados do médico. Por favor, faça login novamente.");
    return false;
  }
}

// Função para buscar dados de glicemia
async function fetchGlicemiaData(month, year) {
  try {
    const tokenMedico = localStorage.getItem('token');
    
    // Verificar múltiplas chaves possíveis para o paciente
    let selectedPatient = localStorage.getItem('selectedPatient') || 
                         localStorage.getItem('pacienteSelecionado') || 
                         localStorage.getItem('selectedPatientData');
    
    if (!tokenMedico) {
      mostrarErro("Sessão expirada. Faça login novamente!");
      return null;
    }

    if (!selectedPatient) {
      console.log('Chaves disponíveis no localStorage:', Object.keys(localStorage));
      mostrarErro("Nenhum paciente selecionado. Por favor, selecione um paciente primeiro.");
      return null;
    }

    let paciente;
    try {
      paciente = JSON.parse(selectedPatient);
    } catch (parseError) {
      console.error('Erro ao fazer parse do paciente:', parseError);
      mostrarErro("Erro ao processar dados do paciente selecionado.");
      return null;
    }

    const cpf = paciente.cpf?.replace(/[^\d]/g, '');

    if (!cpf) {
      console.log('Dados do paciente:', paciente);
      mostrarErro("CPF não encontrado no paciente selecionado.");
      return null;
    }

    console.log(`Buscando dados de glicemia para CPF: ${cpf}, Mês: ${month}, Ano: ${year}`);

    const response = await fetch(`${API_URL}/api/diabetes/medico?cpf=${cpf}&month=${month}&year=${year}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tokenMedico}`,
        "Content-Type": "application/json"
      }
    });

    const handled = await handleApiError(response);
    if (handled) {
      return null;
    }

    if (!response.ok) {
      if (response.status === 404) {
        console.log('Nenhum dado de glicemia encontrado para este período');
        return { data: [], stats: { total: 0, media: 0, normais: 0 } };
      }
      mostrarErro("Erro ao buscar dados de glicemia!");
      return null;
    }

    const data = await response.json();
    console.log('Dados de glicemia recebidos:', data);
    return data;
  } catch (error) {
    console.error('Erro ao buscar dados de glicemia:', error);
    mostrarErro("Erro interno ao buscar dados de glicemia.");
    return null;
  }
}

// Variáveis globais
let currentMonth = new Date().getMonth() + 1;
let currentYear = new Date().getFullYear();
let chartGlicemia = null;

// Função para atualizar label do mês
function updateMonthLabel() {
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const monthLabel = document.querySelector('.month-label');
  if (monthLabel) {
    monthLabel.textContent = `${monthNames[currentMonth - 1]} • ${currentYear}`;
  }
}

// Função para atualizar estatísticas
function updateStats(data) {
  const stats = data.stats || {};
  
  const totalElement = document.getElementById('totalReadingsCount');
  const avgElement = document.getElementById('avgGlucoseLevel');
  const normalElement = document.getElementById('normalReadingsCount');
  
  if (totalElement) {
    totalElement.textContent = stats.total || 0;
  }
  
  if (avgElement) {
    avgElement.textContent = stats.media ? `${stats.media.toFixed(1)} mg/dL` : '0 mg/dL';
  }
  
  if (normalElement) {
    normalElement.textContent = stats.normais || 0;
  }
}

// Função para carregar dados do gráfico
async function loadChartData() {
  const data = await fetchGlicemiaData(currentMonth, currentYear);
  if (!data) return;

  // Atualizar estatísticas
  updateStats(data);
  
  // Atualizar o gráfico com os dados
  updateChart(data);
}

// Função para configurar navegação de mês
function setupMonthNavigation() {
  const prevBtn = document.querySelector('[data-direction="prev"]');
  const nextBtn = document.querySelector('[data-direction="next"]');

  if (prevBtn) {
    prevBtn.addEventListener('click', async () => {
      currentMonth--;
      if (currentMonth < 1) {
        currentMonth = 12;
        currentYear--;
      }
      updateMonthLabel();
      await loadChartData();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', async () => {
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
      updateMonthLabel();
      await loadChartData();
    });
  }
}

// Função para atualizar gráfico
function updateChart(data) {
  const chartContainer = document.querySelector('.chart-container');
  const noDataMsg = document.getElementById('no-data-msg-glicemia');
  
  if (!data || !data.data || data.data.length === 0) {
    // Esconder apenas o container do gráfico quando não houver dados
    if (chartContainer) {
      chartContainer.style.display = 'none';
    }
    if (noDataMsg) {
      noDataMsg.style.display = 'flex';
    }
    if (chartGlicemia) {
      chartGlicemia.data.datasets[0].data = [];
      chartGlicemia.update('none');
    }
    return;
  }

  // Mostrar o container do gráfico quando houver dados
  if (chartContainer) {
    chartContainer.style.display = 'flex';
  }
  if (noDataMsg) {
    noDataMsg.style.display = 'none';
  }

  // Criar pontos de dados com coordenadas x,y
  const pontos = data.data.map(d => ({
    x: d.dia,
    y: d.nivelGlicemia
  }));

  if (chartGlicemia) {
    // Verificar se os dados são diferentes antes de atualizar
    const currentData = chartGlicemia.data.datasets[0].data;
    const dataChanged = JSON.stringify(currentData) !== JSON.stringify(pontos);

    if (dataChanged) {
      // Atualizar dados do gráfico
      chartGlicemia.data.datasets[0].data = pontos;
      // Atualizar o gráfico sem animação
      chartGlicemia.update('none');
    }
  }
}

// Função para inicializar gráfico
function initializeChart() {
  const ctxGlicemia = document.getElementById('chartGlicemia');
  if (!ctxGlicemia) return;

  chartGlicemia = new Chart(ctxGlicemia, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Glicemia (mg/dL)',
        data: [],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        spanGaps: false,
        clip: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 0
      },
      layout: {
        padding: {
          top: 10,
          bottom: 10,
          left: 10,
          right: 10
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(30, 41, 59, 0.9)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#3b82f6',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            title: function(context) {
              return `Dia ${context[0].label}`;
            },
            label: function(context) {
              return `${context.parsed.y} mg/dL`;
            }
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          grid: {
            color: 'rgba(30, 41, 59, 0.1)',
            drawBorder: false
          },
          ticks: {
            color: '#1e293b',
            font: {
              family: 'Inter',
              size: 12
            },
            stepSize: 1
          },
          min: 1,
          max: 31
        },
        y: {
          grid: {
            color: 'rgba(30, 41, 59, 0.1)',
            drawBorder: false
          },
          ticks: {
            color: '#1e293b',
            font: {
              family: 'Inter',
              size: 12
            },
            callback: function(value) {
              return `${value} mg/dL`;
            }
          },
          min: 0,
          max: 200,
          beginAtZero: true
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  });
}

// Função para inicializar página
async function inicializarPagina() {
  try {
    console.log('Inicializando página de diabetes...');
    
    // Inicializar gráfico
    initializeChart();
    
    // Configurar navegação de mês
    setupMonthNavigation();
    
    // Atualizar label do mês
    updateMonthLabel();
    
    // Carregar dados iniciais
    await loadChartData();
    
    console.log('Página de diabetes inicializada com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar página:', error);
    mostrarErro('Erro ao inicializar página de diabetes');
  }
}

// Função global para debug
window.debugDiabetes = function() {
  console.log('=== DEBUG DIABETES ===');
  console.log('Mês atual:', currentMonth);
  console.log('Ano atual:', currentYear);
  console.log('Token médico:', localStorage.getItem('token') ? 'Presente' : 'Ausente');
  console.log('Gráfico inicializado:', chartGlicemia ? 'Sim' : 'Não');
  
  console.log('\n=== LOCALSTORAGE ===');
  console.log('Todas as chaves:', Object.keys(localStorage));
  console.log('selectedPatient:', localStorage.getItem('selectedPatient'));
  console.log('pacienteSelecionado:', localStorage.getItem('pacienteSelecionado'));
  console.log('selectedPatientData:', localStorage.getItem('selectedPatientData'));
  
  // Tentar encontrar dados do paciente
  const possibleKeys = ['selectedPatient', 'pacienteSelecionado', 'selectedPatientData'];
  for (const key of possibleKeys) {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        const parsed = JSON.parse(value);
        console.log(`Dados do paciente (${key}):`, parsed);
        if (parsed.cpf) {
          console.log(`CPF encontrado: ${parsed.cpf}`);
        }
      } catch (e) {
        console.log(`Erro ao fazer parse de ${key}:`, e);
      }
    }
  }
  
  console.log('\n=== TESTE DE CARREGAMENTO ===');
  loadChartData().then(() => {
    console.log('Dados carregados com sucesso');
  }).catch((error) => {
    console.error('Erro ao carregar dados:', error);
  });
};

// Função para simular paciente (apenas para teste)
window.simularPaciente = function() {
  const pacienteTeste = {
    id: "68a3b77a5b36b8a11580651f",
    nome: "Manuela Tagliatti",
    cpf: "512.320.568-39",
    email: "manuellatagliatti@gmail.com",
    genero: "Feminino",
    dataNascimento: "2002-10-19T00:00:00.000",
    nacionalidade: "Brasileiro",
    telefone: "(19) 98443-6637"
  };
  
  localStorage.setItem('selectedPatient', JSON.stringify(pacienteTeste));
  console.log('Paciente simulado salvo:', pacienteTeste);
  
  // Recarregar dados
  loadChartData().then(() => {
    console.log('Dados recarregados com paciente simulado');
  }).catch((error) => {
    console.error('Erro ao recarregar dados:', error);
  });
};