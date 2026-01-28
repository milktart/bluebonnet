/**
 * Trip View - Sidebar Controls
 * Manages secondary sidebar visibility and add item menu
 *
 * Note: Companion management is now handled by Svelte components (CompanionManagement,
 * CompanionsFormSection, ItemCompanionsSelector) in the frontend/
 * directory. The vanilla JS approach is no longer needed.
 */

/**
 * Companion initialization (now handled by Svelte components)
 * Kept as no-op for backward compatibility - all companion management is now in Svelte
 */
async function ensureCompanionsInitialized() {
  // No-op: Companion management is now handled by Svelte components
  // This function is kept for backward compatibility with existing code
}

/**
 * Execute scripts from loaded HTML content
 * @param {Element} container - The container with the loaded HTML
 */
function executeLoadedScripts(container) {
  const scripts = container.querySelectorAll('script');
  scripts.forEach((script) => {
    const newScript = document.createElement('script');
    if (script.src) {
      newScript.src = script.src;
    } else {
      // Execute inline scripts in the container context to avoid global conflicts
      // This wraps the script in a function to prevent duplicate const/let declarations
      const wrappedCode = `
        (function() {
          ${script.textContent}
        })();
      `;
      newScript.textContent = wrappedCode;
    }
    document.head.appendChild(newScript);
  });
}

function closeSecondarySidebar() {
  const sidebar = document.getElementById('secondary-sidebar');
  if (sidebar) {
    sidebar.classList.remove('open');
  }

  // Update URL based on current location
  const currentPath = window.location.pathname;
  if (currentPath.startsWith('/manage/')) {
    // If closing a sidebar within /manage/*, go back to /manage
    window.history.pushState({}, '', '/manage');
  } else if (currentPath === '/manage/companions') {
    // Companions at /manage level
    window.history.pushState({}, '', '/manage');
  } else if (currentPath === '/') {
    // Already at root, no change needed
  } else if (currentPath.startsWith('/trips/')) {
    // Trip view, no change - sidebar close doesn't change URL in trip context
  }
}

function openSecondarySidebar() {
  const sidebar = document.getElementById('secondary-sidebar');
  if (sidebar) {
    sidebar.classList.add('open');
  }
}

// Backward compatibility
function closeEditSidebar() {
  closeSecondarySidebar();
}

function openEditSidebar() {
  openSecondarySidebar();
}

function showAddItemMenu() {
  closeSecondarySidebar();
}

function editItem(type, id) {
  openEditSidebar();

  // Close tertiary sidebar when editing a different flight
  if (type === 'flight' && window.currentFlightId && window.currentFlightId !== id) {
    closeTertiarySidebar();
  }

  const formContainer = document.getElementById('secondary-sidebar-content');
  if (!formContainer) return;

  switch (type) {
    case 'flight':
      // Fetch form via AJAX
      fetch(`/flights/${id}/form`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.text();
        })
        .then(async (html) => {
          formContainer.innerHTML = html;
          executeLoadedScripts(formContainer);

          // Call form initialization functions
          if (typeof initializeFlightForm === 'function') {
            initializeFlightForm();
          }
          if (typeof setupAsyncFormSubmission === 'function') {
            setupAsyncFormSubmission('editFlightForm');
          }
          // Ensure companions are loaded before initializing
          await ensureCompanionsInitialized();
          initFlightDateTimePickers();
          if (typeof initializeAirportAutocomplete === 'function') {
            initializeAirportAutocomplete();
          }
        })
        .catch((error) => {
          formContainer.innerHTML = `<p class="text-red-600">Error loading form: ${error.message}</p>`;
        });
      break;
    case 'hotel':
      // Fetch form via AJAX
      fetch(`/hotels/${id}/form`)
        .then((response) => response.text())
        .then(async (html) => {
          formContainer.innerHTML = html;
          executeLoadedScripts(formContainer);
          // Call form initialization directly
          if (typeof setupAsyncFormSubmission === 'function') {
            setupAsyncFormSubmission('editHotelForm');
          }
          // Ensure companions are loaded before initializing
          await ensureCompanionsInitialized();
          initFlightDateTimePickers();
        })
        .catch((error) => {
          // Error loading hotel form
        });
      break;
    case 'transportation':
      // Fetch form via AJAX
      fetch(`/transportation/${id}/form`)
        .then((response) => response.text())
        .then(async (html) => {
          formContainer.innerHTML = html;
          executeLoadedScripts(formContainer);
          // Call form initialization directly
          if (typeof setupAsyncFormSubmission === 'function') {
            setupAsyncFormSubmission('editTransportationForm');
          }
          // Ensure companions are loaded before initializing
          await ensureCompanionsInitialized();
          initFlightDateTimePickers();
        })
        .catch((error) => {
          // Error loading transportation form
        });
      break;
    case 'carRental':
    case 'car-rental':
      // Fetch form via AJAX
      fetch(`/car-rentals/${id}/form`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.text();
        })
        .then(async (html) => {
          if (!html || html.trim().length === 0) {
            formContainer.innerHTML =
              '<p class="text-red-600">Error loading form: empty response</p>';
          } else {
            formContainer.innerHTML = html;
            executeLoadedScripts(formContainer);
            // Call form initialization directly
            if (typeof setupAsyncFormSubmission === 'function') {
              setupAsyncFormSubmission('editCarRentalForm');
            }
            // Ensure companions are loaded before initializing
            await ensureCompanionsInitialized();
            initFlightDateTimePickers();
          }
        })
        .catch((error) => {
          formContainer.innerHTML = `<p class="text-red-600">Error loading form: ${error.message}</p>`;
        });
      break;
    case 'event':
      // Fetch form via AJAX
      fetch(`/events/${id}/form`)
        .then((response) => response.text())
        .then(async (html) => {
          formContainer.innerHTML = html;
          executeLoadedScripts(formContainer);
          // Call form initialization directly
          if (typeof setupAsyncFormSubmission === 'function') {
            setupAsyncFormSubmission('editEventForm');
          }
          if (typeof initializeEventDateSync === 'function') {
            initializeEventDateSync();
          }
          if (typeof initializeTimeInputs === 'function') {
            initializeTimeInputs();
          }
          // Ensure companions are loaded before initializing
          await ensureCompanionsInitialized();
          initFlightDateTimePickers();
        })
        .catch((error) => {
          // Error loading event form
        });
      break;
  }
}

