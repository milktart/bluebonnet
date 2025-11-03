// DateTime formatting utilities
// Format: DD MMM YYYY for dates, HH:MM for times (24-hour)

// Constants
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

// Helper function to validate timezone string
function validateTimezone(timezone) {
  return timezone && typeof timezone === 'string' && timezone.trim() &&
         timezone !== 'undefined' && timezone !== 'null' ? timezone.trim() : null;
}

// Helper function to extract UTC date parts
function getUTCDateParts(date) {
  return {
    year: String(date.getUTCFullYear()),
    month: String(date.getUTCMonth() + 1).padStart(2, '0'),
    day: String(date.getUTCDate()).padStart(2, '0'),
    hours: String(date.getUTCHours()).padStart(2, '0'),
    minutes: String(date.getUTCMinutes()).padStart(2, '0')
  };
}

// Format date for HTML input type="date" (YYYY-MM-DD)
// Converts UTC date to the specified timezone for display
function formatDateForInput(date, timezone) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const validTimezone = validateTimezone(timezone);

  let year, month, day;

  if (validTimezone) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: validTimezone
      });
      const parts = formatter.formatToParts(d);
      year = parts.find(p => p.type === 'year').value;
      month = parts.find(p => p.type === 'month').value;
      day = parts.find(p => p.type === 'day').value;
      console.log('[formatDateForInput] UTC:', date, 'timezone:', validTimezone, 'local:', `${year}-${month}-${day}`);
    } catch (e) {
      console.warn('[formatDateForInput] Invalid timezone "' + validTimezone + '", using UTC:', e);
      const utcParts = getUTCDateParts(d);
      ({ year, month, day } = utcParts);
    }
  } else {
    // No timezone, show UTC
    const utcParts = getUTCDateParts(d);
    ({ year, month, day } = utcParts);
    console.log('[formatDateForInput] UTC date (no timezone):', `${year}-${month}-${day}`);
  }

  return `${year}-${month}-${day}`;
}

// Format time for HTML input type="time" (HH:MM)
// Converts UTC time to the specified timezone for display
function formatTimeForInput(date, timezone) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const validTimezone = validateTimezone(timezone);

  let hours, minutes;

  if (validTimezone) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: validTimezone
      });
      const parts = formatter.formatToParts(d);
      hours = parts.find(p => p.type === 'hour').value;
      minutes = parts.find(p => p.type === 'minute').value;
      console.log(`[formatTimeForInput] UTC: ${date}, timezone: ${validTimezone}, local: ${hours}:${minutes}`);
    } catch (e) {
      console.warn(`[formatTimeForInput] Invalid timezone "${validTimezone}", using UTC:`, e);
      const utcParts = getUTCDateParts(d);
      ({ hours, minutes } = utcParts);
    }
  } else {
    // No timezone, show UTC
    const utcParts = getUTCDateParts(d);
    ({ hours, minutes } = utcParts);
    console.log(`[formatTimeForInput] UTC time (no timezone provided): ${hours}:${minutes}`);
  }

  return `${hours}:${minutes}`;
}

// Note: Additional functions are exported to window below after they are defined

// Auto-format all datetime elements on page load
function applyDateTimeFormatting() {
  const formatters = {
    date: formatDate,
    time: formatTime,
    datetime: formatDateTime
  };

  document.querySelectorAll('[data-datetime]').forEach(el => {
    const datetime = el.getAttribute('data-datetime');
    const format = el.getAttribute('data-format') || 'datetime';
    const formatter = formatters[format];

    if (formatter) {
      try {
        el.textContent = formatter(datetime);
      } catch (e) {
        console.error('Error formatting datetime:', datetime, e);
      }
    }
  });
}

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyDateTimeFormatting);
} else {
  applyDateTimeFormatting();
}

// Extract airport code from location (format: "CODE - City, Country")
function getAirportCode(location) {
  const match = (location || '').match(/^([A-Z]{3})/);
  return match ? match[1] : '';
}

// Calculate layover duration between two flights
// Returns { hours, minutes } or null if no layover detected or >= 24 hours
function calculateLayoverDuration(flight1ArrivalTime, flight2DepartureTime) {
  if (!flight1ArrivalTime || !flight2DepartureTime) return null;

  const arrival = new Date(flight1ArrivalTime);
  const departure = new Date(flight2DepartureTime);
  const diffMs = departure - arrival;
  const diffHours = diffMs / (1000 * 60 * 60);

  // Only show layover if less than 24 hours between flights
  if (diffMs <= 0 || diffHours >= 24) return null;

  const hours = Math.floor(diffHours);
  const minutes = Math.round((diffHours - hours) * 60);

  return { hours, minutes };
}

// Format layover display string with airport code
function formatLayoverDisplay(duration, airportCode) {
  if (!duration) return '';
  const { hours, minutes } = duration;
  const hoursPart = hours ? `${hours}h ` : '';
  return `━━━━ ${hoursPart}${minutes}m in ${airportCode} ━━━━`;
}

// Legacy function for backward compatibility
function calculateLayover(flight1ArrivalTime, flight1Destination, flight2DepartureTime, flight2Origin) {
  if (!flight1ArrivalTime || !flight2DepartureTime) return null;

  const duration = calculateLayoverDuration(flight1ArrivalTime, flight2DepartureTime);
  if (!duration) return null;

  const airportCode = getAirportCode(flight1Destination);
  if (!airportCode) return null;

  return { ...duration, airport: airportCode };
}

// Make all functions available globally
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
  module.exports = { formatDate, formatTime, formatDateTime, formatDateForInput, formatTimeForInput, calculateLayover, formatLayoverDisplay };
}
