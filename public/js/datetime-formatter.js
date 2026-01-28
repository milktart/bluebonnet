/**
 * DateTime Formatting Module
 * Wraps functions from utils/dateFormatter.js and exposes them globally
 * This file is kept for backward compatibility and is bundled with the frontend
 * The actual implementations are in utils/dateFormatter.js for code reuse
 */

// Constants
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MS_PER_HOUR = 1000 * 60 * 60;

// All formatting logic is duplicated here to work in the browser environment
// This ensures no dependency on server-side modules

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

function formatDateTime(dateString) {
  if (!dateString) return '';
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
}

function validateTimezone(timezone) {
  return timezone &&
    typeof timezone === 'string' &&
    timezone.trim() &&
    timezone !== 'undefined' &&
    timezone !== 'null'
    ? timezone.trim()
    : null;
}

function getUTCDateParts(date) {
  return {
    year: String(date.getUTCFullYear()),
    month: String(date.getUTCMonth() + 1).padStart(2, '0'),
    day: String(date.getUTCDate()).padStart(2, '0'),
    hours: String(date.getUTCHours()).padStart(2, '0'),
    minutes: String(date.getUTCMinutes()).padStart(2, '0'),
  };
}

function formatDateForInput(date, timezone) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const validTimezone = validateTimezone(timezone);

  let year;
  let month;
  let day;

  if (validTimezone) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: validTimezone,
      });
      const parts = formatter.formatToParts(d);
      year = parts.find((p) => p.type === 'year').value;
      month = parts.find((p) => p.type === 'month').value;
      day = parts.find((p) => p.type === 'day').value;
    } catch (e) {
      const utcParts = getUTCDateParts(d);
      ({ year, month, day } = utcParts);
    }
  } else {
    const utcParts = getUTCDateParts(d);
    ({ year, month, day } = utcParts);
  }

  return `${year}-${month}-${day}`;
}

function formatTimeForInput(date, timezone) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const validTimezone = validateTimezone(timezone);

  let hours;
  let minutes;

  if (validTimezone) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: validTimezone,
      });
      const parts = formatter.formatToParts(d);
      hours = parts.find((p) => p.type === 'hour').value;
      minutes = parts.find((p) => p.type === 'minute').value;
    } catch (e) {
      const utcParts = getUTCDateParts(d);
      ({ hours, minutes } = utcParts);
    }
  } else {
    const utcParts = getUTCDateParts(d);
    ({ hours, minutes } = utcParts);
  }

  return `${hours}:${minutes}`;
}

function applyDateTimeFormatting() {
  const formatters = {
    date: formatDate,
    time: formatTime,
    datetime: formatDateTime,
  };

  document.querySelectorAll('[data-datetime]').forEach((el) => {
    const datetime = el.getAttribute('data-datetime');
    const format = el.getAttribute('data-format') || 'datetime';
    const formatter = formatters[format];

    if (formatter) {
      try {
        el.textContent = formatter(datetime);
      } catch (e) {
        // Error formatting datetime
      }
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyDateTimeFormatting);
} else {
  applyDateTimeFormatting();
}

function getAirportCode(location) {
  const match = (location || '').match(/^([A-Z]{3})/);
  return match ? match[1] : '';
}

function calculateLayoverDuration(flight1ArrivalTime, flight2DepartureTime) {
  if (!flight1ArrivalTime || !flight2DepartureTime) return null;

  const arrival = new Date(flight1ArrivalTime);
  const departure = new Date(flight2DepartureTime);
  const diffMs = departure - arrival;
  const diffHours = diffMs / MS_PER_HOUR;

  if (diffMs <= 0 || diffHours >= 24) return null;

  const hours = Math.floor(diffHours);
  const minutes = Math.round((diffHours - hours) * 60);

  return { hours, minutes };
}

function formatLayoverDisplay(duration, airportCode) {
  if (!duration) return '';
  const { hours, minutes } = duration;
  const hoursPart = hours ? `${hours}h ` : '';
  return `━━━━ ${hoursPart}${minutes}m in ${airportCode} ━━━━`;
}

function calculateLayover(
  flight1ArrivalTime,
  flight1Destination,
  flight2DepartureTime,
  flight2Origin
) {
  if (!flight1ArrivalTime || !flight2DepartureTime) return null;

  const duration = calculateLayoverDuration(flight1ArrivalTime, flight2DepartureTime);
  if (!duration) return null;

  const airportCode = getAirportCode(flight1Destination);
  if (!airportCode) return null;

  return { ...duration, airport: airportCode };
}

// Expose all functions globally for use in HTML and other modules
if (typeof window !== 'undefined') {
  window.formatDate = formatDate;
  window.formatTime = formatTime;
  window.formatDateTime = formatDateTime;
  window.formatDateForInput = formatDateForInput;
  window.formatTimeForInput = formatTimeForInput;
  window.getAirportCode = getAirportCode;
  window.calculateLayoverDuration = calculateLayoverDuration;
  window.calculateLayover = calculateLayover;
  window.formatLayoverDisplay = formatLayoverDisplay;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatDate,
    formatTime,
    formatDateTime,
    formatDateForInput,
    formatTimeForInput,
    calculateLayover,
    formatLayoverDisplay,
  };
}
