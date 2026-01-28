/**
 * Date Format Constants
 * Centralized date/time format strings used across the application
 * Ensures consistent formatting in both backend and frontend
 */

/**
 * Display format strings
 * Used for showing dates/times to users
 */
const DATE_FORMATS = {
  // Standard display formats
  DISPLAY: 'DD MMM YYYY',           // e.g., "15 Oct 2025"
  TIME: 'HH:mm',                    // e.g., "14:30" (24-hour)
  DATETIME: 'DD MMM YYYY HH:mm',    // e.g., "15 Oct 2025 14:30"

  // Input field formats (HTML5 datetime-local)
  INPUT_DATE: 'YYYY-MM-DD',         // e.g., "2025-10-15"
  INPUT_TIME: 'HH:mm',              // e.g., "14:30"
  INPUT_DATETIME: 'YYYY-MM-DDTHH:mm', // e.g., "2025-10-15T14:30"

  // ISO format for database storage
  ISO: 'YYYY-MM-DDTHH:mm:ss.sssZ',  // e.g., "2025-10-15T14:30:00.000Z"

  // Additional formats
  DATE_SHORT: 'DD MMM',             // e.g., "15 Oct"
  DATE_FULL: 'DD MMMM YYYY',        // e.g., "15 October 2025"
  TIME_WITH_SECONDS: 'HH:mm:ss',    // e.g., "14:30:00"
};

/**
 * Month names (short form)
 * Used for date formatting
 */
const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Month names (full form)
 */
const MONTH_NAMES_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Day names (short form)
 */
const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Day names (full form)
 */
const DAY_NAMES_FULL = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

module.exports = {
  DATE_FORMATS,
  MONTH_NAMES_SHORT,
  MONTH_NAMES_FULL,
  DAY_NAMES_SHORT,
  DAY_NAMES_FULL,
};
