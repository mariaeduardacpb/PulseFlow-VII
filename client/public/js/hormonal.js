document.addEventListener("DOMContentLoaded", function () {
    const ctx = document.getElementById('chartHormonal').getContext('2d');
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
  
    // Mapeamento de cores automáticas para os hormônios
    const coresHormônios = [
      '#0a4466', '#00c3b7', '#f39c12', '#8e44ad', '#e74c3c', '#3498db'
    ];
  
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

    // Função para buscar os dados hormonais
    async function fetchHormonalData(month, year) {
      try {
        const tokenMedico = localStorage.getItem("token");
        const tokenPaciente = localStorage.getItem("tokenPaciente");
  
        if (!tokenMedico || !tokenPaciente) {
          console.error("Token não encontrado.");
          return [];
        }
  
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
  
        const response = await fetch(`http://127.0.0.1:65432/api/hormonal/medico?cpf=${cpf}&month=${month + 1}&year=${year}`, {
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
        console.error("Erro ao buscar dados hormonais:", error);
        return [];
      }
    }
  
    // Configuração do gráfico Chart.js
    const chartHormonal = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [] // Inicialmente vazio
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            displayColors: false,
            usePointStyle: true,
            callbacks: {
              title: (context) => `Dia ${context[0].label}`,
              label: (context) => {
                const valor = Number(context.raw);
                if (isNaN(valor)) return 'Valor inválido';
              
                let hormonio = context.dataset.label;
                if (!hormonio) return 'Hormônio desconhecido';
              
                // Normaliza para buscar unidade corretamente
                const normalizado = hormonio.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
              
                // Mapeamento de unidades por hormônio
                const unidades = {
                  lh: "mUI/mL",
                  fsh: "mUI/mL",
                  estrogeno: "pg/mL",
                  estradiol: "pg/mL",
                  progesterona: "ng/mL",
                  prolactina: "ng/mL",
                  testosterona: "ng/dL",
                  tsh: "µUI/mL",
                  t3: "ng/dL",
                  t4: "ng/dL"
                };
              
                const unidade = unidades[normalizado] || "";
              
                return `${hormonio}: ${valor} ${unidade}`;
              }
            }},
          legend: { display: true }
        },
        scales: {
          x: {
            title: { display: true, text: 'Dia do Mês' },
            ticks: {
              precision: 0
            }
          },
          y: {
            title: { display: true, text: 'Nível Hormonal' },
            suggestedMin: 0,
suggestedMax: 100,
ticks: {
  stepSize: 10,
  callback: function(value) {
    return value; // mantém o número mesmo sem dados
  }

}

          }
        }
      }        
    });
  
    async function loadChartData() {
      const dados = await fetchHormonalData(currentMonthIndex, currentYear);
  
      if (!dados.length) {
        chartHormonal.data.labels = [0]; // Eixo X mínimo
        chartHormonal.data.datasets = [{
          label: "",
          data: [0], // Ponto mínimo no eixo Y
          borderColor: "transparent",
          backgroundColor: "transparent",
          pointRadius: 0,
          fill: false,
          tension: 0,
          spanGaps: true
        }];
        chartHormonal.update();
        noDataLabel.style.display = 'block';
        return;
      }
      
  
      noDataLabel.style.display = 'none';
  
      // Pega todos os dias
      const diasUnicos = [...new Set(dados.map(d => d.dia))].sort((a, b) => a - b);
      chartHormonal.data.labels = diasUnicos;
  
      // Pega todos os hormônios
      const nomesHormônios = [...new Set(dados.map(d => d.hormonio))];
  
      chartHormonal.data.datasets = nomesHormônios.map((hormonio, index) => {
        const cor = coresHormônios[index % coresHormônios.length];
        const dadosHormônio = diasUnicos.map(dia => {
          const registro = dados.find(d => d.dia === dia && d.hormonio === hormonio);
          return registro ? registro.valor : null;
        });
  
        return {
            label: hormonio,
            data: dadosHormônio,
            fill: true, 
            borderColor: cor,
            backgroundColor: cor + '33', 
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
            spanGaps: true
          };
          
          
      });
  
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
    carregarDadosMedico();
  });
  