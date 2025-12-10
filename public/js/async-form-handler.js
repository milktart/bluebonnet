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

    console.log('[Form Submit] Raw form data collected, method:', data.method);


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
    const isUpdate = formData.get('_method') === 'PUT' || form.getAttribute('method').toUpperCase() === 'PUT';
    console.log('[Form Submit] Is update:', isUpdate, 'Action:', action);

    try {
      console.log('[Form Submit] Fetching to:', action);
      const response = await fetch(action, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Async-Request': 'true',
        },
        body: JSON.stringify(data),
      });

      console.log('[Form Submit] Response received. Status:', response.status);
      let result;
      const responseText = await response.text();

      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error('Server error:', responseText.substring(0, 200));
        return;
      }

      console.log('[Form Submit] Response parsed. Success:', result.success);
      if (response.ok && result.success) {
        console.log('[Form Submit] Form submission successful! Closing sidebar...');
        // Close the sidebar
        if (typeof closeSecondarySidebar === 'function') {
          closeSecondarySidebar();
        }

        // Determine if this is a trip item or standalone item
        // Check: 1) window.tripId from form, 2) hidden tripId field in form, 3) window.tripData?.id, 4) URL path
        let tripId = window.tripId;
        console.log('[Form Submit] Checking tripId sources: window.tripId=', window.tripId || 'NONE');

        // If window.tripId is empty, check the hidden tripId field in the form
        if (!tripId || tripId.trim() === '') {
          const tripIdField = form.querySelector('input[name="tripId"]');
          console.log('[Form Submit] Hidden tripId field value:', tripIdField ? (tripIdField.value || 'EMPTY') : 'NOT FOUND');
          if (tripIdField && tripIdField.value) {
            tripId = tripIdField.value;
            console.log('[Form Submit] Found tripId in form field:', tripId);
          }
        }

        // If still no tripId, try window.tripData and URL
        if (!tripId || tripId.trim() === '') {
          tripId = window.tripData?.id || extractTripIdFromUrl();
          console.log('[Form Submit] Using fallback tripId from tripData or URL:', tripId || 'NONE');
        }

        console.log('[Form Submit] Final TripId:', tripId || 'NONE');

        if (!tripId) {
          // Standalone item on dashboard - refresh primary sidebar without page reload
          console.log('[Form Submit] Refreshing dashboard sidebar (standalone item)');
          await refreshDashboardSidebar();
        } else {
          // Trip item - refresh trip view async without page reload
          console.log('[Form Submit] Refreshing trip view (trip item)');
          await refreshTripView();
        }
      } else {
        const errorMsg = result.error || result.message || 'Unknown error';
        console.error('Error saving:', errorMsg);
      }
    } catch (error) {
      console.error('Error submitting form:', error.message);
    }
  });
}

/**
 * Refresh trip view data and UI without page reload
 */
async function refreshTripView() {
  console.log('[refreshTripView] Function called');
  try {
    // Get the trip ID from the global tripData if available, or extract from URL
    const tripId = window.tripId || window.tripData?.id || extractTripIdFromUrl();
    console.log('[refreshTripView] Trip ID detected:', tripId || 'NONE');

    if (!tripId) {
      console.error('[refreshTripView] ERROR: Could not determine trip ID');
      window.location.reload();
      return;
    }

    // Fetch updated trip data as JSON
    console.log('[refreshTripView] Fetching updated trip data from API...');
    const dataResponse = await fetch(`/trips/${tripId}/api`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!dataResponse.ok) {
      console.error('[refreshTripView] ERROR: Failed to fetch trip data. Status:', dataResponse.status);
      window.location.reload();
      return;
    }

    const tripData = await dataResponse.json();
    console.log('[refreshTripView] Fetched trip data. Transportation items:', tripData.transportation ? tripData.transportation.length : 0);

    // Update the global tripData
    if (window.tripData) {
      Object.assign(window.tripData, tripData);
      console.log('[refreshTripView] Updated global tripData');
    }

    // Refresh the primary sidebar FIRST by fetching rendered HTML
    // This ensures the timeline is populated before we set up hover effects
    console.log('[refreshTripView] Refreshing primary sidebar...');
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
        console.log('[refreshTripView] Sidebar HTML updated');

        // Execute any scripts in the loaded content
        const scripts = sidebarContainer.querySelectorAll('script');
        console.log('[refreshTripView] Found', scripts.length, 'scripts in sidebar');
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
    } else {
      console.error('[refreshTripView] ERROR: Failed to fetch sidebar. Status:', sidebarResponse.status);
    }

    // NOW refresh the map with the updated data
    console.log('[refreshTripView] About to refresh map...');
    await refreshMapIfPresent();
  } catch (error) {
    console.error('[refreshTripView] ERROR CAUGHT:', error.message);
    // Fallback to page reload on error
    window.location.reload();
  }
}

