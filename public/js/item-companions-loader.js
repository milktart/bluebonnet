/**
 * Item Companions Loader
 * Handles loading and displaying travel companions for specific items (flights, hotels, etc.)
 *
 * The system works as follows:
 * 1. Trip-level companions are automatically added to all items in that trip
 * 2. The trip owner is automatically added to all items
 * 3. Individual companions can be removed from specific items
 * 4. When companions are removed, this persists even if new trip companions are added
 * 5. The companion selection is sent to the form's hidden field for submission
 */

/**
 * Load companions for an item from the database
 * For new items (no itemId), loads trip-level companions
 * For existing items, loads item-specific companions
 */
async function loadItemCompanions(itemType, itemId, tripId) {
  const container = document.getElementById('itemCompanions');
  if (!container) return;

  console.log('loadItemCompanions called with:', { itemType, itemId, tripId });

  try {
    let companions = [];

    if (itemId) {
      // Existing item - fetch item companions
      console.log('Fetching item companions from /api/items/' + itemType + '/' + itemId + '/companions');
      const response = await fetch(`/api/items/${itemType}/${itemId}/companions`);
      if (response.ok) {
        const data = await response.json();
        companions = data.data || [];
        console.log('Fetched item companions:', companions);
      }
    } else if (tripId) {
      // New item - fetch trip-level companions that will be auto-added
      console.log('Fetching trip companions from /api/trips/' + tripId + '/companions');
      const response = await fetch(`/api/trips/${tripId}/companions`);
      if (response.ok) {
        const data = await response.json();
        companions = data.data || [];
        console.log('Fetched trip companions:', companions);
      }
    }

    // Display companions
    displayItemCompanions(companions);

  } catch (error) {
    console.error('Error loading companions:', error);
    container.innerHTML = '<div class="text-red-500 text-sm">Error loading companions</div>';
  }
}

/**
 * Display companions as removable badges
 */
function displayItemCompanions(companions) {
  const container = document.getElementById('itemCompanions');
  if (!container) return;

  console.log('displayItemCompanions called with:', companions);

  if (!companions || companions.length === 0) {
    container.innerHTML = '<div class="text-center text-gray-500 text-sm py-2">No companions added to this item</div>';
    updateCompanionIdsForSubmission([]);
    return;
  }

  container.innerHTML = companions.map(c => `
    <div class="companion-badge inline-flex items-center gap-2 bg-blue-100 text-blue-900 px-3 py-2 rounded-lg text-sm mr-2 mb-2" data-companion-id="${c.id}">
      <span class="truncate">${c.name || c.email}</span>
      <button
        type="button"
        class="remove-companion-btn text-blue-900 hover:text-blue-700 font-bold ml-1 focus:outline-none flex-shrink-0"
        onclick="removeCompanionFromItem('${c.id}'); return false;"
        title="Remove from this item"
        style="font-size: 1.2em; line-height: 1;"
      >
        ×
      </button>
    </div>
  `).join('');

  updateCompanionIdsForSubmission(companions.map(c => c.id));
}

/**
 * Remove a companion from just this item
 * For existing items, persists the removal to the database via API call
 * For new items, just updates the selection without API call
 */
