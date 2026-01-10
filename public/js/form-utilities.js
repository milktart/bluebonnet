/**
 * Form Utilities - Shared form initialization and helpers
 * Consolidates common form functionality to reduce duplication
 * Used by flight, hotel, transportation, event, and car rental forms
 */

/**
 * Initialize automatic date synchronization between start and end dates
 * When start date changes, updates end date if empty or if start > end
 *
 * @param {string} startFieldSelector - CSS selector for start date input (e.g., 'input[name="departureDate"]')
 * @param {string} endFieldSelector - CSS selector for end date input (e.g., 'input[name="arrivalDate"]')
 */
function initializeDateSync(startFieldSelector, endFieldSelector) {
  const startDateInput = document.querySelector(startFieldSelector);
  const endDateInput = document.querySelector(endFieldSelector);

  if (!startDateInput || !endDateInput) return;

  startDateInput.addEventListener('change', function () {
    const startDate = this.value;
    const endDate = endDateInput.value;

    // Case 1: End date is blank - auto-fill with start date
    if (!endDate) {
      endDateInput.value = startDate;
    }
    // Case 2: Start date is after end date - update end date to match start date
    else if (startDate > endDate) {
      endDateInput.value = startDate;
    }
    // Case 3: Start date is before end date - leave end date unchanged
  });
}

/**
 * Initialize timezone inference from location input
 * When location input loses focus, calls geocoding API to get timezone
 *
 * @param {string} locationFieldId - ID of location input field
 * @param {string} timezoneFieldId - ID of timezone hidden field to populate
 */
