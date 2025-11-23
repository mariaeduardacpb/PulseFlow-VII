const API_URL = window.API_URL || 'http://localhost:65432';

document.addEventListener("DOMContentLoaded", function () {
  const canvasHoras = document.getElementById("chartHorasSono");
  
  if (!canvasHoras) {
    return;
  }
  
  const ctxHoras = canvasHoras.getContext("2d");

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  // Elementos de menu foram movidos para componentes de header/sidebar
  // Não precisamos mais gerenciar o toggle aqui
  
  const today = new Date();
  let currentMonthIndex = 8; // Setembro (0-indexed)
  const currentYear = 2025;

  function mostrarErro(mensagem) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = mensagem;
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      z-index: 1000;
      font-family: 'Montserrat', sans-serif;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
  }

  async function carregarDadosMedico() {
    try {
      const tokenMedico = localStorage.getItem('token');
      const tokenPaciente = localStorage.getItem('tokenPaciente');

      if (!tokenMedico || !tokenPaciente) {
        mostrarErro("Sessão expirada. Faça login novamente!");
        return;
      }

      const decodedPayload = JSON.parse(atob(tokenPaciente));
      const cpf = decodedPayload?.cpf?.replace(/[^\d]/g, '');

      if (!cpf) {
        mostrarErro("CPF não encontrado no token do paciente.");
        return;
      }

      const response = await fetch(`${API_URL}/api/insonia/medico?cpf=${cpf}&month=${currentMonthIndex + 1}&year=${currentYear}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tokenMedico}`,
          "Content-Type": "application/json"
        }
      });

      try {
        const { handleApiError } = await import('./utils/patientValidation.js');
        const handled = await handleApiError(response);
        if (handled) {
          return;
        }
      } catch (importError) {
        console.error('Erro ao importar handleApiError:', importError);
      }

      if (!response.ok) {
        mostrarErro("Erro ao buscar dados de sono!");
        return;
      }

      const data = await response.json();
      updateCharts(data);
    } catch (error) {
      console.error('Erro ao buscar dados de sono:', error);
      mostrarErro("Erro interno ao buscar dados de sono.");
    }
  }

  // Gráfico de Horas de Sono
  const chartHorasSono = new Chart(ctxHoras, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: "Horas de Sono",
        data: [],
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
        spanGaps: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1200,
        easing: 'easeOutQuart',
        animations: {
          y: {
            type: 'number',
            easing: 'easeOutBounce',
            from: 0
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          displayColors: false,
          callbacks: {
            title: context => `Dia ${context[0].parsed.x}`,
            label: () => '',
            afterBody: context => {
              const valor = context[0].parsed.y;
              return `Horas de sono: ${valor}h`;
            }
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: 'Dia do Mês' },
          ticks: { precision: 0 }
        },
        y: {
          min: 0,
          max: 12,
          title: { display: true, text: 'Horas de Sono' },
          ticks: { 
            stepSize: 1,
            callback: function(value) {
              return `${value}h`;
            }
          }
        }
      }
    }
  });


  // Buscar dados da API
  async function fetchInsoniaData(month, year) {
    try {
      const tokenMedico = localStorage.getItem('token');
      const tokenPaciente = localStorage.getItem('tokenPaciente');

      if (!tokenMedico || !tokenPaciente) {
        mostrarErro("Sessão expirada. Faça login novamente!");
        return null;
      }

      const decodedPayload = JSON.parse(atob(tokenPaciente));
      const cpf = decodedPayload?.cpf?.replace(/[^\d]/g, '');

      if (!cpf) {
        mostrarErro("CPF não encontrado no token do paciente.");
        return null;
      }

      const response = await fetch(`${API_URL}/api/insonia/medico?cpf=${cpf}&month=${month}&year=${year}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tokenMedico}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        mostrarErro("Erro ao buscar dados de sono!");
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar dados de sono:', error);
      mostrarErro("Erro interno ao buscar dados de sono.");
      return null;
    }
  }

  // Carregar e exibir no gráfico
  async function loadChartData() {
    const month = currentMonthIndex + 1; // Converter para 1-indexed
    const data = await fetchInsoniaData(month, currentYear);
    if (!data) return;

    // Atualizar o gráfico com os dados
    updateCharts(data);
  }

  function updateCharts(data) {
    const noDataMsg = document.getElementById('no-data-msg-horas');
    const chartContainer = document.querySelector('.chart-container');
    
    if (!data || !data.data || data.data.length === 0) {
      // Esconder apenas o container do gráfico quando não houver dados
      if (chartContainer) {
        chartContainer.style.display = 'none';
      }
      if (noDataMsg) {
        noDataMsg.style.display = 'flex';
      }
      // Limpar dados do gráfico
      chartHorasSono.data.labels = [];
      chartHorasSono.data.datasets[0].data = [];
      chartHorasSono.update();
      return;
    }

    // Mostrar o container do gráfico quando houver dados
    if (chartContainer) {
      chartContainer.style.display = 'flex';
    }
    if (noDataMsg) {
      noDataMsg.style.display = 'none';
    }

    // Extrair dias e valores de sono
    const dias = data.data.map(d => d.dia);
    const valoresHoras = data.data.map(d => ({
      x: d.dia,
      y: d.valor
    }));

    // Atualizar dados do gráfico de horas
    chartHorasSono.data.labels = dias;
    chartHorasSono.data.datasets[0].data = valoresHoras;

    // Atualizar o gráfico
    chartHorasSono.update();
  }

  function classificarSono(horas) {
    if (horas >= 7 && horas <= 9) {
      return 'Ideal';
    } else if (horas >= 6 && horas < 7) {
      return 'Adequado';
    } else if (horas > 9) {
      return 'Excessivo';
    } else {
      return 'Insuficiente';
    }
  }

  function updateMonth(change) {
    currentMonthIndex += change;
    if (currentMonthIndex > 11) currentMonthIndex = 0;
    if (currentMonthIndex < 0) currentMonthIndex = 11;

    document.querySelectorAll(".month-label").forEach(el => {
      el.textContent = `${months[currentMonthIndex]} • ${currentYear}`;
    });

    loadChartData();
  }

  document.querySelectorAll(".arrow-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const direction = btn.dataset.direction === "next" ? 1 : -1;
      updateMonth(direction);
    });
  });

  document.querySelectorAll(".month-label").forEach(el => {
    el.textContent = `${months[currentMonthIndex]} • ${currentYear}`;
  });

  // Inicializar estado: ocultar gráfico até que dados sejam carregados
  const chartContainer = document.querySelector('.chart-container');
  if (chartContainer) {
    chartContainer.style.display = 'none';
  }

  loadChartData();
  atualizarEstatisticas();
});

// Função para atualizar estatísticas
async function atualizarEstatisticas() {
  try {
    const tokenMedico = localStorage.getItem('token');
    const tokenPaciente = localStorage.getItem('tokenPaciente');

    if (!tokenMedico || !tokenPaciente) {
      return;
    }

    const decodedPayload = JSON.parse(atob(tokenPaciente));
    const cpf = decodedPayload?.cpf?.replace(/[^\d]/g, '');

    if (!cpf) {
      return;
    }

    // Buscar dados do mês atual
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const response = await fetch(`${API_URL}/api/insonia/medico?cpf=${cpf}&month=${currentMonth}&year=${currentYear}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tokenMedico}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      return;
    }

    const data = await response.json();
    
    if (data && data.data && data.data.length > 0) {
      // Atualizar estatísticas
      document.getElementById('totalRecordsCount').textContent = data.data.length;
      
      const horasSono = data.data.map(d => parseFloat(d.horasSono || d.valor || 0)).filter(h => h > 0);
      const mediaHoras = horasSono.length > 0 ? horasSono.reduce((sum, val) => sum + val, 0) / horasSono.length : 0;
      document.getElementById('avgSleepHours').textContent = mediaHoras.toFixed(1);
    }
  } catch (error) {
    console.error('Erro ao atualizar estatísticas:', error);
  }
}