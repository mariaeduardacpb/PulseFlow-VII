import { API_URL } from './config.js';

document.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.querySelector(".menu-toggle");
  const sidebar = document.querySelector(".sidebar");

  toggleButton.addEventListener("click", () => {
    sidebar.classList.toggle("active");
    toggleButton.classList.toggle("shifted");
  });

  function mostrarErro(mensagem) {
    const aviso = document.createElement('div');
    aviso.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #ffffff;
      color: #002A42;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 42, 66, 0.1);
      z-index: 1000;
      font-family: 'Montserrat', sans-serif;
      font-size: 14px;
      border: 1px solid #e1e5eb;
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 300px;
      max-width: 400px;
      animation: slideIn 0.3s ease-out;
    `;

    const icon = document.createElement('div');
    icon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #00c3b7;">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    `;

    const textContainer = document.createElement('div');
    textContainer.style.cssText = `
      flex: 1;
      line-height: 1.4;
    `;
    textContainer.textContent = mensagem;

    const closeButton = document.createElement('button');
    closeButton.style.cssText = `
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s;
    `;
    closeButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;
    closeButton.onclick = () => {
      aviso.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        document.body.removeChild(aviso);
        document.head.removeChild(style);
      }, 300);
    };

    aviso.appendChild(icon);
    aviso.appendChild(textContainer);
    aviso.appendChild(closeButton);
    document.body.appendChild(aviso);

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
      if (document.body.contains(aviso)) {
        aviso.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
          if (document.body.contains(aviso)) {
            document.body.removeChild(aviso);
            document.head.removeChild(style);
          }
        }, 300);
      }
    }, 5000);
  }

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
      const prefixo = medico.genero?.toLowerCase() === 'feminino' ? 'Dra.' : 'Dr.';
      const nomeFormatado = `${prefixo} ${medico.nome}`;
      
      const tituloSidebar = document.querySelector('.sidebar .profile h3');
      if (tituloSidebar) {
        tituloSidebar.textContent = nomeFormatado;
      }

      return true;
    } catch (error) {
      console.error("Erro ao carregar dados do médico:", error);
      const fallback = document.querySelector('.sidebar .profile h3');
      if (fallback) fallback.textContent = 'Dr(a). Nome não encontrado';
      mostrarErro("Erro ao carregar dados do médico. Por favor, faça login novamente.");
      return false;
    }
  }

  async function fetchGlicemiaData(month, year) {
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

      const response = await fetch(`${API_URL}/api/diabetes/medico?cpf=${cpf}&month=${month}&year=${year}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tokenMedico}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        mostrarErro("Erro ao buscar dados de glicemia!");
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar dados de glicemia:', error);
      mostrarErro("Erro interno ao buscar dados de glicemia.");
      return null;
    }
  }

  let currentMonth = new Date().getMonth() + 1;
  let currentYear = new Date().getFullYear();

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

  async function loadChartData() {
    const data = await fetchGlicemiaData(currentMonth, currentYear);
    if (!data) return;

    // Atualizar o gráfico com os dados
    updateChart(data);
  }

  // Configurar navegação de mês
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

  function updateChart(data) {
    if (!data || !data.data || data.data.length === 0) {
      document.getElementById('no-data-msg-glicemia').style.display = 'block';
      chartGlicemia.data.datasets[0].data = [];
      chartGlicemia.update('none');
      return;
    }

    document.getElementById('no-data-msg-glicemia').style.display = 'none';

    // Criar pontos de dados com coordenadas x,y
    const pontos = data.data.map(d => ({
      x: d.dia,
      y: d.nivelGlicemia
    }));

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

  // Configurar o gráfico de glicemia
  const ctxGlicemia = document.getElementById('chartGlicemia');
  const chartGlicemia = new Chart(ctxGlicemia, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Glicemia (mg/dL)',
        data: [],
        borderColor: '#00c3b7',
        backgroundColor: 'rgba(0, 195, 183, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#00c3b7',
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
          backgroundColor: 'rgba(0, 42, 66, 0.9)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#00c3b7',
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
            color: 'rgba(0, 42, 66, 0.1)',
            drawBorder: false
          },
          ticks: {
            color: '#002A42',
            font: {
              family: 'Montserrat',
              size: 12
            },
            stepSize: 1
          },
          min: 1,
          max: 31
        },
        y: {
          grid: {
            color: 'rgba(0, 42, 66, 0.1)',
            drawBorder: false
          },
          ticks: {
            color: '#002A42',
            font: {
              family: 'Montserrat',
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

  carregarDadosMedico();
  updateMonthLabel();
  setupMonthNavigation();
  loadChartData();
});