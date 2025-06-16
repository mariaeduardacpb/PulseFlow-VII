document.addEventListener("DOMContentLoaded", function () {
  const ctx1 = document.getElementById('chartEnxaqueca').getContext('2d');
  const noDataLabel = document.getElementById('no-data-msg');

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
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


  async function fetchEnxaquecaData(month, year) {
    try {
      const tokenMedico = localStorage.getItem("token");
      const tokenPaciente = localStorage.getItem("tokenPaciente");

      if (!tokenMedico || !tokenPaciente) {
        console.error("Token não encontrado.");
        return [];
      }

     const decodedPayload = JSON.parse(atob(tokenPaciente));
      const cpf = decodedPayload?.cpf?.replace(/[^\d]/g, "");


      if (!cpf) {
        console.error("CPF não encontrado no token.");
        return [];
      }

      const response = await fetch(`http://127.0.0.1:65432/api/enxaqueca/medico?cpf=${cpf}&month=${month + 1}&year=${year}`, {
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
        fill: true, // <<< ESSENCIAL PARA O PREENCHIMENTO
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

  function updateChart(data) {
    if (!data || !data.data || data.data.length === 0) {
      document.getElementById('no-data-msg').style.display = 'block';
      chartEnxaqueca.data.labels = [];
      chartEnxaqueca.data.datasets[0].data = [];
      chartEnxaqueca.update();
      return;
    }

    document.getElementById('no-data-msg').style.display = 'none';

    // Extrair dias e intensidades
    const dias = data.data.map(d => d.dia);
    const intensidades = data.data.map(d => d.intensidade);

    // Atualizar dados do gráfico
    chartEnxaqueca.data.labels = dias;
    chartEnxaqueca.data.datasets[0].data = intensidades;

    // Atualizar o gráfico
    chartEnxaqueca.update();
  }

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
  carregarDadosMedico();
});
