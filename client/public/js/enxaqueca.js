const API_URL = window.API_URL || 'http://localhost:65432';

document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("chartEnxaqueca");
  
  if (!canvas) {
    return;
  }
  
  const ctx = canvas.getContext("2d");

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  // Elementos de menu foram movidos para componentes de header/sidebar
  // Não precisamos mais gerenciar o toggle aqui
  
  const today = new Date();
  let currentMonthIndex = 9; // Outubro (0-indexed)
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

      const response = await fetch(`${API_URL}/api/enxaqueca/medico?cpf=${cpf}&month=${currentMonthIndex + 1}&year=${currentYear}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tokenMedico}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        mostrarErro("Erro ao buscar dados de enxaqueca!");
        return;
      }

      const data = await response.json();
      updateChart(data);
    } catch (error) {
      console.error('Erro ao buscar dados de enxaqueca:', error);
      mostrarErro("Erro interno ao buscar dados de enxaqueca.");
    }
  }

  function classificarIntensidade(intensidade) {
    const valor = parseInt(intensidade);
    if (valor >= 1 && valor <= 3) {
      return 'Leve';
    } else if (valor >= 4 && valor <= 6) {
      return 'Moderada';
    } else if (valor >= 7 && valor <= 8) {
      return 'Severa';
    } else if (valor >= 9 && valor <= 10) {
      return 'Intolerável';
    } else {
      return 'Desconhecida';
    }
  }

  // Gráfico Chart.js
  const chartEnxaqueca = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: "Intensidade da Enxaqueca",
        data: [],
        borderColor: "#E91E63",
        backgroundColor: "rgba(233, 30, 99, 0.1)",
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
              const raw = context[0].raw;
              const intensidade = raw.intensidade;
              const duracao = raw.duracao;
              const classificacao = classificarIntensidade(intensidade);
              return [
                `Intensidade: ${intensidade}/10`,
                `Classificação: ${classificacao}`,
                `Duração: ${duracao}h`
              ];
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
          max: 10,
          title: { display: true, text: 'Intensidade (0-10)' },
          ticks: { stepSize: 1 }
        }
      }
    }
  });

  // Buscar dados da API
  async function fetchEnxaquecaData(month, year) {
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

      const response = await fetch(`${API_URL}/api/enxaqueca/medico?cpf=${cpf}&month=${month}&year=${year}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tokenMedico}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        mostrarErro("Erro ao buscar dados de enxaqueca!");
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar dados de enxaqueca:', error);
      mostrarErro("Erro interno ao buscar dados de enxaqueca.");
      return null;
    }
  }

  // Carregar e exibir no gráfico
  async function loadChartData() {
    const month = currentMonthIndex + 1; // Converter para 1-indexed
    const data = await fetchEnxaquecaData(month, currentYear);
    if (!data) return;

    // Atualizar o gráfico com os dados
    updateChart(data);
  }

  function updateChart(data) {
    if (!data || !data.data || data.data.length === 0) {
      const noDataMsg = document.getElementById('no-data-msg-enxaqueca');
      if (noDataMsg) {
        noDataMsg.style.display = 'block';
      }
      chartEnxaqueca.data.labels = [];
      chartEnxaqueca.data.datasets[0].data = [];
      chartEnxaqueca.update();
      return;
    }

    const noDataMsg = document.getElementById('no-data-msg-enxaqueca');
    if (noDataMsg) {
      noDataMsg.style.display = 'none';
    }

    // Extrair dias e valores de enxaqueca
    const dias = data.data.map(d => d.dia);
    const valores = data.data.map(d => ({
      x: d.dia,
      y: parseInt(d.intensidade),
      intensidade: d.intensidade,
      duracao: d.duracao
    }));

    // Atualizar dados do gráfico
    chartEnxaqueca.data.labels = dias;
    chartEnxaqueca.data.datasets[0].data = valores;

    // Atualizar o gráfico
    chartEnxaqueca.update();
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
    
    const response = await fetch(`${API_URL}/api/enxaqueca/medico?cpf=${cpf}&month=${currentMonth}&year=${currentYear}`, {
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
      document.getElementById('totalEpisodesCount').textContent = data.data.length;
      
      const intensidades = data.data.map(d => parseFloat(d.intensidade || 0)).filter(i => i > 0);
      const mediaIntensidade = intensidades.length > 0 ? intensidades.reduce((sum, val) => sum + val, 0) / intensidades.length : 0;
      document.getElementById('avgIntensity').textContent = mediaIntensidade.toFixed(1);
      
      const duracoes = data.data.map(d => parseFloat(d.duracao || 0)).filter(d => d > 0);
      const mediaDuracao = duracoes.length > 0 ? duracoes.reduce((sum, val) => sum + val, 0) / duracoes.length : 0;
      document.getElementById('avgDuration').textContent = mediaDuracao.toFixed(1) + 'h';
      
      // Contar crises severas (intensidade >= 7)
      const crisesSeveras = intensidades.filter(i => i >= 7).length;
      document.getElementById('severeEpisodesCount').textContent = crisesSeveras;
    }
  } catch (error) {
    console.error('Erro ao atualizar estatísticas:', error);
  }
}