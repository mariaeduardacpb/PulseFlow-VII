let ciclos = [];
let registrosMenstruacao = [];
let currentDate = new Date();

document.addEventListener('DOMContentLoaded', async () => {
  const calendarBody = document.getElementById('calendar-body');
  const monthYear = document.getElementById('month-year');
  const prevMonthBtn = document.getElementById('prev-month');
  const nextMonthBtn = document.getElementById('next-month');

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
    return;
  }

  try {
    // Buscar ciclos
    const resCiclos = await fetch(`http://localhost:5000/api/ciclo/${cpf}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!resCiclos.ok) throw new Error('Erro ao carregar ciclos');
    ciclos = await resCiclos.json();

    // Buscar registros de menstruação
    const resMenstruacao = await fetch(`http://localhost:5000/api/menstruacao/${cpf}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!resMenstruacao.ok) throw new Error('Erro ao carregar registros de menstruação');
    registrosMenstruacao = await resMenstruacao.json();

    console.log("Ciclos recebidos:", ciclos);
    console.log("Registros de menstruação recebidos:", registrosMenstruacao);

    if ((!Array.isArray(ciclos) || ciclos.length === 0) && 
        (!Array.isArray(registrosMenstruacao) || registrosMenstruacao.length === 0)) {
      calendarBody.innerHTML = '<tr><td colspan="7">Nenhum registro encontrado.</td></tr>';
      return;
    }

    renderCalendar(currentDate, ciclos, registrosMenstruacao);
  } catch (err) {
    console.error(err);
    calendarBody.innerHTML = '<tr><td colspan="7" style="color: red;">Erro ao buscar dados.</td></tr>';
  }
});

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
    const dataAtual = new Date(Date.UTC(year, month, day));
    dataAtual.setUTCHours(0, 0, 0, 0);

    let cicloAtivo = false;
    let registroAtivo = false;

    // Verificar ciclos
    for (const ciclo of ciclos) {
      const inicio = new Date(ciclo.dataInicio);
      const fim = new Date(ciclo.dataFim);
      inicio.setUTCHours(0, 0, 0, 0);
      fim.setUTCHours(0, 0, 0, 0);

      if (dataAtual >= inicio && dataAtual <= fim) {
        cicloAtivo = true;
        break;
      }
    }

    // Verificar registros de menstruação
    for (const registro of registrosMenstruacao) {
      const inicio = new Date(registro.dataInicio);
      const fim = new Date(registro.dataFim);
      inicio.setUTCHours(0, 0, 0, 0);
      fim.setUTCHours(0, 0, 0, 0);

      if (dataAtual >= inicio && dataAtual <= fim) {
        registroAtivo = true;
        break;
      }
    }

    if (cicloAtivo || registroAtivo) {
      cell.innerHTML = `
        <div class="day menstrual">
          ${day}
          <svg class="drop-icon" viewBox="0 0 24 24" width="24" height="24">
            <path fill="#e74c3c" d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
          </svg>
        </div>
      `;
    } else {
      cell.innerHTML = `<div class="day">${day}</div>`;
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
