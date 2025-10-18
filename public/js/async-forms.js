/**
 * Async Form Submission Handler
 * Handles asynchronous form submissions for trip resources (flights, events, hotels, etc)
 * Refreshes sidebar and map without full page reload
 */

// Store original trip data for refreshing
let currentTripId = null;

/**
 * Initialize async form submission for all forms in the sidebar
 */
function initAsyncFormSubmission() {
  document.addEventListener('submit', function(e) {
    const form = e.target;

    // Check if this is a resource form (flight, event, hotel, etc)
    const isResourceForm = form.action.includes('/flights/') ||
                         form.action.includes('/hotels/') ||
                         form.action.includes('/events/') ||
                         form.action.includes('/car-rentals/') ||
                         form.action.includes('/transportation/');

    // Only intercept if it's a resource form and we have async capability
    if (isResourceForm && window.canUseAsync) {
      e.preventDefault();
      handleAsyncFormSubmission(form);
    }
  });
}

/**
 * Handle async form submission
 * @param {HTMLFormElement} form - The form to submit
 */
async function handleAsyncFormSubmission(form) {
  // Store original button state outside try block so catch can access it
  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton?.textContent;

  try {
    // DEBUG: Log the form details
    console.log('===== FORM SUBMITTED =====');
    console.log('Action:', form.action);
    console.log('Method:', form.method);
    console.log('Form class:', form.className);
    console.log('Form innerHTML preview:', form.innerHTML.substring(0, 300));

    // Show loading state
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Saving...';
    }

    // Combine datetime fields (matching logic from view.ejs)
    const allDayCheckbox = form.querySelector('[id$="AllDay"]');
    const isAllDayEvent = allDayCheckbox && allDayCheckbox.checked;

    const dateTimeFields = [
      {date: 'departureDate', time: 'departureTime', combined: 'departureDateTime'},
      {date: 'arrivalDate', time: 'arrivalTime', combined: 'arrivalDateTime'},
      {date: 'checkInDate', time: 'checkInTime', combined: 'checkInDateTime'},
      {date: 'checkOutDate', time: 'checkOutTime', combined: 'checkOutDateTime'},
      {date: 'pickupDate', time: 'pickupTime', combined: 'pickupDateTime'},
      {date: 'dropoffDate', time: 'dropoffTime', combined: 'dropoffDateTime'},
      {date: 'startDate', time: 'startTime', combined: 'startDateTime'},
      {date: 'endDate', time: 'endTime', combined: 'endDateTime'}
    ];

    dateTimeFields.forEach(field => {
      const dateInput = form.querySelector(`[name="${field.date}"]`);
      const timeInput = form.querySelector(`[name="${field.time}"]`);

      if (dateInput && dateInput.value) {
        // IMPORTANT: Remove any existing hidden inputs with this name first
        // (The view.ejs form handler may have already created them)
        const existingHiddens = form.querySelectorAll(`input[type="hidden"][name="${field.combined}"]`);
        existingHiddens.forEach(hidden => {
          console.log(`Removing existing ${field.combined}: ${hidden.value}`);
          hidden.remove();
        });

        // For all-day events, only use the date (set time to midnight)
        if (isAllDayEvent && (field.combined === 'startDateTime' || field.combined === 'endDateTime')) {
          // Create hidden input for combined datetime with midnight time
          // Format: YYYY-MM-DDTHH:MM (without seconds or timezone - localToUTC expects this)
          const hiddenInput = document.createElement('input');
          hiddenInput.type = 'hidden';
          hiddenInput.name = field.combined;
          hiddenInput.value = `${dateInput.value}T00:00`;
          form.appendChild(hiddenInput);
          console.log(`Created ${field.combined}: ${dateInput.value}T00:00`);
        } else if (timeInput && timeInput.value) {
          // Regular datetime with time specified
          // Format: YYYY-MM-DDTHH:MM (without seconds or timezone - localToUTC expects this)
          const hiddenInput = document.createElement('input');
          hiddenInput.type = 'hidden';
          hiddenInput.name = field.combined;
          hiddenInput.value = `${dateInput.value}T${timeInput.value}`;
          form.appendChild(hiddenInput);
          console.log(`Created ${field.combined}: ${dateInput.value}T${timeInput.value}`);
        } else {
          console.warn(`Skipping ${field.combined} - missing time value. Date: ${dateInput.value}, Time: ${timeInput ? timeInput.value : 'no input found'}`);
        }
      }
    });

    // Prepare form data
    const formData = new FormData(form);

    // Debug: Log what's in the FormData
    console.log('FormData contents:');
    let formDataCount = 0;
    for (let pair of formData.entries()) {
      console.log(`  ${pair[0]}: ${pair[1]}`);
      formDataCount++;
    }
    console.log(`Total FormData entries: ${formDataCount}`);

    const method = form.method.toUpperCase();
    const action = form.action;

    // Parse the HTTP method from action (e.g., ?_method=PUT)
    let httpMethod = method;
    if (action.includes('_method=PUT')) {
      httpMethod = 'PUT';
      formData.delete('_method');
    } else if (action.includes('_method=DELETE')) {
      httpMethod = 'DELETE';
      formData.delete('_method');
    }

    // Remove the query string from action
    const cleanAction = action.split('?')[0];

    // DEBUG: Check if the action contains literal template literal syntax
    if (cleanAction.includes('${')) {
      console.error('WARNING: Form action contains literal template literal syntax! This indicates the form was not properly interpolated.');
      console.error('Form action:', cleanAction);
      console.error('This is a critical bug - the form will not submit to the correct endpoint!');
    }

    console.log('HTTP Method:', httpMethod);
    console.log('Clean Action URL:', cleanAction);
    console.log('Original Action:', action);

    // Convert FormData to URL-encoded string for all async requests
    // (URL-encoded is more reliable than multipart/form-data for async submissions)
    // DELETE requests should not have a body
    let requestBody = null;
    let contentType = null;

    if (httpMethod !== 'DELETE') {
      const params = new URLSearchParams();
      for (let pair of formData.entries()) {
        params.append(pair[0], pair[1]);
      }
      requestBody = params.toString();
      contentType = 'application/x-www-form-urlencoded';
      console.log('Request body (URL-encoded):', requestBody.substring(0, 200) + '...');
    } else {
      console.log('DELETE request - no body sent');
    }

    // Make the async request
    const headers = {
      'X-Requested-With': 'XMLHttpRequest',
      'X-Async-Request': 'true'
    };
    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    console.log('SENDING REQUEST TO:', cleanAction, 'METHOD:', httpMethod);
    const response = await fetch(cleanAction, {
      method: httpMethod,
      body: requestBody,
      headers: headers
    });
    console.log('RESPONSE STATUS:', response.status, 'URL:', cleanAction);

    // Try to parse JSON response (works for both success and error)
    let result;
    try {
      result = await response.json();
    } catch (e) {
      // If JSON parsing fails, throw generic error
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Check if response was successful
    if (!response.ok) {
      // Use the error message from the JSON response if available
      throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Handle successful submission

    if (result.success) {
      // Show success message
      showAsyncMessage(result.message || 'Saved successfully', 'success');

      // Extract trip ID from the form
      const tripIdInput = form.querySelector('input[name="tripId"]');
      const tripId = tripIdInput?.value;

      // Close the sidebar
      closeSecondarySidebar();

      // Refresh the page data if trip ID exists
      if (tripId) {
        await refreshTripData(tripId);
      }

      // Reset sidebar history
      sidebarHistory = [];
      sidebarHistoryIndex = -1;
    } else {
      throw new Error(result.error || 'Failed to save');
    }
  } catch (error) {
    console.error('Form submission error:', error);
    showAsyncMessage(error.message || 'Error saving. Please try again.', 'error');

    // Re-enable submit button
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText || 'Save';
    }
  }
}

