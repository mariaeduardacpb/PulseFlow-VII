import { API_URL } from './config.js';

let ciclos = [];
let registrosMenstruacao = [];
let currentDate = new Date();

document.addEventListener('DOMContentLoaded', async () => {
  const calendarBody = document.getElementById('calendar-body');
  const monthYear = document.getElementById('month-year');
  const prevMonthBtn = document.getElementById('prev-month');
  const nextMonthBtn = document.getElementById('next-month');
  const recordsContainer = document.getElementById('records-container');
  const toggleButton = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');

  toggleButton?.addEventListener("click", () => {
    sidebar?.classList.toggle("active");
    toggleButton?.classList.toggle("shifted");
  });

  await carregarDadosMedico(); // <-- Nome do médico na sidebar

  // Navegação entre os meses
  prevMonthBtn.addEventListener('click', () => {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    renderCalendar(currentDate, ciclos, registrosMenstruacao);
  });

  nextMonthBtn.addEventListener('click', () => {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    renderCalendar(currentDate, ciclos, registrosMenstruacao);
  });

  const paciente = JSON.parse(localStorage.getItem("pacienteSelecionado"));
  const cpf = paciente?.cpf;
  const token = localStorage.getItem("token");

  if (!cpf) {
    calendarBody.innerHTML = '<tr><td colspan="7" style="color: red;">Paciente não selecionado.</td></tr>';
    recordsContainer.innerHTML = '<p style="color: red;">Paciente não selecionado.</p>';
    return;
  }

  calendarBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Carregando dados...</td></tr>';
  recordsContainer.innerHTML = '<p>Carregando registros...</p>';

  try {
    const debugRes = await fetch(`${API_URL}/api/ciclo/debug/${cpf}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (debugRes.ok) {
      const debugData = await debugRes.json();
      console.log("[DEBUG] Ciclos:", debugData);
    }

    const resCiclos = await fetch(`${API_URL}/api/ciclo/${cpf}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!resCiclos.ok) throw new Error(`Erro ao carregar ciclos: ${resCiclos.statusText}`);
    const ciclosResponse = await resCiclos.json();
    ciclos = Array.isArray(ciclosResponse) ? ciclosResponse : [];

    const resMenstruacao = await fetch(`${API_URL}/api/menstruacao/${cpf}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!resMenstruacao.ok) throw new Error(`Erro ao carregar registros de menstruação: ${resMenstruacao.statusText}`);
    const registrosResponse = await resMenstruacao.json();
    registrosMenstruacao = Array.isArray(registrosResponse) ? registrosResponse : [];

    if ((!Array.isArray(ciclos) || ciclos.length === 0) && 
        (!Array.isArray(registrosMenstruacao) || registrosMenstruacao.length === 0)) {
      calendarBody.innerHTML = '<tr><td colspan="7">Nenhum registro encontrado.</td></tr>';
      recordsContainer.innerHTML = '<p>Nenhum registro encontrado.</p>';
      document.getElementById('last-menstruation').textContent = '--';
      document.getElementById('avg-duration').textContent = '--';
      document.getElementById('avg-cycle-length').textContent = '--';
      return;
    }

    renderCalendar(currentDate, ciclos, registrosMenstruacao);
    renderRecords(registrosMenstruacao);
    displayStats(registrosMenstruacao, ciclos);
  } catch (err) {
    console.error('Erro ao carregar dados:', err);
    calendarBody.innerHTML = `<tr><td colspan="7" style="color: red;">Erro ao buscar dados: ${err.message}</td></tr>`;
    recordsContainer.innerHTML = `<p style="color: red;">Erro ao buscar dados: ${err.message}</p>`;
  }
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

function formatDate(date) {
  return new Date(date).toLocaleDateString('pt-BR');
}

function renderRecords(registros) {
  const recordsContainer = document.getElementById('records-container');
  
  if (!Array.isArray(registros) || registros.length === 0) {
    recordsContainer.innerHTML = '<p>Nenhum registro encontrado.</p>';
    return;
  }

  registros.sort((a, b) => new Date(b.dataInicio) - new Date(a.dataInicio));

  const recordsHTML = registros.map(registro => `
    <div class="record-card">
      <div class="date-range">
        ${formatDate(registro.dataInicio)} - ${formatDate(registro.dataFim)}
      </div>
      <div class="details">
        <div class="detail-item">
          <span class="detail-label">Fluxo</span>
          <span class="detail-value">${registro.fluxo || 'Não informado'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Humor</span>
          <span class="detail-value">${registro.humor || 'Não informado'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Cólica</span>
          <span class="detail-value">${registro.teveColica ? 'Sim' : 'Não'}</span>
        </div>
        ${registro.teveColica ? `
          <div class="detail-item">
            <span class="detail-label">Intensidade da Cólica</span>
            <span class="detail-value">${registro.intensidadeColica}/10</span>
          </div>
        ` : ''}
      </div>
      ${registro.observacoes ? `
        <div class="observacoes">
          <span class="detail-label">Observações</span>
          <span class="detail-value">${registro.observacoes}</span>
        </div>
      ` : ''}
    </div>
  `).join('');

  recordsContainer.innerHTML = recordsHTML;
}

function renderCalendar(date, ciclos, registrosMenstruacao) {
  const monthYear = document.getElementById('month-year');
  const calendarBody = document.getElementById('calendar-body');

  const year = date.getFullYear();
  const month = date.getMonth();

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  monthYear.textContent = `${monthNames[month]} - ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  calendarBody.innerHTML = "";
  let row = document.createElement('tr');

  for (let i = 0; i < firstDay; i++) {
    row.appendChild(document.createElement('td'));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    if (row.children.length === 7) {
      calendarBody.appendChild(row);
      row = document.createElement('tr');
    }

    const cell = document.createElement('td');
    const currentDate = new Date(year, month, day);
    currentDate.setHours(0, 0, 0, 0);

    let cicloAtivo = false;
    let registroAtivo = false;
    let registroInfo = null;

    for (const ciclo of ciclos) {
      const periodStart = new Date(ciclo.dataInicio);
      const periodEnd = new Date(ciclo.dataFim);
      const dayAfterPeriodEnd = new Date(periodEnd);
      dayAfterPeriodEnd.setUTCDate(periodEnd.getUTCDate() + 1);
      const currentDateUTC = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()));

      if (currentDateUTC >= periodStart && currentDateUTC < dayAfterPeriodEnd) {
        cicloAtivo = true;
        break;
      }
    }

    for (const registro of registrosMenstruacao) {
      const periodStart = new Date(registro.dataInicio);
      const periodEnd = new Date(registro.dataFim);
      const dayAfterPeriodEnd = new Date(periodEnd);
      dayAfterPeriodEnd.setUTCDate(periodEnd.getUTCDate() + 1);
      const currentDateUTC = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()));

      if (currentDateUTC >= periodStart && currentDateUTC < dayAfterPeriodEnd) {
        registroAtivo = true;
        registroInfo = registro;
        break;
      }
    }

    if (registroAtivo) {
      const tooltipTitle = `Dia de menstruação\nFluxo: ${registroInfo.fluxo || 'Não informado'}\nCólicas: ${registroInfo.teveColica ? 'Sim' + (registroInfo.intensidadeColica ? ' (' + registroInfo.intensidadeColica + '/10)' : '') : 'Não'}\nHumor: ${registroInfo.humor || 'Não informado'}`;
      cell.innerHTML = `
        <div class="day menstrual" title="${tooltipTitle}">
          <span class="day-number">${day}</span>
          <svg class="drop-icon" viewBox="0 0 24 24" width="24" height="24">
            <path fill="#e74c3c" d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
          </svg>
        </div>
      `;
    } else if (cicloAtivo) {
      cell.innerHTML = `
        <div class="day cycle" title="Período do ciclo">
          <span class="day-number">${day}</span>
          <div class="cycle-indicator"></div>
        </div>
      `;
    } else {
      cell.innerHTML = `<div class="day"><span class="day-number">${day}</span></div>`;
    }

    row.appendChild(cell);
  }

  if (row.children.length > 0) {
    while (row.children.length < 7) {
      row.appendChild(document.createElement('td'));
    }
    calendarBody.appendChild(row);
  }
}

function displayStats(registros, ciclos) {
  const lastMenstruationEl = document.getElementById('last-menstruation');
  const avgDurationEl = document.getElementById('avg-duration');

  if (registros.length > 0) {
    const sortedRegistros = [...registros].sort((a, b) => new Date(b.dataInicio) - new Date(a.dataInicio));
    const ultimoRegistro = sortedRegistros[0];
    const dataInicioFormatada = formatDate(ultimoRegistro.dataInicio);
    const dataFimFormatada = formatDate(ultimoRegistro.dataFim);
    lastMenstruationEl.textContent = `${dataInicioFormatada} a ${dataFimFormatada}`;
  } else {
    lastMenstruationEl.textContent = 'N/A';
  }

  if (registros.length > 0) {
    const totalDuration = registros.reduce((sum, registro) => {
      const inicio = new Date(registro.dataInicio);
      const fim = new Date(registro.dataFim);
      const durationMs = fim.getTime() - inicio.getTime();
      const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
      return sum + durationDays;
    }, 0);
    const avgDuration = (totalDuration / registros.length).toFixed(1);
    avgDurationEl.textContent = `${avgDuration} dias`;
  } else {
    avgDurationEl.textContent = 'N/A';
  }
}