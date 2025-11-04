/**
 * Time Input Formatter
 * Handles 24-hour time input with auto-formatting and validation
 * Automatically inserts colon after 2 characters and validates HH:MM format
 */

function initializeTimeInputs() {
  const timeInputs = document.querySelectorAll('input[data-time-input]');

  timeInputs.forEach(input => {
    // Only initialize if not already initialized
    if (!input.dataset.timeInputInitialized) {
      input.addEventListener('keydown', handleTimeKeydown);
      input.addEventListener('keyup', handleTimeKeyup);
      input.addEventListener('blur', handleTimeBlur);
      input.dataset.timeInputInitialized = 'true';
    }
  });
}

function handleTimeKeydown(e) {
  // Allow: backspace, delete, tab, escape, enter
  if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
      // Allow: Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A
      (e.keyCode === 65 && e.ctrlKey === true) ||
      (e.keyCode === 67 && e.ctrlKey === true) ||
      (e.keyCode === 86 && e.ctrlKey === true) ||
      (e.keyCode === 88 && e.ctrlKey === true) ||
      // Allow: home, end, left, right
      (e.keyCode >= 35 && e.keyCode <= 40)) {
    return;
  }

  // Ensure that it is a number and stop the keypress
  if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) &&
      (e.keyCode < 96 || e.keyCode > 105) &&
      e.keyCode !== 186) { // 186 is semicolon (for colon)
    e.preventDefault();
  }
}

function handleTimeKeyup(e) {
  const input = e.target;
  let value = input.value;
  const cursorPos = input.selectionStart;

  // Remove any non-numeric characters except colon
  let cleanValue = value.replace(/[^0-9:]/g, '');

  // If user is deleting/backspacing, just remove the colon and let it be
  if (e.key === 'Backspace' || e.key === 'Delete') {
    input.value = cleanValue;
    // Set cursor to current position (backspace already moved it)
    input.setSelectionRange(cursorPos, cursorPos);
    updateTimeInputStyle(input);
    return;
  }

  // Remove existing colon for reformatting on input
  cleanValue = cleanValue.replace(/:/g, '');

  // Limit to 4 digits (HH + MM)
  if (cleanValue.length > 4) {
    cleanValue = cleanValue.slice(0, 4);
  }

  // Auto-insert colon after 2 characters (hours)
  let formatted = cleanValue;
  if (formatted.length >= 2) {
    formatted = formatted.slice(0, 2) + ':' + formatted.slice(2);
  }

  // Validate hours (00-23)
  if (formatted.length >= 2) {
    const hours = parseInt(formatted.slice(0, 2), 10);
    if (hours > 23) {
      // Block invalid hours - keep only valid part
      return;
    }
  }

  // Validate minutes (00-59)
  if (formatted.length === 5) {
    const minutes = parseInt(formatted.slice(3, 5), 10);
    if (minutes > 59) {
      // Don't update if minutes are invalid
      return;
    }
  }

  input.value = formatted;

  // Set cursor position after colon insertion
  let newCursorPos = cursorPos;
  if (cleanValue.length === 2 && formatted.length === 3) {
    // Just added the colon, move cursor after it
    newCursorPos = 3;
  } else if (cleanValue.length > 2 && cursorPos === 2) {
    // Cursor was at position 2, move it to after colon
    newCursorPos = 3;
  }

  input.setSelectionRange(newCursorPos, newCursorPos);

  // Update input styling based on validity
  updateTimeInputStyle(input);
}

function handleTimeBlur(e) {
  const input = e.target;
  let value = input.value.trim();

  // Auto-correct incomplete time on blur
  if (value.length === 1) {
    input.value = '0' + value + ':00';
  } else if (value.length === 2) {
    input.value = value + ':00';
  } else if (value.length === 4) {
    // Has colon, but incomplete minutes
    const parts = value.split(':');
    if (parts.length === 2) {
      input.value = parts[0].padStart(2, '0') + ':' + parts[1].padEnd(2, '0');
    }
  } else if (value.length === 5) {
    // Valid format, just ensure padding
    const parts = value.split(':');
    if (parts.length === 2) {
      input.value = parts[0].padStart(2, '0') + ':' + parts[1].padStart(2, '0');
    }
  }

  updateTimeInputStyle(input);
}

function updateTimeInputStyle(input) {
  const value = input.value.trim();
  const isValid = /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(value);

  if (value.length === 0) {
    // Empty is ok for now, will be required by form validation
    input.classList.remove('border-red-500', 'ring-red-500');
  } else if (isValid) {
    // Valid time
    input.classList.remove('border-red-500', 'ring-red-500');
  } else {
    // Invalid time
    input.classList.add('border-red-500');
  }
}

function validateTimeInput(input) {
  const value = input.value.trim();
  if (value === '') return true; // Empty is fine if not required
  return /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(value);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTimeInputs);
} else {
  initializeTimeInputs();
}

// Use MutationObserver to watch for dynamically added time inputs
const timeObserver = new MutationObserver(() => {
  initializeTimeInputs();
});

document.addEventListener('DOMContentLoaded', () => {
  timeObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false
  });
});

// Export functions for use in other contexts
if (typeof window !== 'undefined') {
  window.initializeTimeInputs = initializeTimeInputs;
  window.validateTimeInput = validateTimeInput;
}
