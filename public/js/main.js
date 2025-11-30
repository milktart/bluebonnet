// Main JavaScript for Travel Planner

// Import constants
const {
  UI_DEBOUNCE_DELAY,
  UI_NOTIFICATION_DISMISS,
  UI_ALERT_AUTO_DISMISS,
} = window.CONSTANTS || {};

// Handle browser back/forward button navigation
window.addEventListener('popstate', function (e) {
  const path = window.location.pathname;

  // Handle dashboard tab navigation
  if (path === '/' || path === '/trips/upcoming') {
    if (typeof showUpcomingTrips === 'function') {
      showUpcomingTrips();
    }
  } else if (path === '/trips/past') {
    if (typeof showPastTrips === 'function') {
      showPastTrips();
    }
  }

  // Handle manage menu navigation
  if (path === '/manage') {
    if (typeof showSettings === 'function') {
      showSettings();
    }
    // Close sidebars if open
    if (typeof closeSecondarySidebar === 'function') {
      const secondarySidebar = document.getElementById('secondary-sidebar');
      if (secondarySidebar && secondarySidebar.classList.contains('open')) {
        closeSecondarySidebar();
      }
    }
  } else if (path === '/manage/account') {
    if (typeof showSettings === 'function') {
      showSettings();
    }
    if (typeof loadSidebarContent === 'function') {
      loadSidebarContent('/account/sidebar', { fullWidth: true });
    }
  } else if (path === '/manage/certificates') {
    if (typeof showSettings === 'function') {
      showSettings();
    }
    if (typeof loadSidebarContent === 'function') {
      loadSidebarContent('/account/vouchers/sidebar', { fullWidth: true });
    }
  } else if (path.startsWith('/manage/certificates/')) {
    if (typeof showSettings === 'function') {
      showSettings();
    }
    if (typeof loadSidebarContent === 'function') {
      loadSidebarContent('/account/vouchers/sidebar', { fullWidth: true });
    }
    // Extract voucher ID and load details
    const voucherId = path.split('/').pop();
    if (typeof loadCertificateDetails === 'function') {
      setTimeout(function () {
        loadCertificateDetails(voucherId);
      }, UI_DEBOUNCE_DELAY || 100);
    }
  } else if (path === '/manage/companions') {
    if (typeof showSettings === 'function') {
      showSettings();
    }
    if (typeof loadSidebarContent === 'function') {
      loadSidebarContent('/account/companions-sidebar', { fullWidth: true });
    }
  }
});

// Auto-hide alerts after 5 seconds
document.addEventListener('DOMContentLoaded', function () {
  const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
  alerts.forEach((alert) => {
    setTimeout(() => {
      const bsAlert = new bootstrap.Alert(alert);
      bsAlert.close();
    }, UI_ALERT_AUTO_DISMISS || 5000);
  });
});

// Confirm delete actions
document.querySelectorAll('form[onsubmit*="confirm"]').forEach((form) => {
  form.addEventListener('submit', function (e) {
    if (!confirm(this.getAttribute('onsubmit').match(/'([^']+)'/)[1])) {
      e.preventDefault();
    }
  });
});

// Auto-close date/time pickers after selection
// Handles dynamically added inputs as well (excludes time inputs managed by time-input-formatter.js)
function initializeDateTimePickerClosing() {
  // Select all date inputs (not time, as those are managed by time-input-formatter.js)
  const dateTimeInputs = document.querySelectorAll(
    'input[type="date"]:not([data-time-input]), input[type="datetime-local"]'
  );

  dateTimeInputs.forEach((input) => {
    // Only add listener if not already added
    if (!input.dataset.datePickerInitialized) {
      // Use 'change' event to close the picker
      input.addEventListener('change', function () {
        // Blur the input to close the date/time picker
        this.blur();
      });

      input.dataset.datePickerInitialized = 'true';
    }
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeDateTimePickerClosing);

// Also initialize for dynamically added inputs (when forms are loaded via AJAX)
// Use MutationObserver to watch for new date/time inputs
const observer = new MutationObserver(() => {
  initializeDateTimePickerClosing();
});

document.addEventListener('DOMContentLoaded', () => {
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false,
  });
});

// Date validation - ensure return date is after departure date
const departureDateInput = document.getElementById('departureDate');
const returnDateInput = document.getElementById('returnDate');

if (departureDateInput && returnDateInput) {
  departureDateInput.addEventListener('change', function () {
    returnDateInput.min = this.value;
    if (returnDateInput.value && returnDateInput.value < this.value) {
      returnDateInput.value = this.value;
    }
  });

  returnDateInput.addEventListener('change', function () {
    if (this.value < departureDateInput.value) {
      // Silently correct the return date if it's before departure date
      this.value = departureDateInput.value;
    }
  });
}

// Form validation
(function () {
  const forms = document.querySelectorAll('.needs-validation');
  Array.from(forms).forEach((form) => {
    form.addEventListener(
      'submit',
      (event) => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }
        form.classList.add('was-validated');
      },
      false
    );
  });
})();