async function removeCompanionFromItem(companionId) {
  const badge = document.querySelector(`[data-companion-id="${companionId}"]`);
  if (!badge) return;

  const itemType = window.itemType;
  const itemId = window.itemId;
  const isNewItem = !itemId;

  if (!itemType) {
    console.error('Cannot remove companion: missing itemType');
    return;
  }

  try {
    // Get current companion IDs (excluding the one being removed)
    const currentBadges = document.querySelectorAll('.companion-badge');
    const companionIds = Array.from(currentBadges)
      .filter(b => b.dataset.companionId !== companionId)
      .map(b => b.dataset.companionId);

    // For existing items, send update to server
    if (!isNewItem) {
      const response = await fetch(`/api/items/${itemType}/${itemId}/companions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ companionIds })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Error removing companion:', error);
        alert('Failed to remove companion. Please try again.');
        return;
      }
    }

    // Remove badge from UI
    badge.remove();

    // Check if no companions left
    const container = document.getElementById('itemCompanions');
    if (container.children.length === 0) {
      container.innerHTML = '<div class="text-center text-gray-500 text-sm py-2">No companions added to this item</div>';
    }

    updateCompanionIdsForSubmission(companionIds);
  } catch (error) {
    console.error('Error removing companion:', error);
    alert('Failed to remove companion. Please try again.');
  }
}

/**
 * Update the hidden input field with current companion IDs
 * This is what gets submitted with the form
 */
function updateCompanionIdsForSubmission(companionIds = null) {
  let ids = companionIds;

  if (!companionIds) {
    // Get IDs from current badges
    ids = Array.from(document.querySelectorAll('.companion-badge')).map(b => b.dataset.companionId);
  }

  const input = document.getElementById('itemCompanionsJson');
  if (input) {
    input.value = JSON.stringify(ids);
    console.log('Updated companion IDs for submission:', ids);
  }
}

/**
 * Initialize item companions loading and search
 * Called from form templates when they load
 */
function initializeItemCompanions() {
  const itemType = window.itemType;
  const itemId = window.itemId;
  const tripId = window.tripId;

  console.log('initializeItemCompanions called with:', { itemType, itemId, tripId });

  if (tripId) {
    loadItemCompanions(itemType, itemId, tripId);
  }

  // Initialize companion search
  initializeCompanionSearch();

  // Add form submission debugging
  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', function(e) {
      const companionsInput = document.getElementById('itemCompanionsJson');
      if (companionsInput) {
        console.log('Form submitting with companions field:', companionsInput.value);
      }
    });
  }
}

/**
 * Initialize companion search functionality
 */
function initializeCompanionSearch() {
  const searchInput = document.getElementById('companionSearch');
  const searchResults = document.getElementById('companionSearchResults');

  if (!searchInput) return;

  // Debounce search to avoid too many API calls
  let searchTimeout;

  searchInput.addEventListener('input', async (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();

    if (query.length < 2) {
      searchResults.classList.add('hidden');
      return;
    }

    searchTimeout = setTimeout(async () => {
      try {
        const response = await fetch(`/companions/api/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Search failed');

        const companions = await response.json();

        if (!Array.isArray(companions) || companions.length === 0) {
          searchResults.innerHTML = '<div class="px-3 py-2 text-gray-500 text-sm">No companions found</div>';
          searchResults.classList.remove('hidden');
          return;
        }

        // Get current companion IDs to filter out already added ones
        const currentBadges = document.querySelectorAll('.companion-badge');
        const addedIds = new Set(Array.from(currentBadges).map(b => b.dataset.companionId));

        // Filter out companions already added to this item
        const availableCompanions = companions.filter(c => !addedIds.has(c.id));

        if (availableCompanions.length === 0) {
          searchResults.innerHTML = '<div class="px-3 py-2 text-gray-500 text-sm">All matching companions are already added</div>';
          searchResults.classList.remove('hidden');
          return;
        }

        searchResults.innerHTML = availableCompanions.map(c => `
          <div class="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0" onclick="addCompanionToItem('${c.id}', '${c.name.replace(/'/g, "\\'")}', '${c.email.replace(/'/g, "\\'")}'); return false;">
            <div class="font-medium text-gray-900 text-sm">${c.name}</div>
            <div class="text-xs text-gray-500">${c.email}</div>
          </div>
        `).join('');

        searchResults.classList.remove('hidden');
      } catch (error) {
        console.error('Error searching companions:', error);
        searchResults.innerHTML = '<div class="px-3 py-2 text-red-500 text-sm">Error searching companions</div>';
        searchResults.classList.remove('hidden');
      }
    }, 300);
  });

  // Close search results when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#companionSearch') && !e.target.closest('#companionSearchResults')) {
      searchResults.classList.add('hidden');
    }
  });
}

/**
 * Add a companion to the item
 */
async function addCompanionToItem(companionId, companionName, companionEmail) {
  const itemType = window.itemType;
  const itemId = window.itemId;
  const isNewItem = !itemId;

  if (!itemType) {
    console.error('Cannot add companion: missing itemType');
    return;
  }

  try {
    // Get current companion IDs
    const currentBadges = document.querySelectorAll('.companion-badge');
    const companionIds = Array.from(currentBadges).map(b => b.dataset.companionId);
    companionIds.push(companionId);

    // Only send to server for existing items
    if (!isNewItem) {
      const response = await fetch(`/api/items/${itemType}/${itemId}/companions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ companionIds })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Error adding companion:', error);
        alert('Failed to add companion. Please try again.');
        return;
      }
    }

    // Add badge to UI
    const container = document.getElementById('itemCompanions');

    // Remove "no companions" message if present
    const emptyMessage = container.querySelector('.text-center.text-gray-500');
    if (emptyMessage) {
      emptyMessage.remove();
    }

    // Create new badge
    const badge = document.createElement('div');
    badge.className = 'companion-badge inline-flex items-center gap-2 bg-blue-100 text-blue-900 px-3 py-2 rounded-lg text-sm mr-2 mb-2';
    badge.dataset.companionId = companionId;
    badge.innerHTML = `
      <span class="truncate">${companionName || companionEmail}</span>
      <button
        type="button"
        class="remove-companion-btn text-blue-900 hover:text-blue-700 font-bold ml-1 focus:outline-none flex-shrink-0"
        onclick="removeCompanionFromItem('${companionId}'); return false;"
        title="Remove from this item"
        style="font-size: 1.2em; line-height: 1;"
      >
        ×
      </button>
    `;
    container.appendChild(badge);

    // Update hidden field
    updateCompanionIdsForSubmission(companionIds);

    // Clear search
    const searchInput = document.getElementById('companionSearch');
    searchInput.value = '';
    document.getElementById('companionSearchResults').classList.add('hidden');
  } catch (error) {
    console.error('Error adding companion:', error);
    alert('Failed to add companion. Please try again.');
  }
}