function initializeTimezoneInference(locationFieldId, timezoneFieldId) {
  const locationInput = document.getElementById(locationFieldId);
  const timezoneField = document.getElementById(timezoneFieldId);

  if (!locationInput || !timezoneField) return;

  async function inferAndUpdateTimezone(location) {
    if (!location || location.trim().length === 0) return;

    try {
      const response = await fetch(`/api/v1/geocode?address=${encodeURIComponent(location)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.timezone) {
          timezoneField.value = data.timezone;
        }
      }
    } catch (error) {
      // Silently fail - timezone is not critical
    }
  }

  // Infer timezone on initial load if location is present and timezone is empty
  const initialLocation = locationInput.value;
  if (initialLocation && initialLocation.trim().length > 0) {
    if (!timezoneField.value || timezoneField.value === '') {
      inferAndUpdateTimezone(initialLocation);
    }
  }

  // Debounce blur events to avoid too many API calls
  let timeoutId;
  locationInput.addEventListener('blur', function () {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      inferAndUpdateTimezone(this.value);
    }, 500);
  });
}

/**
 * Initialize timezone inference for separate origin and destination fields
 * Used for flights and transportation where origin and destination have separate timezone fields
 *
 * @param {string} originFieldId - ID of origin location input
 * @param {string} destinationFieldId - ID of destination location input
 * @param {string} originTimezoneFieldId - ID of origin timezone hidden field
 * @param {string} destTimezoneFieldId - ID of destination timezone hidden field
 */
function initializeOriginDestTimezoneInference(
  originFieldId,
  destinationFieldId,
  originTimezoneFieldId,
  destTimezoneFieldId
) {
  const originInput = document.getElementById(originFieldId);
  const destinationInput = document.getElementById(destinationFieldId);
  const originTimezoneField = document.getElementById(originTimezoneFieldId);
  const destTimezoneField = document.getElementById(destTimezoneFieldId);

  if (!originInput || !originTimezoneField) return;

  async function inferAndUpdateOriginTimezone(location) {
    if (!location || location.trim().length === 0) return;

    try {
      const response = await fetch(`/api/v1/geocode?address=${encodeURIComponent(location)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.timezone) {
          originTimezoneField.value = data.timezone;
        }
      }
    } catch (error) {
      // Silently fail
    }
  }

  // Infer origin timezone on initial load if location is present and timezone is empty
  const initialOrigin = originInput.value;
  if (initialOrigin && initialOrigin.trim().length > 0) {
    if (!originTimezoneField.value || originTimezoneField.value === '') {
      inferAndUpdateOriginTimezone(initialOrigin);
    }
  }

  let originTimeoutId;
  originInput.addEventListener('blur', function () {
    clearTimeout(originTimeoutId);
    originTimeoutId = setTimeout(() => {
      inferAndUpdateOriginTimezone(this.value);
    }, 500);
  });

  // Same for destination
  if (!destinationInput || !destTimezoneField) return;

  async function inferAndUpdateDestTimezone(location) {
    if (!location || location.trim().length === 0) return;

    try {
      const response = await fetch(`/api/v1/geocode?address=${encodeURIComponent(location)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.timezone) {
          destTimezoneField.value = data.timezone;
        }
      }
    } catch (error) {
      // Silently fail
    }
  }

  // Infer destination timezone on initial load if location is present and timezone is empty
  const initialDest = destinationInput.value;
  if (initialDest && initialDest.trim().length > 0) {
    if (!destTimezoneField.value || destTimezoneField.value === '') {
      inferAndUpdateDestTimezone(initialDest);
    }
  }

  let destTimeoutId;
  destinationInput.addEventListener('blur', function () {
    clearTimeout(destTimeoutId);
    destTimeoutId = setTimeout(() => {
      inferAndUpdateDestTimezone(this.value);
    }, 500);
  });
}

/**
 * Ensure timezone field has a value before form submission
 * Sets fallback to UTC if timezone is empty
 *
 * @param {string} timezoneFieldId - ID of timezone field to validate
 * @param {string} formId - ID of form to hook submit event
 */
function ensureTimezoneBeforeSubmit(timezoneFieldId, formId) {
  const form = document.getElementById(formId);
  const timezoneField = document.getElementById(timezoneFieldId);

  if (!form || !timezoneField) return;

  form.addEventListener('submit', function (e) {
    // If timezone is still empty, set it to UTC as fallback
    if (!timezoneField.value || timezoneField.value.trim() === '') {
      timezoneField.value = 'UTC';
    }
  });
}

/**
 * Initialize form by calling initialization functions on DOMContentLoaded
 * and immediately to ensure forms work when dynamically loaded via AJAX
 *
 * @param {Function} initFunction - Function to call for initialization
 */
function initializeFormOnLoad(initFunction) {
  document.addEventListener('DOMContentLoaded', initFunction);
  // Also call immediately in case the form is already loaded
  initFunction();
}

/**
 * Display validation errors from server response
 * Looks for error messages in server response and displays them to user
 *
 * @param {Object} response - Server response object
 * @param {string} containerId - ID of container to show errors in
 */
function displayValidationErrors(response, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let errorHTML =
    '<div class="bg-red-50 border border-red-200 rounded-md p-3 mb-4"><ul class="list-disc list-inside text-sm text-red-700">';

  if (response.errors && Array.isArray(response.errors)) {
    response.errors.forEach((error) => {
      errorHTML += `<li>${error.message || error}</li>`;
    });
  } else if (response.error) {
    errorHTML += `<li>${response.error}</li>`;
  }

  errorHTML += '</ul></div>';
  container.insertAdjacentHTML('beforeend', errorHTML);
}

/**
 * Get standardized field ID for add/edit mode
 * Ensures consistent ID generation across forms
 *
 * @param {boolean} isAddMode - Whether form is in add mode
 * @param {string} itemType - Type of item (flight, hotel, etc.)
 * @param {string} fieldName - Name of field (e.g., hotelName, departureDate)
 * @returns {string} - Properly formatted ID
 */
function getFieldId(isAddMode, itemType, fieldName) {
  if (isAddMode) {
    return `add_${itemType}_${fieldName}`;
  }
  return `edit_${itemType}_${fieldName}`;
}

// Export functions globally for use in templates
if (typeof window !== 'undefined') {
  window.initializeDateSync = initializeDateSync;
  window.initializeTimezoneInference = initializeTimezoneInference;
  window.initializeOriginDestTimezoneInference = initializeOriginDestTimezoneInference;
  window.ensureTimezoneBeforeSubmit = ensureTimezoneBeforeSubmit;
  window.initializeFormOnLoad = initializeFormOnLoad;
  window.displayValidationErrors = displayValidationErrors;
  window.getFieldId = getFieldId;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeDateSync,
    initializeTimezoneInference,
    initializeOriginDestTimezoneInference,
    ensureTimezoneBeforeSubmit,
    initializeFormOnLoad,
    displayValidationErrors,
    getFieldId,
  };
}
