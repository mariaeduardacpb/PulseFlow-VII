document.addEventListener("DOMContentLoaded", function () {
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

  async function carregarDadosMedico() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token não encontrado. Por favor, faça login novamente.');
      }

      const res = await fetch('http://localhost:65432/api/usuarios/perfil', {
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
      const tokenMedico = localStorage.getItem("token");
      const tokenPaciente = localStorage.getItem("tokenPaciente");

      if (!tokenMedico || !tokenPaciente) {
        console.error("Token não encontrado.");
        return { dias: [], horasSono: [], qualidadeSono: [] };
      }

      const decodedPayload = JSON.parse(atob(tokenPaciente));
      const cpf = decodedPayload?.cpf?.replace(/[^\d]/g, "");


      if (!cpf) {
        console.error("CPF não encontrado no token.");
        return { dias: [], horasSono: [], qualidadeSono: [] };
      }

      const response = await fetch(`http://127.0.0.1:65432/api/insonia/medico?cpf=${cpf}&month=${month + 1}&year=${year}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${tokenMedico}`,
          "Content-Type": "application/json"
        }
      });

      const result = await response.json();
      if (!response.ok) {
        console.error("Erro ao buscar dados:", result.message || result);
        return { dias: [], horasSono: [], qualidadeSono: [] };
      }

      const dias = result.data.map(item => item.dia);
      const horasSono = result.data.map(item => item.horasSono);
      const qualidadeSono = result.data.map(item => item.qualidadeSono);
      return { dias, horasSono, qualidadeSono };
    } catch (error) {
      console.error("Erro ao buscar dados de insônia:", error);
      return { dias: [], horasSono: [], qualidadeSono: [] };
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
    const { dias, horasSono, qualidadeSono } = await fetchInsoniaData(currentMonthIndex, currentYear);
  
    // Converte para número (caso venha como string)
    const horasNumericas = horasSono.map(h => Number(h));
    const qualidadeNumerica = qualidadeSono.map(q => Number(q));
  
    const temHoras = horasNumericas.length > 0;
    const temQualidade = qualidadeNumerica.length > 0;
  
    // Horas de sono
    if (!temHoras) {
      chartHorasSono.data.labels = [];
      chartHorasSono.data.datasets[0].data = [];
      noDataLabelHoras.style.display = 'block';
    } else {
      chartHorasSono.data.labels = dias;
      chartHorasSono.data.datasets[0].data = horasNumericas;
      noDataLabelHoras.style.display = 'none';
    }
    chartHorasSono.update();
  
    // Qualidade do sono
    if (!temQualidade) {
      chartQualidadeSono.data.labels = [];
      chartQualidadeSono.data.datasets[0].data = [];
      noDataLabelQualidade.style.display = 'block';
    } else {
      chartQualidadeSono.data.labels = dias;
      chartQualidadeSono.data.datasets[0].data = qualidadeNumerica;
      noDataLabelQualidade.style.display = 'none';
    }
    chartQualidadeSono.update();
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
