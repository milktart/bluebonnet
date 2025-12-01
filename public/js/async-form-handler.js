/**
 * Async Form Handler
 * Handles async form submission for sidebar forms
 */

function setupAsyncFormSubmission(formId) {
  const form = document.getElementById(formId);

  if (!form) {
    console.warn('[setupAsyncFormSubmission] Form not found:', formId);
    return;
  }

  console.log('[setupAsyncFormSubmission] Setting up form:', formId);

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    console.log('[Form Submit] Form submitted:', formId);

    // Convert FormData to object
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    console.log('[Form Submit] Raw form data:', data);

    // Alert timezone fields for debugging
    if (formId.includes('hotel')) {
      alert('[FORM DEBUG] Hotel timezone field value: ' + (data.timezone || '(empty)'));
    }

    // Combine date and time fields for flight, hotel, transportation, and car rental forms
    if (data.departureDate && data.departureTime && !data.departureDateTime) {
      data.departureDateTime = `${data.departureDate}T${data.departureTime}`;
      delete data.departureDate;
      delete data.departureTime;
    }
    if (data.arrivalDate && data.arrivalTime && !data.arrivalDateTime) {
      data.arrivalDateTime = `${data.arrivalDate}T${data.arrivalTime}`;
      delete data.arrivalDate;
      delete data.arrivalTime;
    }
    if (data.checkInDate && data.checkInTime && !data.checkInDateTime) {
      data.checkInDateTime = `${data.checkInDate}T${data.checkInTime}`;
      delete data.checkInDate;
      delete data.checkInTime;
    }
    if (data.checkOutDate && data.checkOutTime && !data.checkOutDateTime) {
      data.checkOutDateTime = `${data.checkOutDate}T${data.checkOutTime}`;
      delete data.checkOutDate;
      delete data.checkOutTime;
    }
    if (data.pickupDate && data.pickupTime && !data.pickupDateTime) {
      data.pickupDateTime = `${data.pickupDate}T${data.pickupTime}`;
      delete data.pickupDate;
      delete data.pickupTime;
    }
    if (data.dropoffDate && data.dropoffTime && !data.dropoffDateTime) {
      data.dropoffDateTime = `${data.dropoffDate}T${data.dropoffTime}`;
      delete data.dropoffDate;
      delete data.dropoffTime;
    }
    if (data.startDate && data.startTime && !data.startDateTime) {
      data.startDateTime = `${data.startDate}T${data.startTime}`;
      delete data.startDate;
      delete data.startTime;
    }
    if (data.endDate && data.endTime && !data.endDateTime) {
      data.endDateTime = `${data.endDate}T${data.endTime}`;
      delete data.endDate;
      delete data.endTime;
    }

    const { action } = form;
    const isUpdate = formData.get('_method') === 'PUT' || form.method.toUpperCase() === 'PUT';
    console.log('[Form Submit] Is update:', isUpdate, 'Action:', action);

    // Alert final data being sent for hotel forms
    if (formId.includes('hotel')) {
      const debugMsg = `[FINAL DATA TO SEND]\nTimezone: ${data.timezone || '(empty)'}\nCheckInDateTime: ${data.checkInDateTime}\nCheckOutDateTime: ${data.checkOutDateTime}`;
      alert(debugMsg);
    }

    try {
      const response = await fetch(action, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Async-Request': 'true',
        },
        body: JSON.stringify(data),
      });

      let result;
      const responseText = await response.text();

      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        alert(`Server error: ${responseText.substring(0, 200)}`);
        return;
      }

      if (response.ok && result.success) {
        // Close the sidebar
        if (typeof closeSecondarySidebar === 'function') {
          closeSecondarySidebar();
        }

        // For standalone items (no tripId), refresh the primary sidebar
        // For trip items, refresh the trip view
        const tripId = window.tripId || window.tripData?.id || extractTripIdFromUrl();
        if (!tripId) {
          // Standalone item on dashboard - refresh primary sidebar without page reload
          await refreshDashboardSidebar();
        } else {
          // Trip item - refresh trip view async without page reload
          await refreshTripView();
        }
      } else {
        alert(`Error saving: ${result.error || result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(`Error saving: ${error.message}`);
    }
  });
}

/**
 * Refresh trip view data and UI without page reload
 */
async function refreshTripView() {
  try {
    // Get the trip ID from the global tripData if available, or extract from URL
    const tripId = window.tripId || window.tripData?.id || extractTripIdFromUrl();

    if (!tripId) {
      console.error('Could not determine trip ID for refresh');
      window.location.reload();
      return;
    }

    // Fetch updated trip data as JSON
    const dataResponse = await fetch(`/trips/${tripId}/api`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!dataResponse.ok) {
      console.error('Failed to fetch updated trip data');
      window.location.reload();
      return;
    }

    const tripData = await dataResponse.json();

    // Update the global tripData
    if (window.tripData) {
      Object.assign(window.tripData, tripData);
    }

    // Refresh the map
    if (typeof initOverviewMap === 'function' && window.currentMap) {
      // Clear existing map and reinitialize
      if (window.currentMap && typeof window.currentMap.remove === 'function') {
        window.currentMap.remove();
        window.currentMap = null;
      }
      initOverviewMap(tripData, 'tripMap').then((map) => {
        window.currentMap = map;
        if (typeof setupTimelineHoverEffects === 'function') {
          setupTimelineHoverEffects(map);
        }
      });
    }

    // Refresh the primary sidebar by fetching rendered HTML
    const sidebarResponse = await fetch(`/trips/${tripId}/sidebar`, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/html',
      },
    });

    if (sidebarResponse.ok) {
      const sidebarHtml = await sidebarResponse.text();
      const sidebarContainer = document.querySelector('.sidebar-content');
      if (sidebarContainer) {
        sidebarContainer.innerHTML = sidebarHtml;

        // Execute any scripts in the loaded content
        const scripts = sidebarContainer.querySelectorAll('script');
        scripts.forEach((script) => {
          const newScript = document.createElement('script');
          if (script.src) {
            newScript.src = script.src;
          } else {
            newScript.textContent = script.textContent;
          }
          document.head.appendChild(newScript);
        });
      }
    }
  } catch (error) {
    console.error('Error refreshing trip view:', error);
    // Fallback to page reload on error
    window.location.reload();
  }
}

/**
 * Refresh dashboard primary sidebar to show updated standalone items
 */
async function refreshDashboardSidebar() {
  try {
    console.log('[refreshDashboardSidebar] Refreshing dashboard...');
    // Reload the page to refresh all content properly
    // Use a small delay to ensure the form submission completes first
    setTimeout(() => {
      window.location.reload();
    }, 500);
  } catch (error) {
    console.error('[refreshDashboardSidebar] Error refreshing dashboard:', error);
    window.location.reload();
  }
}

/**
 * Extract trip ID from current URL
 */
function extractTripIdFromUrl() {
  const match = window.location.pathname.match(/\/trips\/([a-f0-9-]+)/);
  return match ? match[1] : null;
}

// Expose functions globally for cross-module access
window.setupAsyncFormSubmission = setupAsyncFormSubmission;
window.refreshTripView = refreshTripView;
window.refreshDashboardSidebar = refreshDashboardSidebar;
