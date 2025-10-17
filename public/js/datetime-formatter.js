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
function formatDateForInput(date) {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Format time for HTML input type="time" (HH:MM)
function formatTimeForInput(date) {
  if (!date) return '';
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
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