/**
 * Show add form with pre-populated layover dates for hotel
 * @param {string} type - Type of form (e.g., 'hotel')
 * @param {string} arrivalDateTime - ISO string of arrival time
 * @param {string} departureDateTime - ISO string of departure time
 * @param {string} destinationTimezone - IANA timezone string (e.g., "America/New_York")
 */
function showAddFormWithLayoverDates(
  type,
  arrivalDateTime,
  departureDateTime,
  destinationTimezone
) {
  const formContainer = document.getElementById('secondary-sidebar-content');
  if (!formContainer) return;

  closeEditSidebar();
  openEditSidebar();

  if (type === 'hotel') {
    // Fetch form via AJAX with layover dates as query params
    const params = new URLSearchParams({
      checkInDateTime: arrivalDateTime,
      checkOutDateTime: departureDateTime,
      destinationTimezone: destinationTimezone || 'UTC',
    });
    fetch(`/hotels/trips/${tripId}/form?${params.toString()}`)
      .then((response) => response.text())
      .then(async (html) => {
        formContainer.innerHTML = html;
        executeLoadedScripts(formContainer);
        // Call form initialization directly
        if (typeof setupAsyncFormSubmission === 'function') {
          setupAsyncFormSubmission('addHotelForm');
        }
        // Ensure companions are loaded before initializing
        await ensureCompanionsInitialized();
        initFlightDateTimePickers();
      })
      .catch((error) => {
        // Error loading hotel form
      });
  }
}

