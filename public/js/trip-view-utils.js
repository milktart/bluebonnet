/**
 * Trip View - Utilities
 * Helper functions for trip view
 * Note: Date/time formatting functions are in datetime-formatter.js
 * Note: Airport autocomplete is now in airport-autocomplete.js (AJAX-based)
 */

function lookupAirline(flightNumber, airlineFieldId = null) {
  // Find the airline field - try the provided ID first, then look for any airline field
  const airlineField = airlineFieldId
    ? document.getElementById(airlineFieldId)
    : document.getElementById('airline') || document.getElementById('editAirline');

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
  const airline = airlineData.find((a) => a.iata === airlineCode);

  if (airline) {
    airlineField.value = airline.name;
  } else {
    airlineField.value = '';
  }
}

function formatTimeInput(input) {
  if (input && input.value) {
    const timeValue = input.value.replace(/[^\d]/g, '');

    if (timeValue.length === 3) {
      input.value = `0${timeValue[0]}:${timeValue.slice(1)}`;
    } else if (timeValue.length === 4) {
      input.value = `${timeValue.slice(0, 2)}:${timeValue.slice(2)}`;
    }
  }
}

function initFlightDateTimePickers() {
  const departureTimeInput = document.getElementById('flightDepartureTime');
  const arrivalTimeInput = document.getElementById('flightArrivalTime');

  if (departureTimeInput) {
    departureTimeInput.addEventListener('blur', function (e) {
      formatTimeInput(this);
    });

    departureTimeInput.addEventListener('keydown', function (e) {
      if (
        e.key !== 'Backspace' &&
        e.key !== 'Delete' &&
        this.value.length === 2 &&
        !this.value.includes(':')
      ) {
        this.value += ':';
      }
    });
  }

  if (arrivalTimeInput) {
    arrivalTimeInput.addEventListener('blur', function (e) {
      formatTimeInput(this);
    });

    arrivalTimeInput.addEventListener('keydown', function (e) {
      if (
        e.key !== 'Backspace' &&
        e.key !== 'Delete' &&
        this.value.length === 2 &&
        !this.value.includes(':')
      ) {
        this.value += ':';
      }
    });
  }
}

// === Additional Trip Utility Functions ===

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
  const dates = items.map((item) => new Date(item[dateField]));
  return new Date(Math.max(...dates));
}

// Make all functions available globally
if (typeof window !== 'undefined') {
  window.getFlightNum = getFlightNum;
  window.getCityName = getCityName;
  window.formatDateTimeLocal = formatDateTimeLocal;
  window.getLatestDate = getLatestDate;
  window.initFlightDateTimePickers = initFlightDateTimePickers;
  window.lookupAirline = lookupAirline;
}
