import { API_URL } from './config.js';

document.addEventListener("DOMContentLoaded", function () {
  const ctx = document.getElementById("chartPressao").getContext("2d");
  const noDataLabel = document.getElementById("no-data-msg-pressao");

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
const toggleButton = document.querySelector(".menu-toggle");
  const sidebar = document.querySelector(".sidebar");

  toggleButton.addEventListener("click", () => {
    sidebar.classList.toggle("active");
    toggleButton.classList.toggle("shifted");
  });
  
  const today = new Date();
  let currentMonthIndex = today.getMonth();
  const currentYear = today.getFullYear();

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

  // 👉 Função de classificação da pressão arterial
  function classificarPressao(sistolica, diastolica) {
    if (sistolica < 130 && diastolica < 85) {
      return "Normal";
    } else if (sistolica >= 130 && sistolica <= 139 && diastolica >= 85 && diastolica <= 89) {
      return "Normal limítrofe";
    } else if (sistolica >= 140 && sistolica <= 159 && diastolica >= 90 && diastolica <= 99) {
      return "Hipertensão leve (estágio 1)";
    } else if (sistolica >= 160 && sistolica <= 179 && diastolica >= 100 && diastolica <= 109) {
      return "Hipertensão moderada (estágio 2)";
    } else if (sistolica >= 180 && diastolica > 110) {
      return "Hipertensão grave (estágio 3)";
    } else if (sistolica >= 140 && diastolica < 90) {
      return "Hipertensão sistólica isolada";
    } else {
      return "Classificação indefinida";
    }
  }

  // 👉 Gráfico Chart.js
  const chartPressao = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: "Pressão Arterial (mmHg)",
        data: [],
        borderColor: "#0a4466",
        backgroundColor: "rgba(10, 68, 102, 0.1)",
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
        spanGaps: true
      }]
    },
    options: {
  responsive: true,
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
          const [sistolica, diastolica] = raw.label?.split('/')?.map(Number) || [null, null];
          if (!sistolica || !diastolica) return ['Pressão: inválida'];
          const classificacao = classificarPressao(sistolica, diastolica);
          return [
            `Pressão: ${sistolica}/${diastolica} mmHg`,
            `Classificação: ${classificacao}`
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
      min: 40,
      max: 200,
      title: { display: true, text: 'Pressão Arterial (mmHg)' },
      ticks: { stepSize: 20 }
    }
  }
}});

  // 👉 Buscar dados da API
  async function fetchPressaoData(month, year) {
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

      const response = await fetch(`${API_URL}/api/pressaoArterial/medico?cpf=${cpf}&month=${month}&year=${year}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tokenMedico}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        mostrarErro("Erro ao buscar dados de pressão arterial!");
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar dados de pressão arterial:', error);
      mostrarErro("Erro interno ao buscar dados de pressão arterial.");
      return null;
    }
  }

  // 👉 Carregar e exibir no gráfico
  async function loadChartData() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const data = await fetchPressaoData(currentMonth, currentYear);
    if (!data) return;

    // Atualizar o gráfico com os dados
    updateChart(data);
  }

  function updateChart(data) {
    // Implementar a lógica de atualização do gráfico aqui
    console.log('Dados recebidos:', data);
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
  carregarDadosMedico();
});
