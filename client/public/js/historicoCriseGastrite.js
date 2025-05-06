document.addEventListener('DOMContentLoaded', () => {
  const recordList = document.querySelector('.record-list');
  const filterMonth = document.getElementById('filterMonth');
  const filterYear = document.getElementById('filterYear');
  const filterIntensity = document.getElementById('filterIntensity');
  const filterButton = document.getElementById('filterButton');

  // Função para formatar a data
  function formatDate(dateString) {
    console.log('Data recebida:', dateString); // Log para debug
    
    // Se a data vier como string ISO
    if (typeof dateString === 'string') {
      // Remove a parte do timezone se existir
      const cleanDate = dateString.split('.')[0];
      const date = new Date(cleanDate);
      
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }
    
    // Se a data vier como objeto Date
    if (dateString instanceof Date) {
      return dateString.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    console.error('Formato de data inválido:', dateString);
    return 'Data não disponível';
  }

  // Função para determinar a classe de intensidade
  function getIntensityClass(intensity) {
    if (intensity <= 3) return 'low';
    if (intensity <= 6) return 'medium';
    return 'high';
  }

  // Função para determinar o texto de intensidade
  function getIntensityText(intensity) {
    if (intensity === 0) return 'Sem dor';
    if (intensity <= 3) return 'Leve';
    if (intensity <= 6) return 'Moderada';
    return 'Intensa';
  }

  // Função para carregar os registros
  async function loadRecords(filters = {}) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const paciente = JSON.parse(localStorage.getItem('pacienteSelecionado'));
      if (!paciente || !paciente.cpf) {
        throw new Error('Paciente não selecionado');
      }

      let url = `http://localhost:5000/api/gastrite/crises/${paciente.cpf}`;
      
      // Adiciona os filtros à URL se existirem
      const queryParams = new URLSearchParams();
      if (filters.month && filters.month !== '') queryParams.append('month', filters.month);
      if (filters.year && filters.year !== '') queryParams.append('year', filters.year);
      if (filters.intensity && filters.intensity !== '') {
        const [min, max] = filters.intensity.split('-').map(Number);
        queryParams.append('intensity', `${min}-${max}`);
      }
      
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }

      console.log('URL com filtros:', url); // Log para debug

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar registros');
      }

      const crises = await response.json();
      console.log('Crises filtradas:', crises); // Log para debug
      
      // Limpa a lista atual
      recordList.innerHTML = '';

      if (crises.length === 0) {
        recordList.innerHTML = '<p class="no-records">Nenhum registro encontrado</p>';
        return;
      }

      // Cria os elementos para cada crise
      crises.forEach(crise => {
        const recordItem = document.createElement('div');
        recordItem.className = 'record-item';
        
        const intensityClass = getIntensityClass(crise.intensidadeDor);
        const intensityText = getIntensityText(crise.intensidadeDor);

        recordItem.innerHTML = `
          <div class="info">
            <p><strong>Data da Crise:</strong> ${formatDate(crise.data)}</p>
            <p><strong>Intensidade da Dor:</strong> <span class="intensity ${intensityClass}">${intensityText} (${crise.intensidadeDor}/10)</span></p>
            <p><strong>Medicação usada:</strong> ${crise.medicacao || 'Não especificada'}</p>
            <p><strong>Alívio após medicação:</strong> ${crise.alivioMedicacao ? 'Sim' : 'Não'}</p>
          </div>
          <a href="../views/visualizacaoCriseGastrite.html?id=${crise._id}">Visualizar Detalhes</a>
        `;

        recordList.appendChild(recordItem);
      });

    } catch (error) {
      console.error('Erro:', error);
      recordList.innerHTML = `<p class="error">Erro ao carregar registros: ${error.message}</p>`;
    }
  }

  // Função para aplicar os filtros
  function applyFilters() {
    const filters = {
      month: filterMonth.value,
      year: filterYear.value,
      intensity: filterIntensity.value
    };
    console.log('Filtros aplicados:', filters); // Log para debug
    loadRecords(filters);
  }

  // Adiciona o evento de clique ao botão de filtrar
  filterButton.addEventListener('click', applyFilters);

  // Carrega os registros iniciais
  loadRecords();
}); 