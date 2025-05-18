document.addEventListener('DOMContentLoaded', async () => {
  const recordList = document.querySelector('.record-list');
  const filterButton = document.getElementById('filterButton');
  const filterCategory = document.getElementById('filterCategory');
  const filterType = document.getElementById('filterType');
  const filterDoctor = document.getElementById('filterDoctor');

  const paciente = JSON.parse(localStorage.getItem('pacienteSelecionado'));
  const cpf = paciente?.cpf;

  if (!cpf) {
    recordList.innerHTML = '<p style="color: red;">Paciente não selecionado.</p>';
    return;
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
        item.innerHTML = `
          <div class="info">
            <p class="titulo"><strong>Título:</strong> ${evento.titulo}</p>
            <p class="data"><strong>Data e Hora:</strong> ${dataFormatada}</p>
            <p class="tipo"><strong>Tipo:</strong> ${evento.tipoEvento}</p>
            <p class="especialidade"><strong>Especialidade:</strong> ${evento.especialidade}</p>
            <p class="intensidade"><strong>Intensidade da Dor:</strong> ${evento.intensidadeDor}</p>
            <p class="alivio"><strong>Alívio:</strong> ${evento.alivio}</p>
          </div>
          <a href="/client/views/vizualizacaoEventoClinico.html?id=${evento._id}">Visualizar Evento Clínico</a>
        `;
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
      medico: filterDoctor.value
    };

    // Remover filtros vazios
    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
    });

    await loadEvents(filters);
  });
}); 