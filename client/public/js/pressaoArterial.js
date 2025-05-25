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
      const tokenMedico = localStorage.getItem("token");
      const tokenPaciente = localStorage.getItem("tokenPaciente");

      if (!tokenMedico || !tokenPaciente) {
        console.error("Token não encontrado.");
        return [];
      }

      const [, payloadBase64] = tokenPaciente.split(".");
      if (!payloadBase64) return [];

      const decodedPayload = JSON.parse(atob(payloadBase64));
      const cpf = decodedPayload?.cpf?.replace(/[^\d]/g, "");
      if (!cpf) return [];

      const response = await fetch(`http://127.0.0.1:5000/api/pressaoArterial/medico?cpf=${cpf}&month=${month + 1}&year=${year}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${tokenMedico}`,
          "Content-Type": "application/json"
        }
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      return result.data || [];
    } catch (error) {
      console.error("Erro ao buscar dados de pressão arterial:", error);
      return [];
    }
  }

  // 👉 Carregar e exibir no gráfico
  async function loadChartData() {
    const dados = await fetchPressaoData(currentMonthIndex, currentYear);

    if (!dados || dados.length === 0) {
      chartPressao.data.labels = [];
      chartPressao.data.datasets[0].data = [];

      chartPressao.options.scales.x = {
        display: false,
        grid: { display: false }
      };

      noDataLabel.style.display = "block";
      chartPressao.update();
      return;
    }

    noDataLabel.style.display = "none";

    const dataset = dados.map(r => ({
      x: r.dia,
      y: r.sistolica,
      label: `${r.sistolica}/${r.diastolica}`
    }));

    chartPressao.data.labels = dados.map(r => r.dia);
    const finalData = dataset;
const currentData = finalData.map(d => ({ x: d.x, y: 0, label: d.label }));

chartPressao.data.datasets[0].data = currentData;
chartPressao.update();

let progress = 0;
const duration = 600; // milissegundos
const startTime = performance.now();

function animate() {
  const now = performance.now();
  progress = Math.min((now - startTime) / duration, 1);

  chartPressao.data.datasets[0].data = finalData.map((d, i) => ({
    x: d.x,
    y: d.y * progress,
    label: d.label
  }));

  chartPressao.update();

  if (progress < 1) {
    requestAnimationFrame(animate);
  }
}

requestAnimationFrame(animate);


    chartPressao.options.scales.x = {
      type: 'linear',
      title: { display: true, text: 'Dia do Mês' },
      ticks: { precision: 0 }
    };

    chartPressao.update();
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
