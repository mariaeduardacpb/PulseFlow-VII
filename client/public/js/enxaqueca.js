document.addEventListener("DOMContentLoaded", function () {
    const ctx1 = document.getElementById('chartEnxaqueca').getContext('2d');
  
    // Dados de meses
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const today = new Date();
    let currentMonthIndex = today.getMonth();
    const currentYear = today.getFullYear();
  
    // Função para gerar dados aleatórios
    function generateRandomData(max) {
      return Array.from({ length: 30 }, () => Math.floor(Math.random() * (max + 1)));
    }
  
    // Criação do gráfico
    const chartEnxaqueca = new Chart(ctx1, {
      type: 'line',
      data: {
        labels: Array.from({ length: 30 }, (_, i) => `${i + 1}`),
        datasets: [{
          label: 'Intensidade da Dor',
          data: generateRandomData(10), // agora de 0 a 10
          fill: true,
          borderColor: '#0a4466',
          backgroundColor: 'rgba(10, 68, 102, 0.1)',
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (context) {
                const nota = context.raw;
                let categoria = '';
  
                if (nota <= 4) categoria = 'Baixa';
                else if (nota <= 7) categoria = 'Moderada';
                else categoria = 'Alta';
  
                return [`Nota: ${nota}`, `Categoria: ${categoria}`];
              }
            }
          }
        },
        scales: {
          y: {
            min: 0,
            max: 11,
            ticks: {
              stepSize: 1,
              callback: function (val) {
                if (val === 10) return 'Alta';
                if (val === 7) return 'Moderada';
                if (val === 4) return 'Baixa';
                return '';
              }
            }
          }
        }
      }
    });
  
    // Atualiza o mês e os dados no gráfico
    function updateMonth(change) {
      currentMonthIndex += change;
      if (currentMonthIndex > 11) currentMonthIndex = 0;
      if (currentMonthIndex < 0) currentMonthIndex = 11;
  
      const monthLabelEls = document.querySelectorAll(".month-label");
      monthLabelEls.forEach(el => {
        el.textContent = `${months[currentMonthIndex]} • ${currentYear}`;
      });
  
      chartEnxaqueca.data.datasets[0].data = generateRandomData(10);
      chartEnxaqueca.update();
    }
  
    // Eventos das setas
    document.querySelectorAll(".arrow-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const direction = btn.dataset.direction === "next" ? 1 : -1;
        updateMonth(direction);
      });
    });
  
    // Atualiza o mês inicial ao carregar
    document.querySelectorAll(".month-label").forEach(el => {
      el.textContent = `${months[currentMonthIndex]} • ${currentYear}`;
    });
  });
  