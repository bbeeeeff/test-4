const calendarBody = document.getElementById('calendar-body');
const monthLabel = document.getElementById('month-label');
const prevBtn = document.getElementById('prev-month');
const nextBtn = document.getElementById('next-month');
const itemModal = document.getElementById('item-modal');
const modalDateLabel = document.getElementById('modal-date');
const itemList = document.getElementById('item-list');
const itemForm = document.getElementById('item-form');
const weeklySummary = document.getElementById('weekly-summary');
const monthlyTotalEl = document.getElementById('monthly-total');

let current = new Date();
let data = JSON.parse(localStorage.getItem('calendarData') || '{}');

function saveData() {
  localStorage.setItem('calendarData', JSON.stringify(data));
}

function renderCalendar() {
  calendarBody.innerHTML = '';
  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  monthLabel.textContent = current.toLocaleString('default', { month: 'long', year: 'numeric' });
  let date = 1;
  for (let week = 0; week < 6; week++) {
    const row = document.createElement('tr');
    for (let day = 0; day < 7; day++) {
      const cell = document.createElement('td');
      if ((week === 0 && day < firstDay) || date > daysInMonth) {
        cell.classList.add('empty');
      } else {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
        cell.dataset.date = dateStr;
        const span = document.createElement('span');
        span.className = 'day-number';
        span.textContent = date;
        cell.appendChild(span);
        if (data[dateStr]) {
          const total = data[dateStr].reduce((sum, item) => sum + item.total, 0);
          const totalSpan = document.createElement('span');
          totalSpan.className = 'item-total';
          totalSpan.textContent = `$${total.toFixed(2)}`;
          cell.appendChild(totalSpan);
        }
        cell.addEventListener('click', () => openModal(dateStr));
        date++;
      }
      row.appendChild(cell);
    }
    calendarBody.appendChild(row);
    if (date > daysInMonth) break;
  }
  updateSummaries();
}

function openModal(dateStr) {
  modalDateLabel.textContent = dateStr;
  itemForm.dataset.date = dateStr;
  const items = data[dateStr] || [];
  itemList.innerHTML = '';
  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = `${item.name}: $${item.total.toFixed(2)}`;
    itemList.appendChild(li);
  });
  itemForm.reset();
  document.getElementById('item-quantity').value = 1;
  document.getElementById('item-dollars').value = 0;
  document.getElementById('item-cents').value = 0;
  itemModal.classList.remove('hidden');
}

document.getElementById('close-modal').addEventListener('click', () => {
  itemModal.classList.add('hidden');
});

itemForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const dateStr = itemForm.dataset.date;
  const items = data[dateStr] || [];
  const nameInput = document.getElementById('item-name');
  const name = nameInput.value.trim() || `Purchase ${items.length + 1}`;
  const description = document.getElementById('item-description').value.trim();
  const quantity = parseInt(document.getElementById('item-quantity').value, 10) || 1;
  const dollars = parseInt(document.getElementById('item-dollars').value, 10) || 0;
  const cents = parseInt(document.getElementById('item-cents').value, 10) || 0;
  const total = quantity * (dollars + cents / 100);
  items.push({ name, description, quantity, dollars, cents, total });
  data[dateStr] = items;
  saveData();
  itemModal.classList.add('hidden');
  renderCalendar();
});

prevBtn.addEventListener('click', () => {
  current.setMonth(current.getMonth() - 1);
  renderCalendar();
});

nextBtn.addEventListener('click', () => {
  current.setMonth(current.getMonth() + 1);
  renderCalendar();
});

function weekIndex(dateObj) {
  const startOfWeek = new Date(dateObj);
  startOfWeek.setDate(dateObj.getDate() - dateObj.getDay());
  const startOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
  startOfMonth.setDate(startOfMonth.getDate() - startOfMonth.getDay());
  return Math.floor((startOfWeek - startOfMonth) / (7 * 24 * 60 * 60 * 1000));
}

function updateSummaries() {
  const year = current.getFullYear();
  const month = current.getMonth();
  const weeklyTotals = {};
  let monthlyTotal = 0;
  for (const [dateStr, items] of Object.entries(data)) {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (y === year && m - 1 === month) {
      const total = items.reduce((sum, i) => sum + i.total, 0);
      monthlyTotal += total;
      const dateObj = new Date(y, m - 1, d);
      const w = weekIndex(dateObj);
      weeklyTotals[w] = (weeklyTotals[w] || 0) + total;
    }
  }
  weeklySummary.innerHTML = '';
  Object.keys(weeklyTotals).sort((a, b) => a - b).forEach((w) => {
    const li = document.createElement('li');
    li.textContent = `Week ${Number(w) + 1}: $${weeklyTotals[w].toFixed(2)}`;
    weeklySummary.appendChild(li);
  });
  monthlyTotalEl.textContent = `$${monthlyTotal.toFixed(2)}`;
}

renderCalendar();
