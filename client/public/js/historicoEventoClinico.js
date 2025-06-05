document.addEventListener('DOMContentLoaded', async () => {
  const recordList = document.querySelector('.record-list');
  const filterButton = document.getElementById('filterButton');
  const filterCategory = document.getElementById('filterCategory');
  const filterType = document.getElementById('filterType');
  const filterIntensity = document.getElementById('filterIntensity');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.sidebar');

  // Sidebar toggle functionality
  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
  });

  const paciente = JSON.parse(localStorage.getItem('pacienteSelecionado'));
  const cpf = paciente?.cpf;

  if (!cpf) {
    recordList.innerHTML = '<p style="color: red;">Paciente não selecionado.</p>';
    return;
  }

  // Function to determine the descriptive intensity text and class based on the value
  function getIntensityInfo(intensityValue) {
    let description = '';
    let className = '';

    // Attempt to parse as a number first
    const numIntensity = parseInt(intensityValue, 10);

    if (intensityValue === 'na') {
      description = 'Não se Aplica';
      className = '';
    } else if (!isNaN(numIntensity)) {
      // Handle numeric values based on the provided image ranges
      if (numIntensity === 0) {
        description = 'Sem Dor';
        className = 'sem-dor'; // Green
      } else if (numIntensity >= 1 && numIntensity <= 3) {
        description = 'Dor leve';
        className = 'leve'; // Blue
      } else if (numIntensity >= 4 && numIntensity <= 6) {
        description = 'Dor Moderada';
        className = 'moderada'; // Purple
      } else if (numIntensity >= 7 && numIntensity <= 9) {
        description = 'Dor Intensa';
        className = 'intensa'; // Orange/Yellow
      } else if (numIntensity === 10) {
        description = 'Dor insuportável';
        className = 'insuportavel'; // Red
      } else {
        // Fallback for numbers outside 0-10 range
        description = intensityValue;
        className = '';
      }
    } else {
      // If not a number, handle string values from enum (like '1-3', '4-6', '7-9', '10')
      switch(intensityValue) {
        case '0':
          description = 'Sem Dor';
          className = 'sem-dor'; // Green
          break;
        case '1-3':
          description = 'Dor leve';
          className = 'leve'; // Blue
          break;
        case '4-6':
          description = 'Dor Moderada';
          className = 'moderada'; // Purple
          break;
        case '7-9':
          description = 'Dor Intensa';
          className = 'intensa'; // Orange/Yellow
          break;
        case '10':
          description = 'Dor insuportável';
          className = 'insuportavel'; // Red
          break;
        default:
          // Fallback for unexpected string values
          description = intensityValue;
          className = '';
      }
    }

    console.log(`Intensity Value: ${intensityValue}, Description: ${description}, Class: ${className}`);
    return { description, className };
  }

  async function loadEvents(filters = {}) {
    try {
      const queryParams = new URLSearchParams({
        cpf: cpf,
        ...filters
      }).toString();

      const response = await fetch(`http://localhost:5000/api/eventos-clinicos?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar eventos clínicos');
      }

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

        // Create and append elements for intensity to ensure correct structure and class application
        const intensityParagraph = document.createElement('p');
        const strongElement = document.createElement('strong');
        strongElement.textContent = 'Intensidade da Dor: ';
        intensityParagraph.appendChild(strongElement);

        if (intensityValue !== 'na') {
          const intensitySpan = document.createElement('span');
          intensitySpan.classList.add('intensity');
          if (intensityClass) { // Add the color class if determined
            intensitySpan.classList.add(intensityClass);
          }
          const intensityDisplayText = `${intensityDescription} (${intensityValue}/10)`;
          intensitySpan.textContent = intensityDisplayText;
          console.log(`Applying class: ${intensityClass} to span for value: ${intensityValue}`); // Log before appending
          intensityParagraph.appendChild(intensitySpan);
        } else {
          // If intensity is 'na', just append the description text
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

        // Find the correct place to insert the intensity paragraph
        const infoDiv = item.querySelector('.info');
        if (infoDiv) {
          // Insert before the alivio paragraph
          const alivioParagraph = infoDiv.querySelector('.alivio');
          if(alivioParagraph) {
            infoDiv.insertBefore(intensityParagraph, alivioParagraph);
          } else {
            // If alivio paragraph not found, just append to infoDiv
            infoDiv.appendChild(intensityParagraph);
          }
        } else {
          // Fallback: append to the item directly if .info not found
          item.appendChild(intensityParagraph);
        }

        recordList.appendChild(item);
      });
    } catch (error) {
      console.error(error);
      recordList.innerHTML = '<p style="color: red;">Erro ao carregar eventos clínicos.</p>';
    }
  }

  // Carregar eventos iniciais
  await loadEvents();

  // Configurar filtros
  filterButton.addEventListener('click', async () => {
    const filters = {
      especialidade: filterCategory.value,
      tipoEvento: filterType.value,
      intensidadeDor: filterIntensity.value
    };

    // Remover filters vazios
    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
    });

    await loadEvents(filters);
  });
}); 