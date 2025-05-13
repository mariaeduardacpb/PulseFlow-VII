document.addEventListener("DOMContentLoaded", function () {
  const ctx1 = document.getElementById('chartEnxaqueca').getContext('2d');
  const noDataLabel = document.getElementById('no-data-msg');

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const today = new Date();
  let currentMonthIndex = today.getMonth();
  const currentYear = today.getFullYear();

  async function fetchEnxaquecaData(month, year) {
    try {
      const tokenMedico = localStorage.getItem("token");
      const tokenPaciente = localStorage.getItem("tokenPaciente");

      if (!tokenMedico || !tokenPaciente) {
        console.error("Token não encontrado.");
        return [];
      }

      // Decodifica o token do paciente para extrair o CPF
      const [, payloadBase64] = tokenPaciente.split('.');
      if (!payloadBase64) {
        console.error("Token de paciente inválido.");
        return [];
      }

      const decodedPayload = JSON.parse(atob(payloadBase64));
      const cpf = decodedPayload?.cpf?.replace(/[^\d]/g, '');

      if (!cpf) {
        console.error("CPF não encontrado no token.");
        return [];
      }

      const response = await fetch(`http://127.0.0.1:5500/api/enxaqueca/medico?cpf=${cpf}&month=${month + 1}&year=${year}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${tokenMedico}`,
          "Content-Type": "application/json"
        }
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Erro ao buscar dados:", result.message || result);
        return [];
      }

      return result.data || [];

    } catch (error) {
      console.error("Erro ao buscar dados de enxaqueca:", error);
      return [];
    }
  }

  const chartEnxaqueca = new Chart(ctx1, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Intensidade da Dor',
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
        usePointStyle: false,
        displayColors: false,
        callbacks: {
        title: function (context) {
        const dia = context[0].label;
        return `Dia ${dia}`;
    },
    label: function (context) {
      const nota = context.raw;
      let categoria = '';
      if (nota <= 3) categoria = 'Baixa';
      else if (nota <= 6) categoria = 'Moderada';
      else if (nota <= 8) categoria = 'Alta';
      else categoria = 'Muito Alta';
      return [`Nota: ${nota}`, `Categoria: ${categoria}`];
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Dia do Mês' }
        },
        y: {
          min: 0,
          max: 11,
          ticks: {
            stepSize: 1,
            callback: function (val) {
              if (val === 9) return 'Muito Alta';
              if (val === 8) return 'Alta';
              if (val === 6) return 'Moderada';
              if (val === 3) return 'Baixa';
              return '';
            }
          }
        }
      }
    }
  });

  async function loadChartData() {
    const dados = await fetchEnxaquecaData(currentMonthIndex, currentYear);
    const dias = dados.map(d => d.dia);
    const intensidades = dados.map(d => d.intensidade);

    const hasData = intensidades.length > 0;

    if (!hasData) {
      chartEnxaqueca.data.labels = [];
      chartEnxaqueca.data.datasets[0].data = [];
      noDataLabel.style.display = 'block';
    } else {
      chartEnxaqueca.data.labels = dias;
      chartEnxaqueca.data.datasets[0].data = intensidades;
      noDataLabel.style.display = 'none';
    }

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
});
