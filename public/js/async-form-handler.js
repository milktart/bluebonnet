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
 * Fetches updated primary sidebar HTML via AJAX and updates DOM without page reload
 */
async function refreshDashboardSidebar() {
  try {
    console.log('[refreshDashboardSidebar] Refreshing dashboard primary sidebar...');

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
      console.error('[refreshDashboardSidebar] Failed to fetch sidebar:', sidebarResponse.status);
      throw new Error(`HTTP error! status: ${sidebarResponse.status}`);
    }

    const sidebarHtml = await sidebarResponse.text();
    console.log('[refreshDashboardSidebar] Received sidebar HTML, length:', sidebarHtml.length);

    // Update the primary sidebar content
    const sidebarContainer = document.querySelector('.sidebar-content');
    if (!sidebarContainer) {
      console.error('[refreshDashboardSidebar] Sidebar container not found');
      throw new Error('Sidebar container not found');
    }

    // Update the DOM with new content
    sidebarContainer.innerHTML = sidebarHtml;
    console.log('[refreshDashboardSidebar] DOM updated with new sidebar content');

    // Execute any scripts in the loaded content
    const scripts = sidebarContainer.querySelectorAll('script');
    console.log('[refreshDashboardSidebar] Found', scripts.length, 'scripts to execute');
    scripts.forEach((script, index) => {
      console.log('[refreshDashboardSidebar] Executing script', index);
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

    console.log('[refreshDashboardSidebar] Dashboard primary sidebar refreshed successfully');

    // Emit event bus notification for other components
    if (typeof window.eventBus !== 'undefined' && typeof window.EventTypes !== 'undefined') {
      window.eventBus.emit(window.EventTypes.DATA_SYNCED, {
        type: 'dashboard',
        activeTab: activeTab,
      });
    }
  } catch (error) {
    console.error('[refreshDashboardSidebar] Error refreshing dashboard:', error);
    // Fallback to page reload on error
    console.log('[refreshDashboardSidebar] Falling back to page reload');
    setTimeout(() => {
      window.location.reload();
    }, 500);
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
  const match = window.location.pathname.match(/\/trips\/([a-f0-9-]+)/);
  return match ? match[1] : null;
}

// Expose functions globally for cross-module access
window.setupAsyncFormSubmission = setupAsyncFormSubmission;
window.refreshTripView = refreshTripView;
window.refreshDashboardSidebar = refreshDashboardSidebar;
