const monthYear = document.getElementById('month-year');
const calendarBody = document.getElementById('calendar-body');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');

let currentDate = new Date(2025, 3); // Começando Abril 2025

function renderCalendar(date) {
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
    const cell = document.createElement('td');
    row.appendChild(cell);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    if (row.children.length === 7) {
      calendarBody.appendChild(row);
      row = document.createElement('tr');
    }

    const cell = document.createElement('td');
    cell.textContent = day;
    row.appendChild(cell);
  }

  if (row.children.length > 0) {
    while (row.children.length < 7) {
      const emptyCell = document.createElement('td');
      row.appendChild(emptyCell);
    }
    calendarBody.appendChild(row);
  }
}

prevMonthBtn.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar(currentDate);
});

nextMonthBtn.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar(currentDate);
});

renderCalendar(currentDate);
