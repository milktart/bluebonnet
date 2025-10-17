// Main JavaScript for Travel Planner

// Auto-hide alerts after 5 seconds
document.addEventListener('DOMContentLoaded', function() {
  const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
  alerts.forEach(alert => {
    setTimeout(() => {
      const bsAlert = new bootstrap.Alert(alert);
      bsAlert.close();
    }, 5000);
  });
});

// Confirm delete actions
document.querySelectorAll('form[onsubmit*="confirm"]').forEach(form => {
  form.addEventListener('submit', function(e) {
    if (!confirm(this.getAttribute('onsubmit').match(/'([^']+)'/)[1])) {
      e.preventDefault();
    }
  });
});

// Date validation - ensure return date is after departure date
const departureDateInput = document.getElementById('departureDate');
const returnDateInput = document.getElementById('returnDate');

if (departureDateInput && returnDateInput) {
  departureDateInput.addEventListener('change', function() {
    returnDateInput.min = this.value;
    if (returnDateInput.value && returnDateInput.value < this.value) {
      returnDateInput.value = this.value;
    }
  });
  
  returnDateInput.addEventListener('change', function() {
    if (this.value < departureDateInput.value) {
      alert('Return date must be after departure date');
      this.value = departureDateInput.value;
    }
  });
}

// Form validation
(function() {
  'use strict';
  const forms = document.querySelectorAll('.needs-validation');
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add('was-validated');
    }, false);
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
    const url = `/flights/search?flightNumber=${encodeURIComponent(flightNumber)}${flightDate ? '&date=' + flightDate : ''}`;
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
    'airline': flightData.airline,
    'flightNumber': flightData.flightNumber,
    'origin': flightData.origin,
    'originTimezone': flightData.originTimezone,
    'destination': flightData.destination,
    'destinationTimezone': flightData.destinationTimezone
  };
  
  Object.keys(fields).forEach(key => {
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
    }, 5000);
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

// Utility function to format dates
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-EU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('en-EU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}