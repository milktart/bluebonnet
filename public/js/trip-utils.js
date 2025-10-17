// Trip utility functions
// Shared helper functions for trip views

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
 * Format date for flatpickr datetime picker
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted string (DD MMM YYYY HH:MM)
 */
function formatDateTimeFlatpickr(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} ${hours}:${minutes}`;
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

// Make functions available globally
if (typeof window !== 'undefined') {
  window.getFlightNum = getFlightNum;
  window.getCityName = getCityName;
  window.formatDateTimeLocal = formatDateTimeLocal;
  window.formatDateTimeFlatpickr = formatDateTimeFlatpickr;
  window.getLatestDate = getLatestDate;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getFlightNum,
    getCityName,
    formatDateTimeLocal,
    formatDateTimeFlatpickr,
    getLatestDate
  };
}