// Timezone helper - convert UTC to local time for display
function convertUTCToLocal(utcDateString, timezone) {
  const date = new Date(utcDateString);
  if (timezone) {
    return date.toLocaleString('en-EU', { timeZone: timezone });
  }
  return date.toLocaleString();
}

// Flight search functionality
async function searchFlight() {
  const flightNumber = document.getElementById('flightSearch').value;
  const flightDate = document.getElementById('flightDate').value;

  if (!flightNumber) {
    showAlert('Please enter a flight number', 'warning');
    return;
  }

  showLoading(true);

  try {
    const url = `/flights/search?flightNumber=${encodeURIComponent(flightNumber)}${flightDate ? `&date=${flightDate}` : ''}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.success) {
      populateFlightForm(data.data);
      showAlert('Flight details loaded successfully!', 'success');
    } else {
      showAlert(data.message || 'Flight not found', 'warning');
    }
  } catch (error) {
    console.error('Error:', error);
    showAlert('Error searching for flight', 'danger');
  } finally {
    showLoading(false);
  }
}

function populateFlightForm(flightData) {
  const fields = {
    airline: flightData.airline,
    flightNumber: flightData.flightNumber,
    origin: flightData.origin,
    originTimezone: flightData.originTimezone,
    destination: flightData.destination,
    destinationTimezone: flightData.destinationTimezone,
  };

  Object.keys(fields).forEach((key) => {
    const element = document.querySelector(`[name="${key}"]`);
    if (element && fields[key]) {
      element.value = fields[key];
    }
  });

  if (flightData.departureDateTime) {
    const depElement = document.querySelector('[name="departureDateTime"]');
    if (depElement) {
      depElement.value = new Date(flightData.departureDateTime).toISOString().slice(0, 16);
    }
  }

  if (flightData.arrivalDateTime) {
    const arrElement = document.querySelector('[name="arrivalDateTime"]');
    if (arrElement) {
      arrElement.value = new Date(flightData.arrivalDateTime).toISOString().slice(0, 16);
    }
  }
}

function showAlert(message, type = 'info') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.role = 'alert';
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;

  const container = document.querySelector('main .container, main .container-fluid');
  if (container) {
    container.insertBefore(alertDiv, container.firstChild);
    setTimeout(() => {
      const bsAlert = new bootstrap.Alert(alertDiv);
      bsAlert.close();
    }, UI_ALERT_AUTO_DISMISS || 5000);
  }
}

function showLoading(show) {
  // You can implement a loading spinner here
  const button = event?.target;
  if (button) {
    button.disabled = show;
    if (show) {
      button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
    }
  }
}

// Edit functions for different item types
function editFlight(id) {
  // Implement edit modal or redirect to edit page
  console.log('Edit flight:', id);
}

function editHotel(id) {
  console.log('Edit hotel:', id);
}

function editTransportation(id) {
  console.log('Edit transportation:', id);
}

function editCarRental(id) {
  console.log('Edit car rental:', id);
}

function editEvent(id) {
  console.log('Edit event:', id);
}

// Note: formatDate() and formatDateTime() are now provided by datetime-formatter.js
// which is loaded before this file in the templates.

// Delete notification with undo functionality
function showDeleteNotification(itemName, itemType, itemId, restoreUrl, onUndoCallback) {
  // Create a container if it doesn't exist
  let container = document.getElementById('delete-notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'delete-notification-container';
    container.className = 'fixed top-0 left-1/2 transform -translate-x-1/2 z-50 pt-4';
    document.body.appendChild(container);
  }

  // Create the notification
  const notification = document.createElement('div');
  notification.className =
    'bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-lg max-w-md mx-auto flex items-center justify-between';
  notification.innerHTML = `
    <div class="flex items-center">
      <svg class="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
      </svg>
      <div>
        <p class="text-sm font-medium text-red-800">${itemName} has been deleted</p>
      </div>
    </div>
    <button class="ml-4 px-3 py-1 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors undo-btn">
      Undo
    </button>
  `;

  // Add to container
  container.appendChild(notification);

  // Handle undo
  const undoBtn = notification.querySelector('.undo-btn');
  let undoTimeout;

  undoBtn.addEventListener('click', async () => {
    clearTimeout(undoTimeout);
    try {
      const response = await fetch(restoreUrl, { method: 'POST' });
      if (response.ok) {
        notification.remove();
        if (onUndoCallback) {
          onUndoCallback();
        }
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className =
          'bg-green-50 border-l-4 border-green-500 p-4 rounded-md shadow-lg max-w-md mx-auto';
        successMsg.innerHTML = `
          <div class="flex items-center">
            <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <p class="text-sm font-medium text-green-800">${itemName} has been restored</p>
          </div>
        `;
        container.appendChild(successMsg);
        setTimeout(() => {
          successMsg.remove();
        }, UI_NOTIFICATION_DISMISS || 3000);
      } else {
        console.error(`Failed to restore ${itemName}`);
      }
    } catch (error) {
      console.error('Error restoring:', error);
    }
  });

  // Auto-remove after 5 seconds
  undoTimeout = setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease-out';
    setTimeout(() => {
      notification.remove();
    }, 300); // Fade-out animation delay (keep hardcoded)
  }, UI_ALERT_AUTO_DISMISS || 5000);
}

