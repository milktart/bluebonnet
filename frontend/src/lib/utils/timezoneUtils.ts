/**
 * Timezone Utilities for Frontend
 * Provides consistent timezone-aware formatting and conversion
 * Mirrors the backend's timezoneHelper.js functionality
 */

/**
 * Convert UTC datetime to local timezone string (YYYY-MM-DDTHH:mm format)
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
