/**
 * Trip View - Utilities
 * Airport search and helper functions
 * Note: Date/time formatting functions are in datetime-formatter.js
 */

function lookupAirline(flightNumber, airlineFieldId = null) {
  // Find the airline field - try the provided ID first, then look for any airline field
  let airlineField = airlineFieldId ? document.getElementById(airlineFieldId) :
                     document.getElementById('airline') || document.getElementById('editAirline');

  if (!airlineField) return;

  if (!flightNumber) {
    airlineField.value = '';
    return;
  }

  const airlineCodeMatch = flightNumber.match(/^([A-Z]{1,3})/);
  if (!airlineCodeMatch) {
    airlineField.value = '';
    return;
  }

  const airlineCode = airlineCodeMatch[1];
  const airline = airlineData.find(a => a.iata === airlineCode);

  if (airline) {
    airlineField.value = airline.name;
  } else {
    airlineField.value = '';
  }
}

// Note: airportsData is declared globally in view.ejs

function formatAirportDisplay(code, airport) {
  return `${code} - ${airport.airport_name}, ${airport.city_name}, ${airport.country_name}`;
}

function searchAirports(query) {
  if (!query || query.length < 2) return [];

  const lowerQuery = query.toLowerCase();
  const results = [];

  // Use flight form airports if available (full dataset), otherwise use limited airportsData
  const airportSource = (typeof window !== 'undefined' && window.flightFormAirports) ? window.flightFormAirports : airportsData;

  console.log('Using airport source with', Object.keys(airportSource).length, 'airports');

  Object.entries(airportSource).forEach(([code, airport]) => {
    const airportName = airport.airport_name || '';
    const cityName = airport.city_name || '';
    const countryName = airport.country_name || '';
    const searchText = `${code} ${airportName} ${cityName} ${countryName}`.toLowerCase();

    if (searchText.includes(lowerQuery)) {
      results.push({
        code: code,
        airport: airport,
        display: formatAirportDisplay(code, airport),
        relevance: calculateRelevance(lowerQuery, code, airport)
      });
    }
  });

  results.sort((a, b) => b.relevance - a.relevance);
  return results.slice(0, 10);
}

function calculateRelevance(query, code, airport) {
  let score = 0;
  const lowerCode = code.toLowerCase();
  const lowerAirportName = airport.airport_name.toLowerCase();
  const lowerCityName = airport.city_name.toLowerCase();
  const lowerCountryName = airport.country_name.toLowerCase();

  if (lowerCode === query) {
    score += 1000;
  } else if (lowerCode.startsWith(query)) {
    score += 900;
  } else if (lowerCityName === query) {
    score += 800;
  } else if (lowerCityName.startsWith(query)) {
    score += 700;
  } else if (lowerAirportName.startsWith(query)) {
    score += 600;
  } else if (lowerCityName.includes(query)) {
    score += 500;
  } else if (lowerAirportName.includes(query)) {
    score += 400;
  } else if (lowerCountryName.includes(query)) {
    score += 300;
  }

  if (lowerCode === query) score += 500;
  if (lowerCityName === query) score += 400;
  if (lowerAirportName === query) score += 300;

  return score;
}

function formatTimeInput(input) {
  if (input && input.value) {
    let timeValue = input.value.replace(/[^\d]/g, '');

    if (timeValue.length === 3) {
      input.value = '0' + timeValue[0] + ':' + timeValue.slice(1);
    } else if (timeValue.length === 4) {
      input.value = timeValue.slice(0, 2) + ':' + timeValue.slice(2);
    }
  }
}

function initFlightDateTimePickers() {
  const departureTimeInput = document.getElementById('flightDepartureTime');
  const arrivalTimeInput = document.getElementById('flightArrivalTime');

  if (departureTimeInput) {
    departureTimeInput.addEventListener('blur', function(e) {
      formatTimeInput(this);
    });

    departureTimeInput.addEventListener('keydown', function(e) {
      if (e.key !== 'Backspace' && e.key !== 'Delete' && this.value.length === 2 && !this.value.includes(':')) {
        this.value = this.value + ':';
      }
    });
  }

  if (arrivalTimeInput) {
    arrivalTimeInput.addEventListener('blur', function(e) {
      formatTimeInput(this);
    });

    arrivalTimeInput.addEventListener('keydown', function(e) {
      if (e.key !== 'Backspace' && e.key !== 'Delete' && this.value.length === 2 && !this.value.includes(':')) {
        this.value = this.value + ':';
      }
    });
  }
}

function initAirportSearch() {
  // Find all inputs with name="origin" or name="destination" and initialize them
  const originInputs = document.querySelectorAll('input[name="origin"]');
  const destinationInputs = document.querySelectorAll('input[name="destination"]');

  console.log('Found ' + originInputs.length + ' origin inputs');
  console.log('Found ' + destinationInputs.length + ' destination inputs');

  originInputs.forEach(input => {
    const container = input.closest('[data-hs-combobox]');
    if (container) {
      initCustomComboboxByInput(input);
    }
  });

  destinationInputs.forEach(input => {
    const container = input.closest('[data-hs-combobox]');
    if (container) {
      initCustomComboboxByInput(input);
    }
  });
}

