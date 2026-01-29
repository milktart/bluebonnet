/**
 * Shared date/time formatting utilities
 * Used by both server-side (controllers, EJS) and client-side (via datetime-formatter.js)
 * Format: DD MMM YYYY for dates, HH:MM for times (24-hour)
 */

const { MS_PER_HOUR } = require('./constants');
const { formatInTimezone: formatInTimezoneHelper } = require('./timezoneHelper');

// Constants
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Format date as "DD MMM YYYY"
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date (e.g., "15 Oct 2025")
 */
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTHS[d.getMonth()];
  const year = d.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Format time as "HH:MM" (24-hour)
 * @param {Date|string} dateString - Date to format
 * @returns {string} - Formatted time (e.g., "14:30")
 */
function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

/**
 * Format datetime as "DD MMM YYYY HH:MM"
 * @param {Date|string} dateString - Date to format
 * @returns {string} - Formatted datetime
 */
function formatDateTime(dateString) {
  if (!dateString) return '';
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
}

/**
 * Extract airport code from location string
 * @param {string} location - Location string (format: "CODE - City, Country")
 * @returns {string} - Airport code (e.g., "JFK")
 */
function getAirportCode(location) {
  const match = (location || '').match(/^([A-Z]{3})/);
  return match ? match[1] : '';
}

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
 * Calculate layover duration between two flights
 * @param {Date|string} flight1ArrivalTime - First flight arrival time
 * @param {Date|string} flight2DepartureTime - Second flight departure time
 * @returns {Object|null} - { hours, minutes } or null if no layover or >= 24 hours
 */
function calculateLayoverDuration(flight1ArrivalTime, flight2DepartureTime) {
  if (!flight1ArrivalTime || !flight2DepartureTime) return null;

  const arrival = new Date(flight1ArrivalTime);
  const departure = new Date(flight2DepartureTime);
  const diffMs = departure - arrival;
  const diffHours = diffMs / MS_PER_HOUR;

  // Only show layover if less than 24 hours between flights
  if (diffMs <= 0 || diffHours >= 24) return null;

  const hours = Math.floor(diffHours);
  const minutes = Math.round((diffHours - hours) * 60);

  return { hours, minutes };
}

/**
 * Format layover display string with airport code
 * @param {Object} duration - { hours, minutes }
 * @param {string} airportCode - Airport code
 * @returns {string} - Formatted layover display
 */
function formatLayoverDisplay(duration, airportCode) {
  if (!duration) return '';
  const { hours, minutes } = duration;
  const hoursPart = hours ? `${hours}h ` : '';
  return `━━━━ ${hoursPart}${minutes}m in ${airportCode} ━━━━`;
}

/**
 * Legacy function for backward compatibility
 * Calculate layover and return with airport code
 */
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

/**
 * Get layover text for display
 * @param {Object} layoverDuration - { hours, minutes }
 * @param {string} airportCode - Airport code
 * @returns {string} - Formatted layover text
 */
function getLayoverText(layoverDuration, airportCode) {
  if (!layoverDuration) return '';
  const { hours, minutes } = layoverDuration;
  const hoursPart = hours ? `${hours}h ` : '';
  return `${hoursPart}${minutes}m in ${airportCode}`;
}

/**
 * Format a date/time string in a specific timezone
 * Wrapper around timezoneHelper.formatInTimezone for EJS templates
 * @param {Date|string} utcDate - UTC date
 * @param {string} timezone - IANA timezone string (e.g., "America/New_York")
 * @param {string} format - Moment.js format string (e.g., "HH:mm", "DD MMM YYYY HH:mm")
 * @returns {string} - Formatted date/time string
 */
function formatInTimezone(utcDate, timezone, format = 'DD MMM YYYY HH:mm') {
  return formatInTimezoneHelper(utcDate, timezone, format);
}

/**
 * Helper function to validate timezone string
 * @deprecated Use timezoneHelper.sanitizeTimezone() instead
 * @param {string} timezone - Timezone to validate
 * @returns {string|null} - Trimmed timezone or null if invalid
 */
function validateTimezone(timezone) {
  const { sanitizeTimezone } = require('./timezoneHelper');
  return sanitizeTimezone(timezone);
}

/**
 * Helper function to extract UTC date parts
 * @param {Date} date - Date to extract parts from
 * @returns {Object} - { year, month, day, hours, minutes }
 */
function getUTCDateParts(date) {
  return {
    year: String(date.getUTCFullYear()),
    month: String(date.getUTCMonth() + 1).padStart(2, '0'),
    day: String(date.getUTCDate()).padStart(2, '0'),
    hours: String(date.getUTCHours()).padStart(2, '0'),
    minutes: String(date.getUTCMinutes()).padStart(2, '0'),
  };
}

/**
 * Format date for HTML input type="date" (YYYY-MM-DD)
 * Converts UTC date to the specified timezone for display
 * @param {Date|string} date - Date to format
 * @param {string} timezone - IANA timezone string
 * @returns {string} - Formatted date (YYYY-MM-DD)
 */
function formatDateForInput(date, timezone) {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';

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
    // No timezone, show UTC
    const utcParts = getUTCDateParts(d);
    ({ year, month, day } = utcParts);
  }

  return `${year}-${month}-${day}`;
}

/**
 * Format time for HTML input type="time" (HH:MM)
 * Converts UTC time to the specified timezone for display
 * @param {Date|string} date - Date to format
 * @param {string} timezone - IANA timezone string
 * @returns {string} - Formatted time (HH:MM)
 */
function formatTimeForInput(date, timezone) {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';

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
    // No timezone, show UTC
    const utcParts = getUTCDateParts(d);
    ({ hours, minutes } = utcParts);
  }

  return `${hours}:${minutes}`;
}

module.exports = {
  formatDate,
  formatTime,
  formatDateTime,
  getAirportCode,
  getFlightNum,
  getCityName,
  calculateLayoverDuration,
  formatLayoverDisplay,
  calculateLayover,
  getLayoverText,
  formatInTimezone,
  validateTimezone,
  getUTCDateParts,
  formatDateForInput,
  formatTimeForInput,
};