/**
 * Show temporary async message to user
 * @param {string} message - Message to display
 * @param {string} type - Message type: 'success' or 'error'
 */
function showAsyncMessage(message, type = 'success') {
  // Create message element
  const messageEl = document.createElement('div');
  const bgClass = type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700';
  messageEl.className = `fixed top-4 right-4 px-4 py-3 rounded-lg border ${bgClass} shadow-lg z-50 max-w-sm`;
  messageEl.textContent = message;

  document.body.appendChild(messageEl);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    messageEl.style.opacity = '0';
    messageEl.style.transition = 'opacity 0.3s ease';
    setTimeout(() => messageEl.remove(), 300);
  }, 4000);
}

/**
 * Refresh the primary sidebar timeline with updated trip data
 * @param {Object} tripData - Updated trip data
 */
function refreshPrimarySidebar(tripData) {
  const sidebarContent = document.querySelector('.sidebar-content');
  if (!sidebarContent) {
    console.warn('Sidebar content element not found');
    return;
  }

  if (!tripData) {
    console.warn('No trip data provided to refreshPrimarySidebar');
    return;
  }

  console.log('Refreshing primary sidebar with data:', tripData);

  // Helper functions (matching server-side logic)
  function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  }

  function getFlightNum(flightNumber) {
    const match = flightNumber.match(/(\d+)$/);
    return match ? match[1] : flightNumber;
  }

  function getCityName(location) {
    if (location.includes(' - ')) {
      const parts = location.split(' - ')[1];
      if (parts && parts.includes(',')) {
        return parts.split(',')[0].trim();
      }
      return parts;
    }
    return location.split(' - ')[0] || location;
  }

  // Collect all items (matching server-side logic)
  const allItems = [];

  (tripData.flights || []).forEach(f => {
    const flightNum = getFlightNum(f.flightNumber);
    const airlineCode = f.flightNumber.replace(/\d+$/, '');
    const originCity = getCityName(f.origin);
    const destinationCity = getCityName(f.destination);
    allItems.push({
      type: 'flight',
      time: new Date(f.departureDateTime),
      data: f,
      display: `${airlineCode}${flightNum}: ${originCity} → ${destinationCity}`,
      hasSegment: true,
      marker: null,
      id: f.id
    });
  });

  (tripData.hotels || []).forEach(h => {
    allItems.push({
      type: 'hotel',
      time: new Date(h.checkInDateTime),
      data: h,
      display: h.hotelName,
      hasSegment: false,
      marker: null,
      id: h.id
    });
  });

  (tripData.transportation || []).forEach(t => {
    const originCity = getCityName(t.origin);
    const destinationCity = getCityName(t.destination);
    allItems.push({
      type: 'transportation',
      time: new Date(t.departureDateTime),
      data: t,
      display: `${t.method}: ${originCity} → ${destinationCity}`,
      hasSegment: true,
      marker: null,
      id: t.id
    });
  });

  (tripData.carRentals || []).forEach(c => {
    allItems.push({
      type: 'carRental',
      time: new Date(c.pickupDateTime),
      data: c,
      display: `${c.company}`,
      hasSegment: false,
      marker: null,
      id: c.id
    });
  });

  (tripData.events || []).forEach(e => {
    allItems.push({
      type: 'event',
      time: new Date(e.startDateTime),
      data: e,
      display: e.name,
      hasSegment: false,
      marker: null,
      id: e.id
    });
  });

  // Sort by time
  allItems.sort((a, b) => a.time - b.time);

  // Assign markers to items with segments
  let mapMarkerCounter = 0;
  allItems.forEach(item => {
    if (item.hasSegment) {
      mapMarkerCounter++;
      item.marker = mapMarkerCounter;
    }
  });

  // Group by date
  const itemsByDate = {};
  allItems.forEach(item => {
    const dateKey = item.time.toISOString().split('T')[0];
    if (!itemsByDate[dateKey]) itemsByDate[dateKey] = [];
    itemsByDate[dateKey].push(item);
  });

  // Build HTML
  let html = '<div class="p-6">';

  if (allItems.length === 0) {
    html += `
      <div class="text-center py-12">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No items yet</h3>
        <p class="text-gray-500 mb-6">Add flights, hotels, or activities to see them here</p>
        <button onclick="showAddItemMenu()" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Add first item
        </button>
      </div>
    `;
  } else {
    html += '<div class="space-y-4">';

    Object.keys(itemsByDate).forEach(dateKey => {
      html += `
        <div class="border-l-2 border-blue-200 pl-4 ml-2">
          <div class="mb-3">
            <div class="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              ${formatDate(dateKey)}
            </div>
          </div>
          <div class="space-y-2">
      `;

      itemsByDate[dateKey].forEach(item => {
        const hours = String(item.time.getHours()).padStart(2, '0');
        const minutes = String(item.time.getMinutes()).padStart(2, '0');

        // Icon and color mapping to match server template exactly
        let iconHtml = '';
        if (item.type === 'flight') {
          iconHtml = '<span class="material-symbols-outlined text-blue-600 text-sm">flight</span>';
        } else if (item.type === 'hotel') {
          iconHtml = '<span class="material-symbols-outlined text-green-600 text-sm">hotel</span>';
        } else if (item.type === 'transportation') {
          iconHtml = '<span class="material-symbols-outlined text-amber-600 text-sm">train</span>';
        } else if (item.type === 'carRental') {
          iconHtml = '<span class="material-symbols-outlined text-gray-600 text-sm">directions_car</span>';
        } else if (item.type === 'event') {
          iconHtml = '<span class="material-symbols-outlined text-red-600 text-sm">event</span>';
        }

        html += `
          <div class="timeline-item flex items-start space-x-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer"
               data-item-id="${item.id}"
               data-item-type="${item.type}"
               data-marker="${item.marker || ''}"
               onmouseover="highlightMapMarker('${item.marker || ''}', '${item.type}')"
               onmouseout="unhighlightMapMarker('${item.marker || ''}')"
               onclick="editItem('${item.type}', '${item.id}')">
            ${iconHtml}
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-2 mb-1">
                <span class="text-xs font-medium text-gray-900">${hours}:${minutes}</span>
              </div>
              <p class="text-sm text-gray-600">${item.display}</p>
            </div>
            <div class="flex-shrink-0">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    html += '</div>';
  }

  html += '</div>';

  // Update the sidebar content
  sidebarContent.innerHTML = html;
}

/**
 * Refresh trip data and update map
 * @param {string} tripId - Trip ID to refresh
 */
async function refreshTripData(tripId) {
  try {
    // Fetch updated trip data from server
    const response = await fetch(`/api/trips/${tripId}`, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    if (!response.ok) {
      console.warn('Could not refresh trip data');
      return;
    }

    const updatedTrip = await response.json();

    console.log('Fetched updated trip data:', updatedTrip);

    // Update global trip data
    if (window.tripData) {
      Object.assign(window.tripData, updatedTrip);
    } else {
      window.tripData = updatedTrip;
    }

    console.log('window.tripData after update:', window.tripData);

    // Refresh the primary sidebar timeline
    refreshPrimarySidebar(window.tripData);

    // Refresh map if it exists
    if (window.currentMap && typeof initOverviewMap !== 'undefined') {
      try {
        // Reinitialize the map with updated data
        await initOverviewMap(window.tripData, 'tripMap');
      } catch (e) {
        console.warn('Could not refresh map:', e);
      }
    }

    // Refresh sidebar content if still visible
    if (window.sidebarHistory && window.sidebarHistoryIndex >= 0) {
      console.log('RE-RENDERING SIDEBAR CONTENT FROM HISTORY');
      const currentContent = window.sidebarHistory[window.sidebarHistoryIndex];
      const container = document.getElementById('secondary-sidebar-content');
      if (container) {
        console.log('Sidebar history content length:', currentContent.length);
        container.innerHTML = currentContent;
        window.initializeSidebarContent?.();
      }
    } else {
      console.log('SIDEBAR HISTORY NOT AVAILABLE:', { sidebarHistory: !!window.sidebarHistory, sidebarHistoryIndex: window.sidebarHistoryIndex });
    }
  } catch (error) {
    console.warn('Error refreshing trip data:', error);
    // Don't show error to user - refresh data is optional
  }
}

// Initialize async forms when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're in a context where async is appropriate
  // (not on redirect pages, not on forms that need full reload)
  window.canUseAsync = true;
  initAsyncFormSubmission();
});
