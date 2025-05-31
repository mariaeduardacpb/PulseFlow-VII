document.addEventListener("DOMContentLoaded", function () {
  const ctx = document.getElementById('chartGlicemia').getContext('2d');
  const noDataLabel = document.getElementById('no-data-msg-glicemia');
const toggleButton = document.querySelector(".menu-toggle");
  const sidebar = document.querySelector(".sidebar");

  toggleButton.addEventListener("click", () => {
    sidebar.classList.toggle("active");
    toggleButton.classList.toggle("shifted");
  });
  
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const today = new Date();
  let currentMonthIndex = today.getMonth();
  const currentYear = today.getFullYear();

  async function carregarDadosMedico() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token não encontrado. Por favor, faça login novamente.');
      }

      const res = await fetch('http://localhost:5000/api/usuarios/perfil', {
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
      const tokenMedico = localStorage.getItem("token");
      const tokenPaciente = localStorage.getItem("tokenPaciente");

      if (!tokenMedico || !tokenPaciente) return [];

      const [, payloadBase64] = tokenPaciente.split(".");
      if (!payloadBase64) return [];

      const decodedPayload = JSON.parse(atob(payloadBase64));
      const cpf = decodedPayload?.cpf?.replace(/[^\d]/g, "");
      if (!cpf) return [];

      const response = await fetch(`http://127.0.0.1:5000/api/diabetes/medico?cpf=${cpf}&month=${month + 1}&year=${year}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${tokenMedico}`,
          "Content-Type": "application/json"
        }
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      return result.data || [];

    } catch (err) {
      console.error("Erro ao buscar dados de glicemia:", err);
      return [];
    }
  }

  const chartGlicemia = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "Glicemia (mg/dL)",
        data: [],
        fill: true,
        borderColor: "#0a4466",
        backgroundColor: "rgba(10, 68, 102, 0.1)",
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
          intersect: false,
          displayColors: false,
          usePointStyle: true,
          callbacks: {
            title: context => `Dia ${context[0].label}`,
            beforeBody: context => `Nível: ${context[0].raw} mg/dL`,
            label: context => {
              const valor = context.raw;
              if (valor <= 70) return "Classificação: Hipoglicemia";
              if (valor <= 99) return "Classificação: Normal";
              if (valor <= 125) return "Classificação: Alterada";
              return "Classificação: Diabetes";
            }
          }
        }
      },
      hover: {
        mode: 'nearest',
        intersect: false
      },
      elements: {
        point: {
          radius: 4,
          hoverRadius: 7,
        }
      },
      scales: {
        x: {
          title: { display: true, text: "Dia do Mês" }
        },
        y: {
          min: 60,
          max: 300,
          ticks: {
            stepSize: 20
          },
          title: {
            display: true,
            text: "Nível de Glicemia (mg/dL)"
          }
        }
      }
    }
          
  });

  async function loadChartData() {
    const dados = await fetchGlicemiaData(currentMonthIndex, currentYear);
    const dias = dados.map(d => d.dia);
    const valores = dados.map(d => d.nivelGlicemia); // use "valor" se sua API retornar assim

    if (valores.length === 0) {
      chartGlicemia.data.labels = [];
      chartGlicemia.data.datasets[0].data = [];
      noDataLabel.style.display = "block";
    } else {
      chartGlicemia.data.labels = dias;
      chartGlicemia.data.datasets[0].data = valores;
      noDataLabel.style.display = "none";
    }

    chartGlicemia.update();
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
