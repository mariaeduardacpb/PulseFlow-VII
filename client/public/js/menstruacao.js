let ciclos = [];
let registrosMenstruacao = [];
let currentDate = new Date();

document.addEventListener('DOMContentLoaded', async () => {
  const calendarBody = document.getElementById('calendar-body');
  const monthYear = document.getElementById('month-year');
  const prevMonthBtn = document.getElementById('prev-month');
  const nextMonthBtn = document.getElementById('next-month');
  const recordsContainer = document.getElementById('records-container');

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

  // Mostrar loading state
  calendarBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Carregando dados...</td></tr>';
  recordsContainer.innerHTML = '<p>Carregando registros...</p>';

  try {
    // Debug endpoint para verificar os ciclos
    console.log("[Data Fetching] Iniciando debug de ciclos para CPF:", cpf);
    const debugRes = await fetch(`http://localhost:5000/api/ciclo/debug/${cpf}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (debugRes.ok) {
      const debugData = await debugRes.json();
      console.log("[Data Fetching] Debug de ciclos:", debugData);
    }

    // Buscar ciclos
    console.log("[Data Fetching] Iniciando busca de ciclos para CPF:", cpf);
    const resCiclos = await fetch(`http://localhost:5000/api/ciclo/${cpf}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!resCiclos.ok) {
      throw new Error(`Erro ao carregar ciclos: ${resCiclos.statusText}`);
    }
    
    const ciclosResponse = await resCiclos.json();
    console.log("[Data Fetching] Resposta bruta dos ciclos:", ciclosResponse);
    
    // Verificar se a resposta é um array
    if (!Array.isArray(ciclosResponse)) {
      console.error("[Data Fetching] Resposta dos ciclos não é um array:", ciclosResponse);
      ciclos = [];
    } else {
      ciclos = ciclosResponse;
    }
    
    console.log("[Data Fetching] Ciclos processados:", {
      status: resCiclos.status,
      ciclosLength: ciclos?.length,
      ciclosData: ciclos,
      isArray: Array.isArray(ciclos)
    });

    // Buscar registros de menstruação
    console.log("[Data Fetching] Iniciando busca de registros de menstruação para CPF:", cpf);
    const resMenstruacao = await fetch(`http://localhost:5000/api/menstruacao/${cpf}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!resMenstruacao.ok) {
      throw new Error(`Erro ao carregar registros de menstruação: ${resMenstruacao.statusText}`);
    }
    
    const registrosResponse = await resMenstruacao.json();
    console.log("[Data Fetching] Resposta bruta dos registros:", registrosResponse);
    
    // Verificar se a resposta é um array
    if (!Array.isArray(registrosResponse)) {
      console.error("[Data Fetching] Resposta dos registros não é um array:", registrosResponse);
      registrosMenstruacao = [];
    } else {
      registrosMenstruacao = registrosResponse;
    }
    
    console.log("[Data Fetching] Registros processados:", {
      status: resMenstruacao.status,
      registrosLength: registrosMenstruacao?.length,
      registrosData: registrosMenstruacao,
      isArray: Array.isArray(registrosMenstruacao)
    });

    if ((!Array.isArray(ciclos) || ciclos.length === 0) && 
        (!Array.isArray(registrosMenstruacao) || registrosMenstruacao.length === 0)) {
      console.log("[Data Fetching] Nenhum dado encontrado");
      calendarBody.innerHTML = '<tr><td colspan="7">Nenhum registro encontrado.</td></tr>';
      recordsContainer.innerHTML = '<p>Nenhum registro encontrado.</p>';
      // Limpar estatísticas
      document.getElementById('last-menstruation').textContent = '--';
      document.getElementById('avg-duration').textContent = '--';
      document.getElementById('avg-cycle-length').textContent = '--';
      return;
    }

    // Log adicional para verificar as datas dos ciclos
    ciclos.forEach((ciclo, index) => {
      console.log(`Ciclo ${index + 1}:`, {
        dataInicio: new Date(ciclo.dataInicio),
        dataFim: new Date(ciclo.dataFim)
      });
    });

    renderCalendar(currentDate, ciclos, registrosMenstruacao);
    renderRecords(registrosMenstruacao);
    displayStats(registrosMenstruacao, ciclos);
  } catch (err) {
    console.error('Erro ao carregar dados:', err);
    calendarBody.innerHTML = `<tr><td colspan="7" style="color: red;">Erro ao buscar dados: ${err.message}</td></tr>`;
    recordsContainer.innerHTML = `<p style="color: red;">Erro ao buscar dados: ${err.message}</p>`;
  }
});

function formatDate(date) {
  return new Date(date).toLocaleDateString('pt-BR');
}

function renderRecords(registros) {
  const recordsContainer = document.getElementById('records-container');
  
  if (!Array.isArray(registros) || registros.length === 0) {
    recordsContainer.innerHTML = '<p>Nenhum registro encontrado.</p>';
    return;
  }

  // Ordenar registros por data de início (mais recente primeiro)
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
    // Set currentDate to the beginning of the day in local time
    currentDate.setHours(0, 0, 0, 0);

    let cicloAtivo = false;
    let registroAtivo = false;
    let registroInfo = null;

    // Verificar ciclos
    for (const ciclo of ciclos) {
      // Create Date objects from ISO strings. These are parsed as UTC by default.
      const periodStart = new Date(ciclo.dataInicio);
      const periodEnd = new Date(ciclo.dataFim);

      // To compare correctly with local currentDate (start of the day),
      // we need to ensure the periodEnd includes the entire last day.
      // We can do this by comparing local currentDate with the UTC dates.
      // If currentDate (local) falls on or after periodStart (UTC) and
      // strictly before periodEnd + 1 day (UTC), it's within the range.
      
      // Create a Date object for the day *after* the periodEnd in UTC
      const dayAfterPeriodEnd = new Date(periodEnd);
      dayAfterPeriodEnd.setUTCDate(periodEnd.getUTCDate() + 1);
      // We need to compare local currentDate with these UTC dates correctly.
      // Convert local currentDate to UTC for comparison.
      const currentDateUTC = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()));

      if (currentDateUTC >= periodStart && currentDateUTC < dayAfterPeriodEnd) {
        cicloAtivo = true;
        break;
      }
    }

    // Verificar registros de menstruação
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
      // Dia de menstruação
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
      // Dia de ciclo
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

  // Última Menstruação
  if (registros.length > 0) {
    // Ordenar por data de início decrescente para encontrar a última
    const sortedRegistros = [...registros].sort((a, b) => new Date(b.dataInicio) - new Date(a.dataInicio));
    const ultimoRegistro = sortedRegistros[0];
    
    // Usar as datas exatamente como estão no banco
    const dataInicioFormatada = formatDate(ultimoRegistro.dataInicio);
    const dataFimFormatada = formatDate(ultimoRegistro.dataFim);
    lastMenstruationEl.textContent = `${dataInicioFormatada} a ${dataFimFormatada}`;
  } else {
    lastMenstruationEl.textContent = 'N/A';
  }

  // Tempo Médio de Duração da Menstruação
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
