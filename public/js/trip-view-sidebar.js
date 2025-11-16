/**
 * Trip View - Sidebar Controls
 * Manages secondary sidebar visibility and add item menu
 */

/**
 * Execute scripts from loaded HTML content
 * @param {Element} container - The container with the loaded HTML
 */
function executeLoadedScripts(container) {
  const scripts = container.querySelectorAll('script');
  scripts.forEach(script => {
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
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.text();
        })
        .then(html => {
          formContainer.innerHTML = html;
          executeLoadedScripts(formContainer);

          // Call form initialization functions
          if (typeof initializeFlightForm === 'function') {
            initializeFlightForm();
          }
          if (typeof setupAsyncFormSubmission === 'function') {
            setupAsyncFormSubmission('editFlightForm');
          }
          if (typeof initializeItemCompanions === 'function') {
            initializeItemCompanions();
          }
          initFlightDateTimePickers();
          initAirportSearch();
        })
        .catch(error => {
          console.error('Error loading flight form:', error);
          formContainer.innerHTML = `<p class="text-red-600">Error loading form: ${error.message}</p>`;
        });
      break;
    case 'hotel':
      // Fetch form via AJAX
      fetch(`/hotels/${id}/form`)
        .then(response => response.text())
        .then(html => {
          formContainer.innerHTML = html;
          executeLoadedScripts(formContainer);
          // Call form initialization directly
          if (typeof setupAsyncFormSubmission === 'function') {
            setupAsyncFormSubmission('editHotelForm');
          }
          if (typeof initializeItemCompanions === 'function') {
            initializeItemCompanions();
          }
          initFlightDateTimePickers();
        })
        .catch(error => console.error('Error loading hotel form:', error));
      break;
    case 'transportation':
      // Fetch form via AJAX
      fetch(`/transportation/${id}/form`)
        .then(response => response.text())
        .then(html => {
          formContainer.innerHTML = html;
          executeLoadedScripts(formContainer);
          // Call form initialization directly
          if (typeof setupAsyncFormSubmission === 'function') {
            setupAsyncFormSubmission('editTransportationForm');
          }
          if (typeof initializeItemCompanions === 'function') {
            initializeItemCompanions();
          }
          initFlightDateTimePickers();
        })
        .catch(error => console.error('Error loading transportation form:', error));
      break;
    case 'carRental':
    case 'car-rental':
      // Fetch form via AJAX
      fetch(`/car-rentals/${id}/form`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.text();
        })
        .then(html => {
          if (!html || html.trim().length === 0) {
            console.error('Car rental form response is empty');
            formContainer.innerHTML = '<p class="text-red-600">Error loading form: empty response</p>';
          } else {
            formContainer.innerHTML = html;
            executeLoadedScripts(formContainer);
            // Call form initialization directly
            if (typeof setupAsyncFormSubmission === 'function') {
              setupAsyncFormSubmission('editCarRentalForm');
            }
            if (typeof initializeItemCompanions === 'function') {
              initializeItemCompanions();
            }
            initFlightDateTimePickers();
          }
        })
        .catch(error => {
          console.error('Error loading car rental form:', error);
          formContainer.innerHTML = `<p class="text-red-600">Error loading form: ${error.message}</p>`;
        });
      break;
    case 'event':
      // Fetch form via AJAX
      fetch(`/events/${id}/form`)
        .then(response => response.text())
        .then(html => {
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
          if (typeof initializeItemCompanions === 'function') {
            initializeItemCompanions();
          }
          initFlightDateTimePickers();
        })
        .catch(error => console.error('Error loading event form:', error));
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
function showAddFormWithLayoverDates(type, arrivalDateTime, departureDateTime, destinationTimezone) {
  const formContainer = document.getElementById('secondary-sidebar-content');
  if (!formContainer) return;

  closeEditSidebar();
  openEditSidebar();

  if (type === 'hotel') {
    // Fetch form via AJAX with layover dates as query params
    const params = new URLSearchParams({
      checkInDateTime: arrivalDateTime,
      checkOutDateTime: departureDateTime,
      destinationTimezone: destinationTimezone || 'UTC'
    });
    fetch(`/hotels/trips/${tripId}/form?${params.toString()}`)
      .then(response => response.text())
      .then(html => {
        formContainer.innerHTML = html;
        executeLoadedScripts(formContainer);
        // Call form initialization directly
        if (typeof setupAsyncFormSubmission === 'function') {
          setupAsyncFormSubmission('addHotelForm');
        }
        if (typeof initializeItemCompanions === 'function') {
          initializeItemCompanions();
        }
        initFlightDateTimePickers();
      })
      .catch(error => console.error('Error loading hotel form:', error));
  }
}

