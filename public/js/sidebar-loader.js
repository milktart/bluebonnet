/**
 * Sidebar Loader
 * Handles loading content into the secondary sidebar via AJAX
 */

// Sidebar state management for back navigation
let sidebarHistory = [];
let sidebarHistoryIndex = -1;

/**
 * Load content into the secondary sidebar
 * @param {string} url - The URL to fetch content from
 */
async function loadSidebarContent(url) {
  try {
    // Show loading state
    const container = document.getElementById('secondary-sidebar-content');
    if (!container) {
      console.error('Secondary sidebar content container not found');
      return;
    }

    container.innerHTML = '<div class="text-center py-8"><p class="text-gray-500">Loading...</p></div>';

    // Fetch the content
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Sidebar-Request': 'true'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get the HTML content
    const html = await response.text();

    // Insert the content into the sidebar
    container.innerHTML = html;

    // Save to history (remove any forward history if we're going back then forward)
    sidebarHistory = sidebarHistory.slice(0, sidebarHistoryIndex + 1);
    sidebarHistory.push(html);
    sidebarHistoryIndex++;

    // Open the sidebar
    openSecondarySidebar();

    // Re-initialize any scripts/interactions in the loaded content
    initializeSidebarContent();

    // Scripts in the loaded partials handle their own interactions via global listeners or inline handlers
  } catch (error) {
    console.error('Error loading sidebar content:', error);
    const container = document.getElementById('secondary-sidebar-content');
    if (container) {
      container.innerHTML = '<div class="p-4"><p class="text-red-600">Error loading content. Please try again.</p></div>';
    }
  }
}

/**
 * Initialize event listeners and interactions for loaded content
 */
function initializeSidebarContent() {
  // Handle form submissions to stay in sidebar or reload page
  const forms = document.querySelectorAll('#secondary-sidebar-content form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      // Let the form submit naturally, but it will redirect
      // For now, we'll let the server handle redirects as normal
    });
  });

  // Handle delete/modal confirmations
  const deleteButtons = document.querySelectorAll('#secondary-sidebar-content [data-action="delete"]');
  deleteButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      if (!confirm('Are you sure?')) {
        e.preventDefault();
      }
    });
  });

  // Close sidebar button
  const closeButton = document.querySelector('#secondary-sidebar-content .close-sidebar');
  if (closeButton) {
    closeButton.addEventListener('click', closeSecondarySidebar);
  }

  // Handle event edit form save button
  const saveEventBtn = document.getElementById('saveEventBtn');

  if (saveEventBtn) {
    // Add a simple click handler first
    saveEventBtn.onclick = function(e) {
      e.preventDefault();
      if (typeof handleEventEditFormSubmit === 'function') {
        handleEventEditFormSubmit(e);
      }
    };

    // Also add addEventListener as backup
    saveEventBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (typeof handleEventEditFormSubmit === 'function') {
        handleEventEditFormSubmit(e);
      }
    });
  }

  // Initialize companion selector if the form has one
  if (document.getElementById('companionSearch')) {
    if (typeof initCompanionSelector === 'function') {
      initCompanionSelector();
    }
  }
}

/**
 * Navigate back in sidebar history
 */
function goBackInSidebar() {
  if (sidebarHistoryIndex > 0) {
    sidebarHistoryIndex--;
    const container = document.getElementById('secondary-sidebar-content');
    if (container) {
      container.innerHTML = sidebarHistory[sidebarHistoryIndex];
      initializeSidebarContent();
    }
  } else {
    // No history, close the sidebar
    closeSecondarySidebar();
    // Reset history when closing
    sidebarHistory = [];
    sidebarHistoryIndex = -1;
  }
}

/**
 * Close the secondary sidebar
 */
function closeSecondarySidebar() {
  const sidebar = document.getElementById('secondary-sidebar');
  if (sidebar) {
    sidebar.classList.remove('open');
  }
  // Reset history when closing
  sidebarHistory = [];
  sidebarHistoryIndex = -1;
}

/**
 * Open the secondary sidebar
 */
function openSecondarySidebar() {
  const sidebar = document.getElementById('secondary-sidebar');
  if (sidebar) {
    sidebar.classList.add('open');
  }
}

/**
 * Handle event edit form submission
 * Global function that can be called from dynamically loaded content
 */
async function handleEventEditFormSubmit(e) {
  e.preventDefault();

  try {
    // Get the event ID from the form's data attribute or from the page context
    const eventIdMatch = document.getElementById('event-edit-form')?.getAttribute('data-event-id') ||
                         window.currentEventId ||
                         document.querySelector('[data-event-id]')?.getAttribute('data-event-id');

    // Alternatively, try to extract from button's onclick or nearby elements
    let eventId = eventIdMatch;

    if (!eventId) {
      // Try to get it from the action attribute if form has one
      const form = document.getElementById('event-edit-form');
      if (form && form.action) {
        const match = form.action.match(/\/events\/([^\/]+)/);
        if (match) eventId = match[1];
      }
    }

    // Get all form values
    const nameEl = document.getElementById('eventName');
    const locationEl = document.getElementById('eventLocation');
    const startDateEl = document.getElementById('eventStartDate');
    const startTimeEl = document.getElementById('eventStartTime');
    const endDateEl = document.getElementById('eventEndDate');
    const endTimeEl = document.getElementById('eventEndTime');
    const phoneEl = document.getElementById('eventContactPhone');
    const emailEl = document.getElementById('eventContactEmail');
    const descEl = document.getElementById('eventDescription');
    const urlEl = document.getElementById('eventEventUrl');

    const formData = {
      name: nameEl ? nameEl.value : '',
      location: locationEl ? locationEl.value : '',
      startDate: startDateEl ? startDateEl.value : '',
      startTime: startTimeEl ? startTimeEl.value : '',
      endDate: endDateEl ? endDateEl.value : '',
      endTime: endTimeEl ? endTimeEl.value : '',
      timezone: 'UTC',
      contactPhone: phoneEl ? phoneEl.value : '',
      contactEmail: emailEl ? emailEl.value : '',
      description: descEl ? descEl.value : '',
      eventUrl: urlEl ? urlEl.value : ''
    };

    if (!eventId) {
      alert('Error: Could not determine event ID');
      return;
    }

    const response = await fetch('/events/' + eventId, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    const result = await response.json();

    if (response.ok) {
      // Reload the page to refresh the primary sidebar with updated event
      window.location.reload();
    } else {
      alert('Error updating event: ' + (result.error || 'Unknown error'));
    }
  } catch (error) {
    alert('Error updating event: ' + error.message);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Close sidebar when clicking outside of it
  document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('secondary-sidebar');
    const isPrimaryClicked = event.target.closest('.primary-sidebar');
    const isSecondaryClicked = event.target.closest('.secondary-sidebar');

    // Don't close if clicking on buttons that open the sidebar
    const isOpenButton = event.target.closest('[onclick*="loadSidebarContent"]') ||
                         event.target.closest('[onclick*="showCreateTripForm"]') ||
                         event.target.closest('[onclick*="showAddItemMenu"]') ||
                         event.target.closest('[onclick*="showAddForm"]');

    if (sidebar && !isSecondaryClicked && !isPrimaryClicked && !isOpenButton && sidebar.classList.contains('open')) {
      // Optionally close on outside click
      // closeSecondarySidebar();
    }
  });

  // Allow pressing Escape to close sidebar
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      const sidebar = document.getElementById('secondary-sidebar');
      if (sidebar && sidebar.classList.contains('open')) {
        closeSecondarySidebar();
      }
    }
  });
});
