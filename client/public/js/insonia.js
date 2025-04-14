document.addEventListener("DOMContentLoaded", function () {
    const ctx1 = document.getElementById('chartHorasSono').getContext('2d');
    const ctx2 = document.getElementById('chartQualidadeSono').getContext('2d');
  
    // Dados de meses
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const today = new Date();
    let currentMonthIndex = today.getMonth(); // 0 = Janeiro, 11 = Dezembro
    const currentYear = today.getFullYear();

  
    // Função para gerar dados aleatórios
    function generateRandomData(max) {
      return Array.from({ length: 30 }, () => Math.floor(Math.random() * max + 1));
    }
  
    // Gráficos
    const chartHorasSono = new Chart(ctx1, {
        type: 'line',
        data: {
          labels: Array.from({ length: 30 }, (_, i) => `${i + 1}`),
          datasets: [{
            label: 'Horas de Sono',
            data: generateRandomData(12), // Pode gerar até 12h, por exemplo
            fill: true,
            borderColor: '#0a4466',
            backgroundColor: 'rgba(10, 68, 102, 0.1)',
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              min: 0,
              max: 16,
              ticks: {
                stepSize: 2,
                callback: (val) => `${val}h`
              }
            }
          }
        }
      });
  
      const chartQualidadeSono = new Chart(ctx2, {
        type: 'line',
        data: {
          labels: Array.from({ length: 30 }, (_, i) => `${i + 1}`),
          datasets: [{
            label: 'Qualidade do Sono',
            data: generateRandomData(10), // Gera entre 0 e 10
            fill: false,
            borderColor: '#0a4466',
            tension: 0.3
          }]
        },
        options: {
            responsive: true,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const nota = context.raw;
                    let categoria = '';
          
                    if (nota >= 0 && nota <= 2) categoria = 'Ruim';
                    else if (nota <= 4) categoria = 'Regular';
                    else if (nota <= 6) categoria = 'Boa';
                    else if (nota <= 8) categoria = 'Muito boa';
                    else categoria = 'Excelente';
          
                    return [`Nota: ${nota}`, `Qualidade: ${categoria}`];
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
                    if (val === 10) return 'Excelente';
                    if (val === 8) return 'Muito boa';
                    if (val === 6) return 'Boa';
                    if (val === 4) return 'Regular';
                    if (val === 2) return 'Ruim';
                    return '';
                  }
                }
              }
            }
          }
          
        });
      
  
    // Atualiza o mês e os dados nos gráficos
    function updateMonth(change) {
      currentMonthIndex += change;
      if (currentMonthIndex > 11) currentMonthIndex = 0;
      if (currentMonthIndex < 0) currentMonthIndex = 11;
  
      const monthLabelEls = document.querySelectorAll(".month-label");
      monthLabelEls.forEach(el => {
        el.textContent = `${months[currentMonthIndex]} • ${currentYear}`;
      });
  
      // Atualiza dados simulados dos gráficos
      chartHorasSono.data.datasets[0].data = generateRandomData(5);
      chartQualidadeSono.data.datasets[0].data = generateRandomData(5);
      chartHorasSono.update();
      chartQualidadeSono.update();
    }
  
    // Adiciona eventos aos botões
    document.querySelectorAll(".arrow-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const direction = btn.dataset.direction === "next" ? 1 : -1;
        updateMonth(direction);
      });
    });
  });
  