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
 * Generic timezone inference helper
 * Fetches timezone from geocoding API for a given location
 * @private
 */
async function inferTimezoneFromLocation(location) {
  if (!location || location.trim().length === 0) return null;

  try {
    const response = await fetch(`/api/v1/geocode?address=${encodeURIComponent(location)}`);
    if (response.ok) {
      const data = await response.json();
      return data.timezone || null;
    }
  } catch (error) {
    // Silently fail - timezone is not critical
  }
  return null;
}

/**
 * Setup timezone inference for a location/timezone field pair
 * @private
 */
function setupSingleTimezoneInference(locationFieldId, timezoneFieldId) {
  const locationInput = document.getElementById(locationFieldId);
  const timezoneField = document.getElementById(timezoneFieldId);

  if (!locationInput || !timezoneField) return;

  // Infer timezone on initial load if location is present and timezone is empty
  const initialLocation = locationInput.value;
  if (initialLocation && initialLocation.trim().length > 0) {
    if (!timezoneField.value || timezoneField.value === '') {
      inferTimezoneFromLocation(initialLocation).then((tz) => {
        if (tz) timezoneField.value = tz;
      });
    }
  }

  // Debounce blur events to avoid too many API calls
  let timeoutId;
  locationInput.addEventListener('blur', function () {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(async () => {
      const tz = await inferTimezoneFromLocation(this.value);
      if (tz) timezoneField.value = tz;
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
  // Setup inference for origin
  setupSingleTimezoneInference(originFieldId, originTimezoneFieldId);

  // Setup inference for destination
  if (destinationFieldId && destTimezoneFieldId) {
    setupSingleTimezoneInference(destinationFieldId, destTimezoneFieldId);
  }
}

/**
 * Combine separate date and time fields into datetime strings
 * Removes the original date/time fields after combining
 *
 * @param {Object} data - Form data object
 * @param {Array<string>} fieldPairs - Array of field pair prefixes
 *   Each prefix will look for {prefix}Date and {prefix}Time
 *   and create {prefix}DateTime
 *   E.g., 'departure' creates departureDateTime from departureDate + departureTime
 * @returns {Object} - Modified data object with datetime fields and original date/time fields removed
 *
 * @example
 * combineDateTimeFields(data, ['departure', 'arrival'])
 * // Combines departureDate + departureTime into departureDateTime
 * // Combines arrivalDate + arrivalTime into arrivalDateTime
 */
function combineDateTimeFields(data, fieldPairs = []) {
  const defaultPairs = [
    'departure',
    'arrival',
    'checkIn',
    'checkOut',
    'pickup',
    'dropoff',
    'start',
    'end',
  ];

  const pairs = fieldPairs.length > 0 ? fieldPairs : defaultPairs;

  pairs.forEach((prefix) => {
    const dateKey = `${prefix}Date`;
    const timeKey = `${prefix}Time`;
    const dateTimeKey = `${prefix}DateTime`;

    // Only combine if datetime field doesn't already exist
    if (data[dateKey] && data[timeKey] && !data[dateTimeKey]) {
      data[dateTimeKey] = `${data[dateKey]}T${data[timeKey]}`;
      delete data[dateKey];
      delete data[timeKey];
    }
  });

  return data;
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
  window.combineDateTimeFields = combineDateTimeFields;
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
    combineDateTimeFields,
    ensureTimezoneBeforeSubmit,
    initializeFormOnLoad,
    displayValidationErrors,
    getFieldId,
  };
}
