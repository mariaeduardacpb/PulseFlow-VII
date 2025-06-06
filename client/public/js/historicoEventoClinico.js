document.addEventListener('DOMContentLoaded', async () => {
  const recordList = document.querySelector('.record-list');
  const filterButton = document.getElementById('filterButton');
  const filterCategory = document.getElementById('filterCategory');
  const filterType = document.getElementById('filterType');
  const filterIntensity = document.getElementById('filterIntensity');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.sidebar');

  sidebarToggle?.addEventListener('click', () => {
    sidebar.classList.toggle('active');
  });

  // ✅ Exibir nome do(a) médico(a) na sidebar
  await carregarDadosMedico();

  const paciente = JSON.parse(localStorage.getItem('pacienteSelecionado'));
  const cpf = paciente?.cpf;

  if (!cpf) {
    recordList.innerHTML = '<p style="color: red;">Paciente não selecionado.</p>';
    return;
  }

  function getIntensityInfo(intensityValue) {
    let description = '';
    let className = '';
    const numIntensity = parseInt(intensityValue, 10);

    if (intensityValue === 'na') {
      description = 'Não se Aplica';
      className = '';
    } else if (!isNaN(numIntensity)) {
      if (numIntensity === 0) {
        description = 'Sem Dor'; className = 'sem-dor';
      } else if (numIntensity <= 3) {
        description = 'Dor leve'; className = 'leve';
      } else if (numIntensity <= 6) {
        description = 'Dor Moderada'; className = 'moderada';
      } else if (numIntensity <= 9) {
        description = 'Dor Intensa'; className = 'intensa';
      } else if (numIntensity === 10) {
        description = 'Dor insuportável'; className = 'insuportavel';
      } else {
        description = intensityValue; className = '';
      }
    } else {
      switch(intensityValue) {
        case '0': description = 'Sem Dor'; className = 'sem-dor'; break;
        case '1-3': description = 'Dor leve'; className = 'leve'; break;
        case '4-6': description = 'Dor Moderada'; className = 'moderada'; break;
        case '7-9': description = 'Dor Intensa'; className = 'intensa'; break;
        case '10': description = 'Dor insuportável'; className = 'insuportavel'; break;
        default: description = intensityValue; className = '';
      }
    }

    return { description, className };
  }

  async function loadEvents(filters = {}) {
    try {
      const queryParams = new URLSearchParams({ cpf, ...filters }).toString();
      const response = await fetch(`http://localhost:65432/api/eventos-clinicos?${queryParams}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) throw new Error('Erro ao buscar eventos clínicos');

      const eventos = await response.json();
      recordList.innerHTML = '';

      if (eventos.length === 0) {
        recordList.innerHTML = '<p>Nenhum evento clínico encontrado.</p>';
        return;
      }

      eventos.forEach(evento => {
        const dataFormatada = new Date(evento.dataHora).toLocaleString('pt-BR');
        const item = document.createElement('div');
        item.className = 'record-item';

        const intensityValue = evento.intensidadeDor;
        const { description: intensityDescription, className: intensityClass } = getIntensityInfo(intensityValue);

        const intensityParagraph = document.createElement('p');
        const strongElement = document.createElement('strong');
        strongElement.textContent = 'Intensidade da Dor: ';
        intensityParagraph.appendChild(strongElement);

        if (intensityValue !== 'na') {
          const intensitySpan = document.createElement('span');
          intensitySpan.classList.add('intensity');
          if (intensityClass) intensitySpan.classList.add(intensityClass);
          intensitySpan.textContent = `${intensityDescription} (${intensityValue}/10)`;
          intensityParagraph.appendChild(intensitySpan);
        } else {
          intensityParagraph.textContent += intensityDescription;
        }

        item.innerHTML = `
          <div class="info">
            <p class="titulo"><strong>Título:</strong> ${evento.titulo}</p>
            <p class="data"><strong>Data e Hora:</strong> ${dataFormatada}</p>
            <p class="tipo"><strong>Tipo:</strong> ${evento.tipoEvento}</p>
            <p class="especialidade"><strong>Especialidade:</strong> ${evento.especialidade}</p>
            <p class="alivio"><strong>Alívio:</strong> ${evento.alivio}</p>
          </div>
          <a href="/client/views/vizualizacaoEventoClinico.html?id=${evento._id}">Visualizar Evento Clínico</a>
        `;

        const infoDiv = item.querySelector('.info');
        if (infoDiv) {
          const alivioParagraph = infoDiv.querySelector('.alivio');
          if (alivioParagraph) {
            infoDiv.insertBefore(intensityParagraph, alivioParagraph);
          } else {
            infoDiv.appendChild(intensityParagraph);
          }
        }

        recordList.appendChild(item);
      });

    } catch (error) {
      console.error(error);
      recordList.innerHTML = '<p style="color: red;">Erro ao carregar eventos clínicos.</p>';
    }
  }

  // Carrega eventos inicialmente
  await loadEvents();

  // Filtros
  filterButton.addEventListener('click', async () => {
    const filters = {
      especialidade: filterCategory.value,
      tipoEvento: filterType.value,
      intensidadeDor: filterIntensity.value
    };

    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
    });

    await loadEvents(filters);
  });
});

// ✅ Função que exibe "Dr(a). Nome" na sidebar
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