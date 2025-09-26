import { API_URL } from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
  const recordList = document.querySelector('.record-list');
  const filterButton = document.getElementById('filterButton');
  const filterCategory = document.getElementById('filterCategory');
  const filterType = document.getElementById('filterType');
  const filterIntensity = document.getElementById('filterIntensity');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.sidebar');
  let allEventos = []; // Armazenar todos os eventos

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

  function renderEventos(eventos) {
    recordList.innerHTML = '';

    if (eventos.length === 0) {
      recordList.innerHTML = '<p>Nenhum evento clínico encontrado.</p>';
      return;
    }

    eventos.forEach(evento => {
      const data = new Date(evento.dataHora);
      const dataFormatada = `${data.getUTCDate().toString().padStart(2, '0')}/${(data.getUTCMonth() + 1).toString().padStart(2, '0')}/${data.getUTCFullYear()}`;
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
          <p class="data"><strong>Data:</strong> ${dataFormatada}</p>
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
  }

  function filtrarEventos() {
    const especialidadeFiltro = filterCategory.value;
    const tipoFiltro = filterType.value;
    const intensidadeFiltro = filterIntensity.value;

    const eventosFiltrados = allEventos.filter(evento => {
      const especialidadeMatch = !especialidadeFiltro || evento.especialidade === especialidadeFiltro;
      const tipoMatch = !tipoFiltro || evento.tipoEvento === tipoFiltro;
      
      let intensidadeMatch = true;
      if (intensidadeFiltro) {
        const intensidadeEvento = evento.intensidadeDor;
        if (intensidadeFiltro === '0') {
          intensidadeMatch = intensidadeEvento === '0';
        } else if (intensidadeFiltro === '1-3') {
          intensidadeMatch = ['1', '2', '3'].includes(intensidadeEvento);
        } else if (intensidadeFiltro === '4-6') {
          intensidadeMatch = ['4', '5', '6'].includes(intensidadeEvento);
        } else if (intensidadeFiltro === '7-9') {
          intensidadeMatch = ['7', '8', '9'].includes(intensidadeEvento);
        } else if (intensidadeFiltro === '10') {
          intensidadeMatch = intensidadeEvento === '10';
        }
      }

      return especialidadeMatch && tipoMatch && intensidadeMatch;
    });

    renderEventos(eventosFiltrados);
  }

  async function loadEventos() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        recordList.innerHTML = '<p style="color: red;">Token não encontrado. Faça login novamente.</p>';
        return;
      }

      const response = await fetch(`${API_URL}/api/eventos-clinicos/medico?cpf=${cpf}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao buscar eventos clínicos');
      }

      allEventos = await response.json();
      renderEventos(allEventos);

    } catch (error) {
      recordList.innerHTML = `<p style="color: red;">Erro ao carregar eventos clínicos: ${error.message}</p>`;
    }
  }

  // Carrega eventos inicialmente
  await loadEventos();

  // Filtros
  // filterButton.addEventListener('click', filtrarEventos);

  // Adiciona listeners para os outros filtros
  filterCategory.addEventListener('change', filtrarEventos);
  filterType.addEventListener('change', filtrarEventos);
  filterIntensity.addEventListener('change', filtrarEventos);
});

// ✅ Função que exibe "Dr(a). Nome" na sidebar
async function carregarDadosMedico() {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Token não encontrado. Por favor, faça login novamente.');

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
    return false;
  }
}