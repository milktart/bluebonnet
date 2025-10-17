// Custom date picker initialization using flatpickr
// Format: DD MMM YYYY for dates, DD MMM YYYY HH:MM for datetimes

function initializeDatePickers() {
  // Initialize date pickers (DD MMM YYYY)
  const dateInputs = document.querySelectorAll('.date-picker');
  dateInputs.forEach(input => {
    // Check if flatpickr is already initialized on this element
    if (input._flatpickr) {
      input._flatpickr.destroy();
    }
    flatpickr(input, {
      dateFormat: 'd M Y',
      altInput: true,
      altFormat: 'd M Y',
      allowInput: true,
      time_24hr: true
    });
  });

  // Initialize datetime pickers (DD MMM YYYY HH:MM)
  const datetimeInputs = document.querySelectorAll('.datetime-picker');
  datetimeInputs.forEach(input => {
    // Check if flatpickr is already initialized on this element
    if (input._flatpickr) {
      input._flatpickr.destroy();
    }
    flatpickr(input, {
      enableTime: true,
      dateFormat: 'd M Y H:i',
      altInput: true,
      altFormat: 'd M Y H:i',
      allowInput: true,
      time_24hr: true
    });
  });
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDatePickers);
} else {
  initializeDatePickers();
}

// Export for manual initialization if needed
if (typeof window !== 'undefined') {
  window.initializeDatePickers = initializeDatePickers;
}
