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

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('[Form Submit] Form submitted:', formId);

    // Convert FormData to object
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    const action = form.action;
    const isUpdate = formData.get('_method') === 'PUT' || form.method.toUpperCase() === 'PUT';
    console.log('[Form Submit] Is update:', isUpdate, 'Action:', action);

    try {
      const response = await fetch(action, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Async-Request': 'true'
        },
        body: JSON.stringify(data)
      });

      let result;
      const responseText = await response.text();

      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        alert('Server error: ' + responseText.substring(0, 200));
        return;
      }

      if (response.ok && result.success) {
        // Close the sidebar
        if (typeof closeSecondarySidebar === 'function') {
          closeSecondarySidebar();
        }

        // Refresh the trip view async without page reload
        await refreshTripView();
      } else {
        alert('Error saving: ' + (result.error || result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error saving: ' + error.message);
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
        'Content-Type': 'application/json'
      }
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
      initOverviewMap(tripData, 'tripMap').then(map => {
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
        'Content-Type': 'text/html'
      }
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
 * Extract trip ID from current URL
 */
function extractTripIdFromUrl() {
  const match = window.location.pathname.match(/\/trips\/([a-f0-9-]+)/);
  return match ? match[1] : null;
}