/**
 * Refresh dashboard primary sidebar to show updated standalone items
 * Fetches updated primary sidebar HTML via AJAX and updates DOM without page reload
 */
async function refreshDashboardSidebar() {
  try {
    console.log('[refreshDashboardSidebar] Starting refresh...');

    // Detect the currently active tab
    const activeTab = getActiveDashboardTab();
    console.log('[refreshDashboardSidebar] Active tab:', activeTab);

    // Fetch updated primary sidebar HTML
    const sidebarResponse = await fetch(`/dashboard/primary-sidebar?activeTab=${activeTab}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/html',
        'X-Sidebar-Request': 'true',
      },
    });

    if (!sidebarResponse.ok) {
      console.error('[refreshDashboardSidebar] ERROR: Failed to fetch sidebar');
      throw new Error(`HTTP error! status: ${sidebarResponse.status}`);
    }

    const sidebarHtml = await sidebarResponse.text();
    console.log('[refreshDashboardSidebar] Sidebar HTML received');

    // Update the primary sidebar content
    const sidebarContainer = document.querySelector('.sidebar-content');
    if (!sidebarContainer) {
      console.error('[refreshDashboardSidebar] ERROR: Sidebar container not found');
      throw new Error('Sidebar container not found');
    }

    // Update the DOM with new content
    sidebarContainer.innerHTML = sidebarHtml;
    console.log('[refreshDashboardSidebar] DOM updated');

    // Execute any scripts in the loaded content
    const scripts = sidebarContainer.querySelectorAll('script');
    console.log('[refreshDashboardSidebar] Found', scripts.length, 'scripts');
    scripts.forEach((script) => {
      const newScript = document.createElement('script');
      if (script.src) {
        newScript.src = script.src;
      } else {
        newScript.textContent = script.textContent;
      }
      document.head.appendChild(newScript);
    });

    // Restore the active tab styling after refresh
    restoreActiveDashboardTab(activeTab);

    console.log('[refreshDashboardSidebar] Sidebar refreshed successfully');

    // Now refresh the map with fresh data from the API
    console.log('[refreshDashboardSidebar] Fetching fresh trip data for map refresh...');
    try {
      // Fetch dashboard items from the API, filtered by active tab
      const dashboardDataResponse = await fetch(`/dashboard/api?activeTab=${activeTab}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (dashboardDataResponse.ok) {
        const dashboardData = await dashboardDataResponse.json();
        console.log('[refreshDashboardSidebar] Fetched dashboard data. Items:',
          (dashboardData.flights ? dashboardData.flights.length : 0), 'flights,',
          (dashboardData.transportation ? dashboardData.transportation.length : 0), 'transportation');

        // Update window.tripData with fresh dashboard data for map refresh
        window.tripData = dashboardData;
        await refreshMapIfPresent();
      } else {
        console.error('[refreshDashboardSidebar] ERROR: Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('[refreshDashboardSidebar] ERROR fetching dashboard data:', error.message);
    }

    // Emit event bus notification for other components
    if (typeof window.eventBus !== 'undefined' && typeof window.EventTypes !== 'undefined') {
      window.eventBus.emit(window.EventTypes.DATA_SYNCED, {
        type: 'dashboard',
        activeTab: activeTab,
      });
    }
  } catch (error) {
    console.error('[refreshDashboardSidebar] ERROR:', error.message);
    // Fallback to page reload on error
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }
}

/**
 * Generic map refresh function - works for both dashboard and trip pages
 * Reusable across all pages that have a map
 */
async function refreshMapIfPresent() {
  try {
    console.log('[refreshMapIfPresent] Checking for map...');

    // Check if map exists and functions are available
    if (!window.currentMap) {
      console.log('[refreshMapIfPresent] No current map found');
      return;
    }

    if (typeof initOverviewMap !== 'function') {
      console.log('[refreshMapIfPresent] initOverviewMap function not available');
      return;
    }

    console.log('[refreshMapIfPresent] Map found, attempting refresh...');

    // Determine which data to use based on context
    let tripData = null;

    // Check if we're on a trip page (window.tripData is set in trip.ejs)
    if (window.tripData && window.tripData.id) {
      console.log('[refreshMapIfPresent] Using trip data from window.tripData');
      tripData = window.tripData;
    }
    // Check if we're on a dashboard page - use the data that was set by refreshDashboardSidebar
    else if (window.tripData && (window.tripData.flights || window.tripData.hotels || window.tripData.transportation)) {
      console.log('[refreshMapIfPresent] Using dashboard trip data from window.tripData');
      tripData = window.tripData;
    }
    // Fallback: check for dashboard-specific data structures
    else if (window.upcomingTripsData) {
      console.log('[refreshMapIfPresent] Using upcomingTripsData from dashboard');
      tripData = window.upcomingTripsData;
    }
    else if (window.allTripsData) {
      console.log('[refreshMapIfPresent] Using allTripsData from dashboard');
      tripData = window.allTripsData;
    }
    // No data found
    else {
      console.log('[refreshMapIfPresent] No trip data found, skipping map refresh');
      return;
    }

    console.log('[refreshMapIfPresent] Trip data loaded with flights:', tripData.flights ? tripData.flights.length : 0);

    // Remove old map
    if (window.currentMap && typeof window.currentMap.remove === 'function') {
      console.log('[refreshMapIfPresent] Removing existing map');
      try {
        window.currentMap.remove();
        window.currentMap = null;
      } catch (e) {
        console.warn('[refreshMapIfPresent] Warning removing map:', e.message);
      }
    }

    // Reinitialize map with updated data
    console.log('[refreshMapIfPresent] Calling initOverviewMap...');
    try {
      const map = await initOverviewMap(tripData, 'tripMap');
      console.log('[refreshMapIfPresent] Map reinitialized successfully');
      window.currentMap = map;

      // Setup hover effects if function exists
      if (typeof setupTimelineHoverEffects === 'function') {
        console.log('[refreshMapIfPresent] Setting up timeline hover effects');
        setupTimelineHoverEffects(map);
      }
    } catch (error) {
      console.error('[refreshMapIfPresent] ERROR reinitializing map:', error.message);
    }
  } catch (error) {
    console.error('[refreshMapIfPresent] ERROR:', error.message);
  }
}

/**
 * Detect which dashboard tab is currently active
 * @returns {string} 'upcoming', 'past', or 'settings'
 */
function getActiveDashboardTab() {
  const upcomingTab = document.getElementById('upcoming-tab');
  const pastTab = document.getElementById('past-tab');
  const settingsTab = document.getElementById('settings-tab');

  if (settingsTab && settingsTab.classList.contains('border-blue-500')) {
    return 'settings';
  }
  if (pastTab && pastTab.classList.contains('border-blue-500')) {
    return 'past';
  }
  // Default to upcoming
  return 'upcoming';
}

/**
 * Restore the active tab styling after sidebar content is refreshed
 * @param {string} activeTab - The tab to restore ('upcoming', 'past', or 'settings')
 */
function restoreActiveDashboardTab(activeTab) {
  const upcomingTab = document.getElementById('upcoming-tab');
  const pastTab = document.getElementById('past-tab');
  const settingsTab = document.getElementById('settings-tab');

  const upcomingContent = document.getElementById('upcoming-content');
  const pastContent = document.getElementById('past-content');
  const settingsContent = document.getElementById('settings-content');

  // Reset all tabs
  const allTabs = [upcomingTab, pastTab, settingsTab];
  allTabs.forEach(tab => {
    if (tab) {
      tab.classList.remove('border-blue-500', 'text-blue-600', 'bg-blue-50');
      tab.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:bg-gray-50', 'hover:border-gray-300');
    }
  });

  // Reset all content sections
  if (upcomingContent) upcomingContent.classList.add('hidden');
  if (pastContent) pastContent.classList.add('hidden');
  if (settingsContent) settingsContent.classList.add('hidden');

  // Activate the appropriate tab and content
  if (activeTab === 'past' && pastTab && pastContent) {
    pastTab.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:bg-gray-50', 'hover:border-gray-300');
    pastTab.classList.add('border-blue-500', 'text-blue-600', 'bg-blue-50');
    pastContent.classList.remove('hidden');
  } else if (activeTab === 'settings' && settingsTab && settingsContent) {
    settingsTab.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:bg-gray-50', 'hover:border-gray-300');
    settingsTab.classList.add('border-blue-500', 'text-blue-600', 'bg-blue-50');
    settingsContent.classList.remove('hidden');
  } else if (upcomingTab && upcomingContent) {
    // Default to upcoming
    upcomingTab.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:bg-gray-50', 'hover:border-gray-300');
    upcomingTab.classList.add('border-blue-500', 'text-blue-600', 'bg-blue-50');
    upcomingContent.classList.remove('hidden');
  }

  console.log('[restoreActiveDashboardTab] Restored active tab:', activeTab);
}

/**
 * Extract trip ID from current URL
 */
function extractTripIdFromUrl() {
  const pathname = window.location.pathname;
  console.log('[extractTripIdFromUrl] Current pathname:', pathname);
  const match = pathname.match(/\/trips\/([a-f0-9-]+)/);
  const result = match ? match[1] : null;
  console.log('[extractTripIdFromUrl] Extracted trip ID:', result || 'NONE');
  return result;
}

// Expose functions globally for cross-module access
window.setupAsyncFormSubmission = setupAsyncFormSubmission;
window.refreshTripView = refreshTripView;
window.refreshDashboardSidebar = refreshDashboardSidebar;
