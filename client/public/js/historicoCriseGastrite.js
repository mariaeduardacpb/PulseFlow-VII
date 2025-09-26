import { API_URL } from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
  const recordList = document.querySelector('.record-list');
  const filterMonth = document.getElementById('filterMonth');
  const filterYear = document.getElementById('filterYear');
  const filterIntensity = document.getElementById('filterIntensity');
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

      let url = `${API_URL}/api/gastrite/medico?cpf=${paciente.cpf}`;
      const queryParams = new URLSearchParams();

      if (filters.month) {
        queryParams.append('month', filters.month);
      }
      
      if (filters.year) {
        queryParams.append('year', filters.year);
      }

      if (filters.intensity) {
        if (filters.intensity === '10') {
          queryParams.append('intensity', '10-10');
        } else {
          queryParams.append('intensity', filters.intensity);
        }
      }

      if (queryParams.toString()) {
        url += `&${queryParams.toString()}`;
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
    // console.log('Frontend: Filtros sendo aplicados:', filters);
    loadRecords(filters);
  }

  filterMonth.addEventListener('change', applyFilters);
  filterYear.addEventListener('change', applyFilters);
  filterIntensity.addEventListener('change', applyFilters);
  loadRecords();
});

function mostrarErro(mensagem) {
  const aviso = document.createElement('div');
  aviso.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #ffffff;
    color: #002A42;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 42, 66, 0.1);
    z-index: 1000;
    font-family: 'Montserrat', sans-serif;
    font-size: 14px;
    border: 1px solid #e1e5eb;
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 300px;
    max-width: 400px;
    animation: slideIn 0.3s ease-out;
  `;

  const icon = document.createElement('div');
  icon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #00c3b7;">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  `;

  const textContainer = document.createElement('div');
  textContainer.style.cssText = `
    flex: 1;
    line-height: 1.4;
  `;
  textContainer.textContent = mensagem;

  const closeButton = document.createElement('button');
  closeButton.style.cssText = `
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: #94a3b8;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
  `;
  closeButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;
  closeButton.onclick = () => {
    aviso.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      document.body.removeChild(aviso);
      document.head.removeChild(style);
    }, 300);
  };

  aviso.appendChild(icon);
  aviso.appendChild(textContainer);
  aviso.appendChild(closeButton);
  document.body.appendChild(aviso);

  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  setTimeout(() => {
    if (document.body.contains(aviso)) {
      aviso.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        if (document.body.contains(aviso)) {
          document.body.removeChild(aviso);
          document.head.removeChild(style);
        }
      }, 300);
    }
  }, 5000);
}

async function carregarDadosMedico() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado. Por favor, faça login novamente.');
    }

    const res = await fetch(`${API_URL}/api/usuarios/perfil`, {
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