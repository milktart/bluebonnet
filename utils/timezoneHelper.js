/**
 * Timezone Helper
 * Handles conversion between local times and UTC for proper storage
 * Uses moment-timezone for reliable timezone conversions
 */

const moment = require('moment-timezone');
const logger = require('./logger');

/**
 * Convert a datetime-local string (without timezone) to UTC Date object
 * This interprets the datetime as being in the specified timezone
 *
 * @param {string} datetimeLocal - Format: "YYYY-MM-DDTHH:MM" (from datetime-local input)
 * @param {string} timezone - IANA timezone string (e.g., "America/New_York")
 * @returns {Date} - Date object in UTC
 *
 * Example:
 *   localToUTC("2025-10-14T14:30", "America/New_York")
 *   -> Returns Date object representing 2025-10-14 14:30 EDT converted to UTC
 */
function localToUTC(datetimeLocal, timezone) {
  if (!datetimeLocal) return null;

  try {
    // If no timezone provided, treat as UTC (fallback)
    if (!timezone) {
      // Parse as UTC by appending Z
      return moment.utc(datetimeLocal).toDate();
    }

    // Parse the datetime as being in the specified timezone
    // Then convert to UTC
    const localMoment = moment.tz(datetimeLocal, timezone);

    if (!localMoment.isValid()) {
      logger.error('Invalid datetime:', datetimeLocal);
      return null;
    }

    return localMoment.utc().toDate();

  } catch (error) {
    logger.error('Error converting local to UTC:', error, { datetimeLocal, timezone });
    // Fallback: treat as UTC
    return moment.utc(datetimeLocal).toDate();
  }
}

/**
 * Convert UTC Date to local datetime string for datetime-local input
 *
 * @param {Date|string} utcDate - UTC date
 * @param {string} timezone - IANA timezone string
 * @returns {string} - Format: "YYYY-MM-DDTHH:MM" for datetime-local input
 *
 * Example:
 *   utcToLocal(utcDateObject, "America/New_York")
 *   -> Returns "2025-10-14T14:30" (representing the time in New York)
 */
function utcToLocal(utcDate, timezone) {
  if (!utcDate) return '';

  try {
    const m = moment.utc(utcDate);

    if (!m.isValid()) {
      logger.error('Invalid UTC date:', utcDate);
      return '';
    }

    // Convert to specified timezone if provided
    if (timezone) {
      return m.tz(timezone).format('YYYY-MM-DDTHH:mm');
    }

    // Return in UTC if no timezone specified
    return m.format('YYYY-MM-DDTHH:mm');

  } catch (error) {
    logger.error('Error converting UTC to local:', error, { utcDate, timezone });
    return moment.utc(utcDate).format('YYYY-MM-DDTHH:mm');
  }
}

/**
 * Format a UTC date for display in a specific timezone
 *
 * @param {Date|string} utcDate - UTC date
 * @param {string} timezone - IANA timezone string
 * @param {string} format - Moment.js format string (default: 'DD MMM YYYY HH:mm')
 * @returns {string} - Formatted date string
 */
function formatInTimezone(utcDate, timezone, format = 'DD MMM YYYY HH:mm') {
  if (!utcDate) return '';

  try {
    const m = moment.utc(utcDate);

    if (!m.isValid()) {
      return '';
    }

    if (timezone) {
      return m.tz(timezone).format(format);
    }

    return m.format(format);

  } catch (error) {
    logger.error('Error formatting in timezone:', error);
    return '';
  }
}

module.exports = {
  localToUTC,
  utcToLocal,
  formatInTimezone
};
