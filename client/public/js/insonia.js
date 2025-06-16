import { API_URL } from './config.js';

document.addEventListener("DOMContentLoaded", async () => {
  const ctx1 = document.getElementById('chartHorasSono').getContext('2d');
  const ctx2 = document.getElementById('chartQualidadeSono').getContext('2d');
  const noDataLabelHoras = document.getElementById('no-data-msg-horas');
  const noDataLabelQualidade = document.getElementById('no-data-msg-qualidade');

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const today = new Date();
  let currentMonthIndex = today.getMonth();
  const currentYear = today.getFullYear();
  
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
        mostrarErro("Erro ao buscar dados de insônia!");
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar dados de insônia:', error);
      mostrarErro("Erro interno ao buscar dados de insônia.");
      return null;
    }
  }

  const chartHorasSono = new Chart(ctx1, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Horas de Sono',
        data: [],
        fill: true,
        borderColor: '#0a4466',
        backgroundColor: 'rgba(10, 68, 102, 0.1)',
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            // Título customizado → "Dia X"
            title: function (context) {
              return `Dia ${context[0].label}`;
            },
            // Conteúdo → "Horas de Sono: 10h 45min"
            label: function (context) {
              const horasDecimais = context.raw;
              const horas = Math.floor(horasDecimais);
              const minutos = Math.round((horasDecimais - horas) * 60);
              return `Horas de Sono: ${horas}h${minutos > 0 ? ` ${minutos}min` : ''}`;
            }
          },
          displayColors: false 
        }
      },
      scales: {
        y: {
          min: 0,
          max: 16,
          ticks: {
            stepSize: 2,
            callback: val => `${val}h`
          }
        }
      }
    }
  });  

  const chartQualidadeSono = new Chart(ctx2, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Qualidade do Sono',
        data: [],
        fill: true,
        borderColor: '#0a4466',
        backgroundColor: 'rgba(10, 68, 102, 0.1)',
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: function (context) {
              return `Dia ${context[0].label}`;
            },
            label: function (context) {
              const nota = context.raw;
              let categoria = '';
              if (nota <= 60) categoria = 'Ruim';
              else if (nota <= 79) categoria = 'Médio';
              else if (nota <= 89) categoria = 'Bom';
              else categoria = 'Excelente';
              return [`Nota: ${nota}`, `Qualidade: ${categoria}`];
            }
          },
          displayColors: false
        }
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 10,
            callback: function (val) {
              if (val === 100) return 'Excelente';
              if (val === 90) return 'Bom';
              if (val === 80) return 'Médio';
              if (val === 60) return 'Ruim';
              return '';
            }
          }
        }
      }
      
    }
  });  
  
  async function loadChartData() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const data = await fetchInsoniaData(currentMonth, currentYear);
    if (!data) return;

    // Atualizar o gráfico com os dados
    updateChart(data);
  }

  function updateChart(data) {
    // Implementar a lógica de atualização do gráfico aqui
    console.log('Dados de insônia recebidos:', data);
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

  carregarDadosMedico();
  loadChartData();
});
