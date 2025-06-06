document.addEventListener('DOMContentLoaded', async () => {
  const recordList = document.querySelector('.record-list');
  const filterMonth = document.getElementById('filterMonth');
  const filterYear = document.getElementById('filterYear');
  const filterIntensity = document.getElementById('filterIntensity');
  const filterButton = document.getElementById('filterButton');
  const toggleButton = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');

  toggleButton?.addEventListener("click", () => {
    sidebar?.classList.toggle("active");
    toggleButton?.classList.toggle("shifted");
  });

  await carregarDadosMedico(); // <-- Chamada para exibir Dr(a). Nome

  function formatDate(dateString) {
    if (typeof dateString === 'string') {
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

  function getIntensityClass(intensity) {
    if (intensity === 0) return 'sem-dor';
    if (intensity >= 1 && intensity <= 3) return 'leve';
    if (intensity >= 4 && intensity <= 6) return 'moderada';
    if (intensity >= 7 && intensity <= 9) return 'intensa';
    if (intensity === 10) return 'insuportavel';
    return '';
  }

  function getIntensityText(intensity) {
    if (intensity === 0) return 'Sem dor';
    if (intensity >= 1 && intensity <= 3) return 'Dor leve';
    if (intensity >= 4 && intensity <= 6) return 'Dor Moderada';
    if (intensity >= 7 && intensity <= 9) return 'Dor Intensa';
    if (intensity === 10) return 'Dor insuportável';
    return 'Intensidade não especificada';
  }

  async function loadRecords(filters = {}) {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado');

      const paciente = JSON.parse(localStorage.getItem('pacienteSelecionado'));
      if (!paciente || !paciente.cpf) throw new Error('Paciente não selecionado');

      let url = `http://localhost:65432/api/gastrite/crises/${paciente.cpf}`;
      const queryParams = new URLSearchParams();

      if (filters.month && filters.year) {
        const month = filters.month.padStart(2, '0');
        queryParams.append('month', `${filters.year}-${month}`);
      } else if (filters.year) {
        queryParams.append('year', filters.year);
      }

      if (filters.intensity) {
        const [min, max] = filters.intensity.split('-').map(Number);
        queryParams.append('intensity', `${min}-${max}`);
      }

      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Erro ao carregar registros');
      const crises = await response.json();

      recordList.innerHTML = '';

      if (crises.length === 0) {
        recordList.innerHTML = '<p class="no-records">Nenhum registro encontrado</p>';
        return;
      }

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

  function applyFilters() {
    const filters = {
      month: filterMonth.value,
      year: filterYear.value,
      intensity: filterIntensity.value
    };
    loadRecords(filters);
  }

  filterButton.addEventListener('click', applyFilters);
  loadRecords();
});

async function carregarDadosMedico() {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Token não encontrado. Por favor, faça login novamente.');

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
    return false;
  }
}