function showAddForm(type) {
  const formContainer = document.getElementById('secondary-sidebar-content');
  if (!formContainer) return;

  closeEditSidebar();
  openEditSidebar();

  switch (type) {
    case 'flight':
      // Fetch form via AJAX
      fetch(`/flights/trips/${tripId}/form`)
        .then(response => response.text())
        .then(html => {
          formContainer.innerHTML = html;
          executeLoadedScripts(formContainer);

          // Call form initialization
          if (typeof initializeFlightForm === 'function') {
            initializeFlightForm();
          }
          if (typeof setupAsyncFormSubmission === 'function') {
            setupAsyncFormSubmission('addFlightForm');
          }
          initFlightDateTimePickers();
          initAirportSearch();
        })
        .catch(error => console.error('Error loading flight form:', error));
      break;
    case 'hotel':
      // Fetch form via AJAX
      fetch(`/hotels/trips/${tripId}/form`)
        .then(response => response.text())
        .then(html => {
          formContainer.innerHTML = html;
          executeLoadedScripts(formContainer);
          // Call form initialization directly
          if (typeof setupAsyncFormSubmission === 'function') {
            setupAsyncFormSubmission('addHotelForm');
          }
          if (typeof initializeItemCompanions === 'function') {
            initializeItemCompanions();
          }
          initFlightDateTimePickers();
        })
        .catch(error => console.error('Error loading hotel form:', error));
      break;
    case 'transportation':
      // Fetch form via AJAX
      fetch(`/transportation/trips/${tripId}/form`)
        .then(response => response.text())
        .then(html => {
          formContainer.innerHTML = html;
          executeLoadedScripts(formContainer);
          // Call form initialization directly
          if (typeof setupAsyncFormSubmission === 'function') {
            setupAsyncFormSubmission('addTransportationForm');
          }
          if (typeof initializeItemCompanions === 'function') {
            initializeItemCompanions();
          }
          initFlightDateTimePickers();
        })
        .catch(error => console.error('Error loading transportation form:', error));
      break;
    case 'carRental':
    case 'car-rental':
      // Fetch form via AJAX
      fetch(`/car-rentals/trips/${tripId}/form`)
        .then(response => response.text())
        .then(html => {
          formContainer.innerHTML = html;
          executeLoadedScripts(formContainer);
          // Call form initialization directly
          if (typeof setupAsyncFormSubmission === 'function') {
            setupAsyncFormSubmission('addCarRentalForm');
          }
          if (typeof initializeItemCompanions === 'function') {
            initializeItemCompanions();
          }
          initFlightDateTimePickers();
        })
        .catch(error => console.error('Error loading car rental form:', error));
      break;
    case 'event':
      // Fetch form via AJAX
      fetch(`/events/trips/${tripId}/form`)
        .then(response => response.text())
        .then(html => {
          formContainer.innerHTML = html;
          executeLoadedScripts(formContainer);
          // Call form initialization directly
          if (typeof setupAsyncFormSubmission === 'function') {
            setupAsyncFormSubmission('addEventForm');
          }
          if (typeof initializeEventDateSync === 'function') {
            initializeEventDateSync();
          }
          if (typeof initializeTimeInputs === 'function') {
            initializeTimeInputs();
          }
          if (typeof initializeItemCompanions === 'function') {
            initializeItemCompanions();
          }
          initFlightDateTimePickers();
        })
        .catch(error => console.error('Error loading event form:', error));
      break;
  }
}

/**
 * Override openTertiarySidebar to handle secondary-to-tertiary transition
 * When tertiary sidebar opens, secondary should maintain its state but position may change
 */
if (typeof window.openTertiarySidebar === 'undefined') {
  window.openTertiarySidebar = function() {
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
  window.closeTertiarySidebar = function() {
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
