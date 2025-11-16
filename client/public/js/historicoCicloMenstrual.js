import { API_URL } from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const pacienteData = localStorage.getItem('pacienteSelecionado');
    if (!pacienteData) return;
    const paciente = JSON.parse(pacienteData);
    const cpf = paciente?.cpf;
    if (!cpf) return;

    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/menstruacao/${cpf}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    let registros = [];
    if (res.ok) {
      registros = await res.json();
    }

    renderizarRegistros(registros);
  } catch (e) {
    console.error('Erro ao carregar histórico do ciclo:', e);
  }
});

function formatarData(dataString) {
  const data = new Date(dataString);
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function renderizarRegistros(registros) {
  const recordsGrid = document.getElementById('recordsGrid');
  const noRecords = document.getElementById('noRecords');
  const recordsCount = document.getElementById('recordsCount');
  if (!recordsGrid || !noRecords || !recordsCount) return;

  recordsCount.textContent = registros.length;
  recordsGrid.innerHTML = '';

  if (!registros.length) {
    noRecords.style.display = 'block';
    return;
  }
  noRecords.style.display = 'none';

  const sorted = [...registros].sort((a, b) => new Date(b.dataInicio) - new Date(a.dataInicio));

  sorted.forEach(registro => {
    const card = document.createElement('div');
    card.className = 'record-card';

    const dataInicio = formatarData(registro.dataInicio);
    const dataFim = formatarData(registro.dataFim);

    card.innerHTML = `
      <div class="record-header">
        <div class="record-date">${dataInicio} - ${dataFim}</div>
        <div class="record-status">Registrado</div>
      </div>

      <div class="record-details">
        <div class="record-detail">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9a2 2 0 0 0-2-2V3a2 2 0 0 0-2 2v2a2 2 0 0 0-2 2"/></svg>
          <span><strong>Fluxo:</strong> ${registro.fluxo || 'Não informado'}</span>
        </div>
        <div class="record-detail">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>
          <span><strong>Humor:</strong> ${registro.humor || 'Não informado'}</span>
        </div>
        <div class="record-detail">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20v-6"/></svg>
          <span><strong>Cólica:</strong> ${registro.teveColica ? 'Sim' : 'Não'}</span>
        </div>
        ${registro.teveColica && registro.intensidadeColica ? `
          <div class="record-detail">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/></svg>
            <span><strong>Intensidade:</strong> ${registro.intensidadeColica}/10</span>
          </div>` : ''
        }
      </div>
      ${registro.observacoes ? `
        <div class="record-description">
          ${registro.observacoes}
        </div>` : ''
      }
    `;

    recordsGrid.appendChild(card);
  });
}

