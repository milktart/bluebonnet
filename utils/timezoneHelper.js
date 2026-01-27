/**
 * Timezone Helper
 * Handles conversion between local times and UTC for proper storage
 * Uses moment-timezone for reliable timezone conversions
 */

const moment = require('moment-timezone');
const logger = require('./logger');

/**
 * Parse UTC offset string (e.g., "UTC-5", "UTC+3") and return offset in minutes
 * Returns null if the string is not a UTC offset format
 */
function parseUtcOffset(timezone) {
  if (!timezone || !timezone.startsWith('UTC')) return null;

  const match = timezone.match(/^UTC([+-])(\d+)(?::(\d+))?$/);
  if (!match) return null;

  const sign = match[1] === '+' ? 1 : -1;
  const hours = parseInt(match[2], 10);
  const minutes = match[3] ? parseInt(match[3], 10) : 0;

  return sign * (hours * 60 + minutes);
}

/**
 * Convert a datetime-local string (without timezone) to UTC Date object
 * This interprets the datetime as being in the specified timezone
 *
 * @param {string} datetimeLocal - Format: "YYYY-MM-DDTHH:MM" (from datetime-local input)
 * @param {string} timezone - IANA timezone string (e.g., "America/New_York") or UTC offset (e.g., "UTC-5")
 * @returns {Date} - Date object in UTC
 *
 * Example:
 *   localToUTC("2025-10-14T14:30", "America/New_York")
 *   -> Returns Date object representing 2025-10-14 14:30 EDT converted to UTC
 *   localToUTC("2025-10-14T14:30", "UTC-5")
 *   -> Returns Date object representing 2025-10-14 14:30 UTC-5 converted to UTC
 */
function localToUTC(datetimeLocal, timezone) {
  if (!datetimeLocal) return null;

  try {
    // If no timezone provided, treat as UTC (fallback)
    if (!timezone) {
      // Parse as UTC by appending Z
      return moment.utc(datetimeLocal).toDate();
    }

    // Check if it's a UTC offset format (e.g., "UTC-5")
    const offsetMinutes = parseUtcOffset(timezone);
    if (offsetMinutes !== null) {
      // Parse as UTC, then subtract the offset to get the actual UTC time
      // If local time is 14:30 in UTC-5, UTC time is 14:30 + 5 hours = 19:30
      const utcMoment = moment.utc(datetimeLocal);
      if (!utcMoment.isValid()) {
        logger.error('Invalid datetime:', datetimeLocal);
        return null;
      }
      // Subtract the offset (offsetMinutes is negative for UTC-X, so subtracting makes it positive)
      return utcMoment.subtract(offsetMinutes, 'minutes').toDate();
    }

    // Parse the datetime as being in the specified timezone
    // Then convert to UTC (for IANA timezones)
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
 * @param {string} timezone - IANA timezone string or UTC offset (e.g., "UTC-5")
 * @returns {string} - Format: "YYYY-MM-DDTHH:MM" for datetime-local input
 *
 * Example:
 *   utcToLocal(utcDateObject, "America/New_York")
 *   -> Returns "2025-10-14T14:30" (representing the time in New York)
 *   utcToLocal(utcDateObject, "UTC-5")
 *   -> Returns "2025-10-14T14:30" (representing the time in UTC-5)
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
      // Check if it's a UTC offset format (e.g., "UTC-5")
      const offsetMinutes = parseUtcOffset(timezone);
      if (offsetMinutes !== null) {
        // Apply the offset to get local time
        return m.add(offsetMinutes, 'minutes').format('YYYY-MM-DDTHH:mm');
      }

      // Otherwise treat as IANA timezone
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

/**
 * Sanitize timezone input from form (handles "undefined" string)
 * Eliminates 4-6 duplicate timezone checks across controllers
 */
function sanitizeTimezone(tz) {
  if (!tz || tz === 'undefined' || (typeof tz === 'string' && tz.trim() === '')) {
    return null;
  }
  return tz;
}

module.exports = {
  localToUTC,
  utcToLocal,
  formatInTimezone,
  sanitizeTimezone,
};
