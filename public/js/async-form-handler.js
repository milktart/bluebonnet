/**
 * Async Form Handler
 * Handles async form submission for sidebar forms
 */

function setupAsyncFormSubmission(formId) {
  const form = document.getElementById(formId);

  if (!form) {
    return;
  }

  // Check if this form already has a submit listener (to prevent duplicates)
  // Use a data attribute to flag that async submission is already set up
  if (form.hasAttribute('data-async-submit-setup')) {
    return;
  }

  // Mark this form as having async submission set up
  form.setAttribute('data-async-submit-setup', 'true');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    e.stopPropagation();

    // Call any custom cleanup functions before form submission
    // Flight forms have cleanupFlightFormAirports() for airport code extraction
    if (formId.includes('Flight') && typeof window.cleanupFlightFormAirports === 'function') {
      window.cleanupFlightFormAirports();
    }

    // Convert FormData to object
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);


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
        return;
      }

      if (response.ok && result.success) {
        // Close the sidebar
        if (typeof closeSecondarySidebar === 'function') {
          closeSecondarySidebar();
        }

        // Determine if this is a trip item or standalone item
        // Check: 1) window.tripId from form, 2) hidden tripId field in form, 3) window.tripData?.id, 4) URL path
        let tripId = window.tripId;

        // If window.tripId is empty, check the hidden tripId field in the form
        if (!tripId || tripId.trim() === '') {
          const tripIdField = form.querySelector('input[name="tripId"]');
          if (tripIdField && tripIdField.value) {
            tripId = tripIdField.value;
          }
        }

        // If still no tripId, try window.tripData and URL
        if (!tripId || tripId.trim() === '') {
          tripId = window.tripData?.id || extractTripIdFromUrl();
        }

        if (!tripId) {
          // Standalone item on dashboard - refresh primary sidebar without page reload
          await refreshDashboardSidebar();
        } else {
          // Trip item - refresh trip view async without page reload
          await refreshTripView();
        }
      }
    } catch (error) {
      // Error submitting form - silently fail
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
      window.location.reload();
      return;
    }

    const tripData = await dataResponse.json();

    // Update the global tripData
    if (window.tripData) {
      Object.assign(window.tripData, tripData);
    }

    // Refresh the primary sidebar FIRST by fetching rendered HTML
    // This ensures the timeline is populated before we set up hover effects
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

    // NOW refresh the map with the updated data
    await refreshMapIfPresent();
  } catch (error) {
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
    // Detect the currently active tab
    const activeTab = getActiveDashboardTab();

    // Fetch updated primary sidebar HTML
    const sidebarResponse = await fetch(`/dashboard/primary-sidebar?activeTab=${activeTab}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/html',
        'X-Sidebar-Request': 'true',
      },
    });

    if (!sidebarResponse.ok) {
      throw new Error(`HTTP error! status: ${sidebarResponse.status}`);
    }

    const sidebarHtml = await sidebarResponse.text();

    // Update the primary sidebar content
    const sidebarContainer = document.querySelector('.sidebar-content');
    if (!sidebarContainer) {
      throw new Error('Sidebar container not found');
    }

    // Update the DOM with new content
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

    // Restore the active tab styling after refresh
    restoreActiveDashboardTab(activeTab);

    // Now refresh the map with fresh data from the API
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

        // Update window.tripData with fresh dashboard data for map refresh
        window.tripData = dashboardData;
        await refreshMapIfPresent();
      }
    } catch (error) {
      // Error fetching dashboard data - silently ignore
    }

    // Emit event bus notification for other components
    if (typeof window.eventBus !== 'undefined' && typeof window.EventTypes !== 'undefined') {
      window.eventBus.emit(window.EventTypes.DATA_SYNCED, {
        type: 'dashboard',
        activeTab: activeTab,
      });
    }
  } catch (error) {
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
    // Check if map exists and functions are available
    if (!window.currentMap) {
      return;
    }

    if (typeof initOverviewMap !== 'function') {
      return;
    }

    // Determine which data to use based on context
    let tripData = null;

    // Check if we're on a trip page (window.tripData is set in trip.ejs)
    if (window.tripData && window.tripData.id) {
      tripData = window.tripData;
    }
    // Check if we're on a dashboard page - use the data that was set by refreshDashboardSidebar
    else if (window.tripData && (window.tripData.flights || window.tripData.hotels || window.tripData.transportation)) {
      tripData = window.tripData;
    }
    // Fallback: check for dashboard-specific data structures
    else if (window.upcomingTripsData) {
      tripData = window.upcomingTripsData;
    }
    else if (window.allTripsData) {
      tripData = window.allTripsData;
    }
    // No data found
    else {
      return;
    }

    // Remove old map
    if (window.currentMap && typeof window.currentMap.remove === 'function') {
      try {
        window.currentMap.remove();
        window.currentMap = null;
      } catch (e) {
        // Ignore error removing map
      }
    }

    // Reinitialize map with updated data
    try {
      const map = await initOverviewMap(tripData, 'tripMap');
      window.currentMap = map;

      // Setup hover effects if function exists
      if (typeof setupTimelineHoverEffects === 'function') {
        setupTimelineHoverEffects(map);
      }
    } catch (error) {
      // Error reinitializing map - silently ignore
    }
  } catch (error) {
    // Error in map refresh - silently ignore
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
}

/**
 * Extract trip ID from current URL
 */
function extractTripIdFromUrl() {
  const pathname = window.location.pathname;
  const match = pathname.match(/\/trips\/([a-f0-9-]+)/);
  const result = match ? match[1] : null;
  return result;
}

/**
 * Delete an item and refresh the sidebar asynchronously
 * @param {string} type - Type of item (flight, hotel, transportation, car-rental, event)
 * @param {string} id - ID of the item to delete
 * @param {string} itemName - Display name of the item (unused, kept for compatibility)
 */
async function deleteItem(type, id, itemName = '') {
  try {
    // Determine the correct endpoint based on item type
    let endpoint;
    switch (type) {
      case 'flight':
        endpoint = `/flights/${id}`;
        break;
      case 'hotel':
        endpoint = `/hotels/${id}`;
        break;
      case 'transportation':
        endpoint = `/transportation/${id}`;
        break;
      case 'carRental':
      case 'car-rental':
        endpoint = `/car-rentals/${id}`;
        break;
      case 'event':
        endpoint = `/events/${id}`;
        break;
      default:
        return;
    }

    // Perform the DELETE request
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-Async-Request': 'true',
      },
    });

    if (response.ok) {
      // Close the sidebar
      if (typeof closeSecondarySidebar === 'function') {
        closeSecondarySidebar();
      }

      // Determine if this is a trip item or standalone item
      let tripId = window.tripId;

      if (!tripId || tripId.trim() === '') {
        // Standalone item on dashboard - refresh primary sidebar without page reload
        await refreshDashboardSidebar();
      } else {
        // Trip item - refresh trip view async without page reload
        await refreshTripView();
      }
    }
  } catch (error) {
    // Silently fail on error
  }
}

// Expose functions globally for cross-module access
window.setupAsyncFormSubmission = setupAsyncFormSubmission;
window.refreshTripView = refreshTripView;
window.refreshDashboardSidebar = refreshDashboardSidebar;
window.deleteItem = deleteItem;