function initCustomComboboxByInput(input) {
  if (!input) return;

  const container = input.closest('[data-hs-combobox]');
  if (!container) return;

  const dropdown = container.querySelector('[data-hs-combobox-output]');
  if (!dropdown) return;

  const itemsWrapper = dropdown.querySelector('[data-hs-combobox-output-items-wrapper]');
  if (!itemsWrapper) return;

  attachAirportSearchListeners(input, dropdown, itemsWrapper);
}

function initCustomCombobox(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const container = input.closest('[data-hs-combobox]');
  if (!container) return;

  const dropdown = container.querySelector('[data-hs-combobox-output]');
  if (!dropdown) return;

  const itemsWrapper = dropdown.querySelector('[data-hs-combobox-output-items-wrapper]');
  if (!itemsWrapper) return;

  attachAirportSearchListeners(input, dropdown, itemsWrapper);
}

function attachAirportSearchListeners(input, dropdown, itemsWrapper) {

  input.addEventListener('input', function() {
    const query = this.value;
    console.log('Airport search query:', query);

    if (query.length < 2) {
      dropdown.classList.add('hidden');
      return;
    }

    const results = searchAirports(query);
    console.log('Airport search results:', results.length);
    itemsWrapper.innerHTML = '';

    // Ensure wrapper has proper overflow handling
    itemsWrapper.className = 'overflow-y-auto max-h-64';

    if (results.length === 0) {
      itemsWrapper.innerHTML = '<div class="py-2 px-4 text-sm text-gray-500">No airports found</div>';
    } else {
      results.forEach(result => {
        const item = document.createElement('div');
        item.className = 'cursor-pointer py-2 px-4 w-full text-sm text-gray-800 hover:bg-gray-100 rounded-lg focus:outline-none focus:bg-gray-100';
        item.setAttribute('data-hs-combobox-output-item', '');
        item.setAttribute('tabindex', '0');

        item.innerHTML = `
          <div class="flex justify-between items-center w-full min-w-0">
            <div class="min-w-0 flex-1">
              <div class="font-medium truncate">${result.code}</div>
              <div class="text-xs text-gray-500 truncate">${result.airport.airport_name}</div>
              <div class="text-xs text-gray-400 truncate">${result.airport.city_name}, ${result.airport.country_name}</div>
            </div>
          </div>
        `;

        item.addEventListener('click', function() {
          input.value = result.display;
          dropdown.classList.add('hidden');
          const event = new Event('change', { bubbles: true });
          input.dispatchEvent(event);
        });

        itemsWrapper.appendChild(item);
      });
    }

    dropdown.classList.remove('hidden');
  });

  input.addEventListener('focus', function() {
    if (this.value.length >= 2) {
      dropdown.classList.remove('hidden');
    }
  });

  input.addEventListener('blur', function() {
    setTimeout(() => {
      dropdown.classList.add('hidden');
    }, 200);
  });

  input.addEventListener('keydown', function(e) {
    const items = dropdown.querySelectorAll('[data-hs-combobox-output-item]');
    const activeItem = dropdown.querySelector('[data-hs-combobox-output-item].bg-gray-100');

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      let nextItem = activeItem ? activeItem.nextElementSibling : items[0];
      if (!nextItem) nextItem = items[0];
      items.forEach(item => item.classList.remove('bg-gray-100'));
      if (nextItem) nextItem.classList.add('bg-gray-100');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      let prevItem = activeItem ? activeItem.previousElementSibling : items[items.length - 1];
      if (!prevItem) prevItem = items[items.length - 1];
      items.forEach(item => item.classList.remove('bg-gray-100'));
      if (prevItem) prevItem.classList.add('bg-gray-100');
    } else if (e.key === 'Enter' && activeItem) {
      e.preventDefault();
      activeItem.click();
    } else if (e.key === 'Escape') {
      dropdown.classList.add('hidden');
    }
  });
}

// === Additional Trip Utility Functions (from trip-utils.js) ===

/**
 * Extract flight number without airline code
 * @param {string} flightNumber - Full flight number (e.g., "AA100")
 * @returns {string} - Just the numeric part (e.g., "100")
 */
function getFlightNum(flightNumber) {
  const match = flightNumber.match(/(\d+)$/);
  return match ? match[1] : flightNumber;
}

/**
 * Extract city name from location string
 * @param {string} location - Location string (e.g., "JFK - New York, USA")
 * @returns {string} - City name (e.g., "New York")
 */
function getCityName(location) {
  if (location.includes(' - ')) {
    const parts = location.split(' - ')[1];
    if (parts && parts.includes(',')) {
      return parts.split(',')[0].trim();
    }
    return parts;
  }
  return location.split(' - ')[0] || location;
}

/**
 * Format date for datetime-local input
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted string (YYYY-MM-DDTHH:MM)
 */
function formatDateTimeLocal(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Get latest date from a list of items
 * @param {Array} items - Array of items
 * @param {string} dateField - Field name containing the date
 * @returns {Date|null} - Latest date or null
 */
function getLatestDate(items, dateField) {
  if (!items || items.length === 0) return null;
  const dates = items.map(item => new Date(item[dateField]));
  return new Date(Math.max(...dates));
}

// Make all functions available globally
if (typeof window !== 'undefined') {
  window.getFlightNum = getFlightNum;
  window.getCityName = getCityName;
  window.formatDateTimeLocal = formatDateTimeLocal;
  window.getLatestDate = getLatestDate;
  window.initAirportSearch = initAirportSearch;
  window.searchAirports = searchAirports;
  window.lookupAirline = lookupAirline;
}
