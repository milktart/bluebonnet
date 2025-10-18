// DateTime formatting utilities
// Format: DD MMM YYYY for dates, HH:MM for times (24-hour)

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
}

function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

function formatDateTime(dateString) {
  if (!dateString) return '';
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
}

// Format date for HTML input type="date" (YYYY-MM-DD)
// Converts UTC date to the specified timezone for display
function formatDateForInput(date, timezone) {
  if (!date) return '';
  const d = new Date(date);

  // Validate timezone
  const validTimezone = timezone && typeof timezone === 'string' && timezone.trim() && timezone !== 'undefined' && timezone !== 'null' ? timezone.trim() : null;

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
      year = String(d.getUTCFullYear());
      month = String(d.getUTCMonth() + 1).padStart(2, '0');
      day = String(d.getUTCDate()).padStart(2, '0');
    }
  } else {
    // No timezone, show UTC
    year = String(d.getUTCFullYear());
    month = String(d.getUTCMonth() + 1).padStart(2, '0');
    day = String(d.getUTCDate()).padStart(2, '0');
    console.log('[formatDateForInput] UTC date (no timezone):', `${year}-${month}-${day}`);
  }

  const result = `${year}-${month}-${day}`;
  return result;
}

// Format time for HTML input type="time" (HH:MM)
// Converts UTC time to the specified timezone for display
function formatTimeForInput(date, timezone) {
  if (!date) return '';
  const d = new Date(date);

  // Validate timezone
  const validTimezone = timezone && typeof timezone === 'string' && timezone.trim() && timezone !== 'undefined' && timezone !== 'null' ? timezone.trim() : null;

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
      hours = String(d.getUTCHours()).padStart(2, '0');
      minutes = String(d.getUTCMinutes()).padStart(2, '0');
    }
  } else {
    // No timezone, show UTC
    hours = String(d.getUTCHours()).padStart(2, '0');
    minutes = String(d.getUTCMinutes()).padStart(2, '0');
    console.log(`[formatTimeForInput] UTC time (no timezone provided): ${hours}:${minutes}`);
  }

  return `${hours}:${minutes}`;
}

// Make available globally
if (typeof window !== 'undefined') {
  window.formatDate = formatDate;
  window.formatTime = formatTime;
  window.formatDateTime = formatDateTime;
  window.formatDateForInput = formatDateForInput;
  window.formatTimeForInput = formatTimeForInput;
}

// Auto-format all datetime elements on page load
function applyDateTimeFormatting() {
  // Format all elements with data-datetime attribute
  document.querySelectorAll('[data-datetime]').forEach(el => {
    const datetime = el.getAttribute('data-datetime');
    const format = el.getAttribute('data-format') || 'datetime';
    
    try {
      if (format === 'date') {
        el.textContent = formatDate(datetime);
      } else if (format === 'time') {
        el.textContent = formatTime(datetime);
      } else {
        el.textContent = formatDateTime(datetime);
      }
    } catch (e) {
      console.error('Error formatting datetime:', datetime, e);
    }
  });
}

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyDateTimeFormatting);
} else {
  applyDateTimeFormatting();
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { formatDate, formatTime, formatDateTime, formatDateForInput, formatTimeForInput };
}
