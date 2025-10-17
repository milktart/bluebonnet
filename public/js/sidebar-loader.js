/**
 * Sidebar Loader
 * Handles loading content into the secondary sidebar via AJAX
 */

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

  // Initialize companion selector if the form has one
  if (document.getElementById('companionSearch')) {
    if (typeof initCompanionSelector === 'function') {
      initCompanionSelector();
    }
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