function showAddForm(type, isStandalone = false) {
  // Determine the URL based on context (standalone vs trip)
  let formUrl;
  if (isStandalone) {
    // For standalone items, use the form loader endpoint
    formUrl = `/forms/add/${type}`;
  } else {
    // For trip items, use the existing trip-based endpoint
    formUrl = `/forms/add/${type}/${tripId}`;
  }

  // Use loadSidebarContent to maintain sidebar history properly
  // This ensures the back button works by navigating through the history
  if (typeof window.loadSidebarContent === 'function') {
    window.loadSidebarContent(formUrl);

    // Add explicit form setup as a fallback (workaround for async script loading timing issue)
    // This ensures the form submit handler is attached even if sidebar-loader's automatic setup doesn't work
    setTimeout(() => {
      if (typeof setupAsyncFormSubmission === 'function') {
        // Map type to form ID
        const formIdMap = {
          flight: 'addFlightForm',
          hotel: 'addHotelForm',
          transportation: 'addTransportationForm',
          carRental: 'addCarRentalForm',
          'car-rental': 'addCarRentalForm',
          event: 'addEventForm',
        };
        const formId = formIdMap[type];

        if (formId) {
          const form = document.getElementById(formId);
          if (form) {
            setupAsyncFormSubmission(formId);
          }
        }
      }
    }, 100);
  }
  return;

  // Legacy code below kept for reference but not used
  const formContainer = document.getElementById('secondary-sidebar-content');
  if (!formContainer) return;

  closeEditSidebar();
  openEditSidebar();

  switch (type) {
    case 'flight':
      // Fetch form via AJAX
      const flightUrl = isStandalone ? '/flights/standalone/form' : `/flights/trips/${tripId}/form`;
      fetch(flightUrl)
        .then((response) => response.text())
        .then(async (html) => {
          formContainer.innerHTML = html;
          executeLoadedScripts(formContainer);

          // Call form initialization
          if (typeof initializeFlightForm === 'function') {
            initializeFlightForm();
          }
          if (typeof setupAsyncFormSubmission === 'function') {
            setupAsyncFormSubmission(isStandalone ? 'addStandaloneFlightForm' : 'addFlightForm');
          }
          // Ensure companions are loaded before initializing
          await ensureCompanionsInitialized();
          initFlightDateTimePickers();
          if (typeof initializeAirportAutocomplete === 'function') {
            initializeAirportAutocomplete();
          }
        })
        .catch((error) => {
          // Error loading flight form
        });
      break;
    case 'hotel':
      // Fetch form via AJAX
      const hotelUrl = isStandalone ? '/hotels/standalone/form' : `/hotels/trips/${tripId}/form`;
      fetch(hotelUrl)
        .then((response) => response.text())
        .then(async (html) => {
          formContainer.innerHTML = html;
          executeLoadedScripts(formContainer);
          // Call form initialization directly
          if (typeof setupAsyncFormSubmission === 'function') {
            setupAsyncFormSubmission(isStandalone ? 'addStandaloneHotelForm' : 'addHotelForm');
          }
          // Ensure companions are loaded before initializing
          await ensureCompanionsInitialized();
          initFlightDateTimePickers();
        })
        .catch((error) => {
          // Error loading hotel form
        });
      break;
    case 'transportation':
      // Fetch form via AJAX
      const transportationUrl = isStandalone
        ? '/transportation/standalone/form'
        : `/transportation/trips/${tripId}/form`;
      fetch(transportationUrl)
        .then((response) => response.text())
        .then(async (html) => {
          formContainer.innerHTML = html;
          executeLoadedScripts(formContainer);
          // Call form initialization directly
          if (typeof setupAsyncFormSubmission === 'function') {
            setupAsyncFormSubmission(
              isStandalone ? 'addStandaloneTransportationForm' : 'addTransportationForm'
            );
          }
          // Ensure companions are loaded before initializing
          await ensureCompanionsInitialized();
          initFlightDateTimePickers();
        })
        .catch((error) => {
          // Error loading transportation form
        });
      break;
    case 'carRental':
    case 'car-rental':
      // Fetch form via AJAX
      const carRentalUrl = isStandalone
        ? '/car-rentals/standalone/form'
        : `/car-rentals/trips/${tripId}/form`;
      fetch(carRentalUrl)
        .then((response) => response.text())
        .then(async (html) => {
          formContainer.innerHTML = html;
          executeLoadedScripts(formContainer);
          // Call form initialization directly
          if (typeof setupAsyncFormSubmission === 'function') {
            setupAsyncFormSubmission(
              isStandalone ? 'addStandaloneCarRentalForm' : 'addCarRentalForm'
            );
          }
          // Ensure companions are loaded before initializing
          await ensureCompanionsInitialized();
          initFlightDateTimePickers();
        })
        .catch((error) => {
          // Error loading car rental form
        });
      break;
    case 'event':
      // Fetch form via AJAX
      const eventUrl = isStandalone ? '/events/standalone/form' : `/events/trips/${tripId}/form`;
      fetch(eventUrl)
        .then((response) => response.text())
        .then(async (html) => {
          formContainer.innerHTML = html;
          executeLoadedScripts(formContainer);
          // Call form initialization directly
          if (typeof setupAsyncFormSubmission === 'function') {
            setupAsyncFormSubmission(isStandalone ? 'addStandaloneEventForm' : 'addEventForm');
          }
          if (typeof initializeEventDateSync === 'function') {
            initializeEventDateSync();
          }
          if (typeof initializeTimeInputs === 'function') {
            initializeTimeInputs();
          }
          // Ensure companions are loaded before initializing
          await ensureCompanionsInitialized();
          initFlightDateTimePickers();
        })
        .catch((error) => {
          // Error loading event form
        });
      break;
  }
}

/**
 * Override openTertiarySidebar to handle secondary-to-tertiary transition
 * When tertiary sidebar opens, secondary should maintain its state but position may change
 */
if (typeof window.openTertiarySidebar === 'undefined') {
  window.openTertiarySidebar = function () {
    const tertiarySidebar = document.getElementById('tertiary-sidebar');
    if (tertiarySidebar) {
      tertiarySidebar.classList.add('open');
    }
  };
}

/**
 * Override closeTertiarySidebar
 */
if (typeof window.closeTertiarySidebar === 'undefined') {
  window.closeTertiarySidebar = function () {
    const tertiarySidebar = document.getElementById('tertiary-sidebar');
    if (tertiarySidebar) {
      tertiarySidebar.classList.remove('open');
    }
  };
}

// Expose functions globally for inline onclick handlers in templates
window.closeSecondarySidebar = closeSecondarySidebar;
window.openSecondarySidebar = openSecondarySidebar;
// Note: showAddItemMenu is defined in trip.ejs template, don't override it
window.showAddForm = showAddForm;
window.showAddFormWithLayoverDates = showAddFormWithLayoverDates;
window.editItem = editItem;
