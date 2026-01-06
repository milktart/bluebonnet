/**
 * Dashboard Formatting Utilities
 *
 * Reusable formatting functions for dates, times, and display text.
 * Supports timezone-aware formatting for travel items.
 */

/**
 * Parse a local date string (YYYY-MM-DD) into a Date object
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format date as "DD Mon YYYY" (e.g., "25 Dec 2025")
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = parseLocalDate(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Format month header from YYYY-MM format to "Month Year" (e.g., "December 2025")
 */
export function formatMonthHeader(monthKey: string): string {
  if (!monthKey) return '';
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  return `${months[month - 1]} ${year}`;
}

/**
 * Format trip date header as "Day, DD Mon" (e.g., "Wed, 25 Dec")
 */
export function formatTripDateHeader(dateStr: string): string {
  if (!dateStr) return '';
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);

  const date = new Date(year, month, day);
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthStr2 = months[month];

  return `${dayOfWeek}, ${day} ${monthStr2}`;
}

/**
 * Format time only as "HH:mm" with optional timezone conversion
 */
export function formatTimeOnly(dateStr: string, timezone: string | null = null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);

  if (!timezone) {
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return formatter.format(date);
  } catch {
    // Fallback to UTC if timezone invalid
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}

/**
 * Format date and time as "DD Mon YYYY HH:mm" with optional timezone conversion
 */
export function formatDateTime(dateStr: string, timezone: string | null = null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (!timezone) {
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    return `${day} ${month} ${year} ${hours}:${minutes}`;
  }

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone
    });

    const parts = formatter.formatToParts(date);
    const values: Record<string, string> = {};
    parts.forEach((part) => {
      if (part.type !== 'literal') {
        values[part.type] = part.value;
      }
    });

    return `${values.day} ${values.month} ${values.year} ${values.hour}:${values.minute}`;
  } catch {
    // Fallback to UTC time if timezone is invalid
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    return `${day} ${month} ${year} ${hours}:${minutes}`;
  }
}

/**
 * Format date only as "DD Mon YYYY" with optional timezone conversion
 */
export function formatDateOnly(dateStr: string, timezone: string | null = null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (!timezone) {
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    return `${day} ${month} ${year}`;
  }

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      timeZone: timezone
    });

    const parts = formatter.formatToParts(date);
    const values: Record<string, string> = {};
    parts.forEach((part) => {
      if (part.type !== 'literal') {
        values[part.type] = part.value;
      }
    });

    return `${values.day} ${values.month} ${values.year}`;
  } catch {
    // Fallback to UTC time if timezone is invalid
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    return `${day} ${month} ${year}`;
  }
}

/**
 * Capitalize first letter of string
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Calculate the number of nights between departure and return dates
 */
export function calculateNights(departureDate: string, returnDate?: string): number {
  if (!departureDate) return 0;

  const departure = parseLocalDate(departureDate);
  const returnDay = returnDate ? parseLocalDate(returnDate) : departure;

  const diffTime = returnDay.getTime() - departure.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}
