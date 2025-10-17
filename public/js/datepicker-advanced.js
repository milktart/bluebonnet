/**
 * Advanced Datepicker Implementation
 * Handles date selection with custom calendar UI
 */

function initAdvancedDatepickers() {
  const departureDateInput = document.getElementById('departureDate');
  const returnDateInput = document.getElementById('returnDate');

  if (departureDateInput) {
    createAdvancedDatepicker(departureDateInput, 'departure');
  }
  if (returnDateInput) {
    createAdvancedDatepicker(returnDateInput, 'return');
  }
}

function createAdvancedDatepicker(inputElement, type) {
  const calendarId = `calendar-${type}-${Date.now()}`;

  function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  function createCalendar() {
    const calendar = document.createElement('div');
    calendar.id = calendarId;
    calendar.className = 'fixed p-4 bg-white border border-gray-200 rounded-lg shadow-lg hidden';
    calendar.style.width = '300px';
    calendar.style.zIndex = '9999';
    calendar.style.maxHeight = '400px';
    calendar.style.overflow = 'visible';

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    calendar.innerHTML = `
      <div class="flex items-center justify-between mb-4">
        <button type="button" class="prev-month p-2 hover:bg-gray-100 rounded">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <h3 class="font-semibold text-gray-900 month-year"></h3>
        <button type="button" class="next-month p-2 hover:bg-gray-100 rounded">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
      <div class="grid grid-cols-7 gap-1 mb-2">
        <div class="text-center text-xs font-medium text-gray-500 p-2">Su</div>
        <div class="text-center text-xs font-medium text-gray-500 p-2">Mo</div>
        <div class="text-center text-xs font-medium text-gray-500 p-2">Tu</div>
        <div class="text-center text-xs font-medium text-gray-500 p-2">We</div>
        <div class="text-center text-xs font-medium text-gray-500 p-2">Th</div>
        <div class="text-center text-xs font-medium text-gray-500 p-2">Fr</div>
        <div class="text-center text-xs font-medium text-gray-500 p-2">Sa</div>
      </div>
      <div class="calendar-days grid grid-cols-7 gap-1"></div>
    `;

    document.body.appendChild(calendar);

    let selectedDate = null;
    let displayMonth = currentMonth;
    let displayYear = currentYear;

    function renderCalendar() {
      const daysContainer = calendar.querySelector('.calendar-days');
      const monthYearElement = calendar.querySelector('.month-year');

      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      monthYearElement.textContent = `${months[displayMonth]} ${displayYear}`;

      daysContainer.innerHTML = '';

      const firstDay = new Date(displayYear, displayMonth, 1);
      const lastDay = new Date(displayYear, displayMonth + 1, 0);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());

      for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);

        const dayElement = document.createElement('button');
        dayElement.type = 'button';
        dayElement.className = 'p-2 text-sm rounded hover:bg-gray-100 transition-colors';
        dayElement.textContent = date.getDate();

        if (date.getMonth() !== displayMonth) {
          dayElement.className += ' text-gray-400';
        } else {
          dayElement.className += ' text-gray-900';
        }

        if (date.toDateString() === new Date().toDateString()) {
          dayElement.className += ' bg-blue-100 text-blue-600';
        }

        if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
          dayElement.className += ' bg-blue-600 text-white hover:bg-blue-700';
        }

        dayElement.addEventListener('click', () => {
          selectedDate = new Date(date);
          inputElement.value = formatDate(selectedDate);
          calendar.classList.add('hidden');
          const event = new Event('change', { bubbles: true });
          inputElement.dispatchEvent(event);
        });

        daysContainer.appendChild(dayElement);
      }
    }

    calendar.querySelector('.prev-month').addEventListener('click', () => {
      displayMonth--;
      if (displayMonth < 0) {
        displayMonth = 11;
        displayYear--;
      }
      renderCalendar();
    });

    calendar.querySelector('.next-month').addEventListener('click', () => {
      displayMonth++;
      if (displayMonth > 11) {
        displayMonth = 0;
        displayYear++;
      }
      renderCalendar();
    });

    renderCalendar();
    return calendar;
  }

  const calendar = createCalendar();

  inputElement.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('[id^="calendar-"]').forEach(cal => {
      if (cal.id !== calendarId) {
        cal.classList.add('hidden');
      }
    });

    const rect = inputElement.getBoundingClientRect();
    calendar.style.top = (rect.bottom + window.scrollY + 8) + 'px';
    calendar.style.left = rect.left + 'px';

    const calendarRect = calendar.getBoundingClientRect();
    if (rect.left + 300 > window.innerWidth) {
      calendar.style.left = (window.innerWidth - 320) + 'px';
    }
    if (rect.bottom + 400 > window.innerHeight) {
      calendar.style.top = (rect.top + window.scrollY - 400 - 8) + 'px';
    }

    calendar.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!inputElement.contains(e.target) && !calendar.contains(e.target)) {
      calendar.classList.add('hidden');
    }
  });
}
