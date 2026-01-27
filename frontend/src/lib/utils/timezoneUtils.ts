/**
 * Timezone Utilities for Frontend
 * Provides consistent timezone-aware formatting and conversion
 * Mirrors the backend's timezoneHelper.js functionality
 */

/**
 * Parse UTC offset string (e.g., "UTC-5", "UTC+3") and return offset in minutes
 * Returns null if the string is not a UTC offset format
 */
function parseUtcOffset(timezone: string): number | null {
  if (!timezone || !timezone.startsWith('UTC')) return null;

  const match = timezone.match(/^UTC([+-])(\d+)(?::(\d+))?$/);
  if (!match) return null;

  const sign = match[1] === '+' ? 1 : -1;
  const hours = parseInt(match[2], 10);
  const minutes = match[3] ? parseInt(match[3], 10) : 0;

  return sign * (hours * 60 + minutes);
}

/**
 * Validate if a timezone is a valid IANA timezone name
 */
function isValidIanaTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert UTC datetime to local timezone string (YYYY-MM-DDTHH:mm format)
 * Handles both IANA timezones and UTC offset strings (e.g., "UTC-5")
 * This is used for form inputs and data processing
 */
export function utcToLocalTimeString(utcDateString: string, timezone: string | null): string {
  if (!utcDateString) return '';

  try {
    const date = new Date(utcDateString);
    if (isNaN(date.getTime())) return '';

    // If no timezone, return UTC time
    if (!timezone) {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    // Check if it's a UTC offset format (e.g., "UTC-5")
    const offsetMinutes = parseUtcOffset(timezone);
    if (offsetMinutes !== null) {
      // Apply the offset directly
      const offsetDate = new Date(date.getTime() + offsetMinutes * 60 * 1000);
      const year = offsetDate.getUTCFullYear();
      const month = String(offsetDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(offsetDate.getUTCDate()).padStart(2, '0');
      const hours = String(offsetDate.getUTCHours()).padStart(2, '0');
      const minutes = String(offsetDate.getUTCMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    // Otherwise, treat it as an IANA timezone
    if (!isValidIanaTimezone(timezone)) {
      console.warn(`Invalid timezone "${timezone}" - falling back to UTC`);
      return utcToLocalTimeString(utcDateString, null);
    }

    // Use Intl.DateTimeFormat to convert to timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone
    });

    const parts = formatter.formatToParts(date);
    const values: Record<string, string> = {};
    parts.forEach(part => {
      if (part.type !== 'literal') {
        values[part.type] = part.value;
      }
    });

    return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
  } catch (error) {
    console.error('Error converting UTC to local time:', error);
    return '';
  }
}

/**
 * Format UTC datetime as HH:mm in the specified timezone (for display)
 */
export function formatTimeInTimezone(utcDateString: string, timezone: string | null): string {
  if (!utcDateString) return '';

  try {
    const date = new Date(utcDateString);
    if (isNaN(date.getTime())) return '';

    // If no timezone, return UTC time
    if (!timezone) {
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    // Check if it's a UTC offset format (e.g., "UTC-5")
    const offsetMinutes = parseUtcOffset(timezone);
    if (offsetMinutes !== null) {
      // Apply the offset directly
      const offsetDate = new Date(date.getTime() + offsetMinutes * 60 * 1000);
      const hours = String(offsetDate.getUTCHours()).padStart(2, '0');
      const minutes = String(offsetDate.getUTCMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    // Otherwise, treat it as an IANA timezone
    if (!isValidIanaTimezone(timezone)) {
      return formatTimeInTimezone(utcDateString, null);
    }

    // Use Intl.DateTimeFormat to convert to timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone
    });

    return formatter.format(date);
  } catch (error) {
    console.error('Error formatting time in timezone:', error);
    return '';
  }
}

/**
 * Format full date and time in the specified timezone (for display)
 */
export function formatDateTimeInTimezone(utcDateString: string, timezone: string | null): string {
  if (!utcDateString) return '';

  try {
    const date = new Date(utcDateString);
    if (isNaN(date.getTime())) return '';

    // If no timezone, return UTC time
    if (!timezone) {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    }

    // Check if it's a UTC offset format (e.g., "UTC-5")
    const offsetMinutes = parseUtcOffset(timezone);
    if (offsetMinutes !== null) {
      // Apply the offset directly
      const offsetDate = new Date(date.getTime() + offsetMinutes * 60 * 1000);
      const year = offsetDate.getUTCFullYear();
      const month = String(offsetDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(offsetDate.getUTCDate()).padStart(2, '0');
      const hours = String(offsetDate.getUTCHours()).padStart(2, '0');
      const minutes = String(offsetDate.getUTCMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    }

    // Otherwise, treat it as an IANA timezone
    if (!isValidIanaTimezone(timezone)) {
      return formatDateTimeInTimezone(utcDateString, null);
    }

    // Use Intl.DateTimeFormat to convert to timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone
    });

    return formatter.format(date);
  } catch (error) {
    console.error('Error formatting date/time in timezone:', error);
    return '';
  }
}
