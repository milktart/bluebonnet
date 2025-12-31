/**
 * Form Loader - Consolidates script loading and form initialization
 * Eliminates duplication of module loading across form templates
 */

/**
 * Load a module script and execute callback when ready
 * @param {string} scriptSrc - Path to the script file
 * @param {string} flagName - Global flag name to track if loaded (e.g., 'formUtilitiesLoaded')
 * @param {Function} callback - Callback to execute after loading
 */
function loadModuleScript(scriptSrc, flagName, callback) {
  if (window[flagName]) {
    // Already loaded, execute callback immediately
    if (callback) callback();
    return;
  }

  const script = document.createElement('script');
  script.src = scriptSrc;

  // Handle both regular scripts and module scripts
  if (scriptSrc.includes('autocomplete')) {
    script.type = 'module';
  }

  script.onload = function() {
    window[flagName] = true;
    if (callback) callback();
  };

  script.onerror = function() {
    console.error(`Failed to load script: ${scriptSrc}`);
  };

  document.head.appendChild(script);
}

/**
 * Initialize form with required modules
 * @param {string} formType - Type of form (flight, hotel, transportation, carRental, event)
 * @param {string} initFunctionName - Name of the form initialization function (as string)
 */
function initializeFormWithModules(formType, initFunctionName) {
  // All forms need form utilities
  loadModuleScript('/js/form-utilities.js', 'formUtilitiesLoaded', () => {
    // Flight forms also need airport autocomplete
    if (formType === 'flight') {
      loadModuleScript('/js/airport-autocomplete.js', 'airportAutocompleteLoaded', () => {
        // Call the initialization function if it exists
        if (window[initFunctionName] && typeof window[initFunctionName] === 'function') {
          window[initFunctionName]();
        }
      });
    } else {
      // Other forms just need the init function
      if (window[initFunctionName] && typeof window[initFunctionName] === 'function') {
        window[initFunctionName]();
      }
    }
  });
}

/**
 * Setup form initialization for commonly used form types
 * Call this once per form type in the EJS template (after the form HTML is in the DOM)
 */
function setupFlightFormInit() {
  initializeFormWithModules('flight', 'initializeFlightForm');
}

function setupHotelFormInit() {
  initializeFormWithModules('hotel', 'initializeHotelForm');
}

function setupTransportationFormInit() {
  initializeFormWithModules('transportation', 'initializeTransportationForm');
}

function setupCarRentalFormInit() {
  initializeFormWithModules('carRental', 'initializeCarRentalForm');
}

function setupEventFormInit() {
  initializeFormWithModules('event', 'initializeEventForm');
}

// Expose to global window
window.loadModuleScript = loadModuleScript;
window.initializeFormWithModules = initializeFormWithModules;
window.setupFlightFormInit = setupFlightFormInit;
window.setupHotelFormInit = setupHotelFormInit;
window.setupTransportationFormInit = setupTransportationFormInit;
window.setupCarRentalFormInit = setupCarRentalFormInit;
window.setupEventFormInit = setupEventFormInit;
