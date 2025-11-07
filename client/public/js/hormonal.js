const API_URL = window.API_URL || 'http://localhost:65432';

document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("chartHormonal");
  
  if (!canvas) {
    return;
  }
  
  const ctx = canvas.getContext("2d");
  const noDataLabel = document.getElementById("no-data-msg-hormonal");

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Elementos de menu foram movidos para componentes de header/sidebar
  // Não precisamos mais gerenciar o toggle aqui
  
  const today = new Date();
  let currentMonthIndex = 5; // Junho (0-indexed)
  const currentYear = 2025;

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
      console.log('Dados do médico carregados:', medico);

      return true;
    } catch (error) {
      console.error("Erro ao carregar dados do médico:", error);
      mostrarErro("Erro ao carregar dados do médico. Por favor, faça login novamente.");
      return false;
    }
  }

  // Função para classificar níveis hormonais
  function classificarHormonio(hormonio, valor) {
    const classificacoes = {
      'Estrôgenio': {
        normal: { min: 30, max: 400 },
        baixo: { min: 0, max: 29 },
        alto: { min: 401, max: 1000 }
      },
      'Progesterona': {
        normal: { min: 0.1, max: 25 },
        baixo: { min: 0, max: 0.09 },
        alto: { min: 26, max: 100 }
      },
      'Testosterona': {
        normal: { min: 300, max: 1000 },
        baixo: { min: 0, max: 299 },
        alto: { min: 1001, max: 2000 }
      },
      'Cortisol': {
        normal: { min: 10, max: 20 },
        baixo: { min: 0, max: 9 },
        alto: { min: 21, max: 50 }
      }
    };

    const classificacao = classificacoes[hormonio];
    if (!classificacao) return 'Classificação não disponível';

    if (valor >= classificacao.normal.min && valor <= classificacao.normal.max) {
      return 'Normal';
    } else if (valor >= classificacao.baixo.min && valor <= classificacao.baixo.max) {
      return 'Baixo';
    } else if (valor >= classificacao.alto.min && valor <= classificacao.alto.max) {
      return 'Alto';
    } else {
      return 'Fora do range';
    }
  }

  // Gráfico Chart.js
  const chartHormonal = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: "Níveis Hormonais",
        data: [],
        borderColor: "#667eea",
        backgroundColor: "rgba(102, 126, 234, 0.1)",
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: "#667eea",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        fill: true,
        spanGaps: true,
        pointHoverBackgroundColor: "#764ba2",
        pointHoverBorderColor: "#ffffff",
        pointHoverBorderWidth: 3
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
              const [hormonio, valor] = raw.label?.split(': ') || [null, null];
              if (!hormonio || !valor) return ['Hormônio: inválido'];
              const classificacao = classificarHormonio(hormonio, parseFloat(valor));
              return [
                `Hormônio: ${hormonio}`,
                `Valor: ${valor}`,
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
          min: 0,
          title: { display: true, text: 'Valor Hormonal' },
          ticks: { stepSize: 50 }
        }
      }
    }
  });

  // Buscar dados da API
  async function fetchHormonalData(month, year) {
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

      const response = await fetch(`${API_URL}/api/hormonal/medico?cpf=${cpf}&month=${month}&year=${year}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tokenMedico}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        mostrarErro("Erro ao buscar dados hormonais!");
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar dados hormonais:', error);
      mostrarErro("Erro interno ao buscar dados hormonais.");
      return null;
    }
  }

  // Carregar e exibir no gráfico
  async function loadChartData() {
    const month = currentMonthIndex + 1; // Converter para 1-indexed
    const data = await fetchHormonalData(month, currentYear);
    if (!data) return;

    // Atualizar o gráfico com os dados
    updateChart(data);
  }

  function updateChart(data) {
    if (!data || !data.data || data.data.length === 0) {
      if (noDataLabel) {
        noDataLabel.style.display = 'block';
      }
      chartHormonal.data.labels = [];
      chartHormonal.data.datasets[0].data = [];
      chartHormonal.update();
      return;
    }

    if (noDataLabel) {
      noDataLabel.style.display = 'none';
    }

    // Extrair dias e valores hormonais
    const dias = data.data.map(d => d.dia);
    const valores = data.data.map(d => ({
      x: d.dia,
      y: d.valor,
      label: `${d.hormonio}: ${d.valor}`
    }));

    // Atualizar dados do gráfico
    chartHormonal.data.labels = dias;
    chartHormonal.data.datasets[0].data = valores;

    // Atualizar o gráfico
    chartHormonal.update();
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
    
    const response = await fetch(`${API_URL}/api/hormonal/medico?cpf=${cpf}&month=${currentMonth}&year=${currentYear}`, {
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
      document.getElementById('totalReadingsCount').textContent = data.data.length;
      
      const valores = data.data.map(d => parseFloat(d.valor));
      const media = valores.reduce((sum, val) => sum + val, 0) / valores.length;
      document.getElementById('avgHormonalLevel').textContent = media.toFixed(1);
      
      // Contar leituras normais (assumindo que valores entre 10-50 são normais)
      const normais = valores.filter(val => val >= 10 && val <= 50).length;
      document.getElementById('normalReadingsCount').textContent = normais;
    }
  } catch (error) {
    console.error('Erro ao atualizar estatísticas:', error);
  }
}