/**
 * Companions Module - Consolidated companion management
 * Combines companion-selector.js, companions-manager.js, and item-companions-loader.js
 *
 * Exports:
 * - CompanionSelector: Search and select companions for forms
 * - CompanionManager: Manage companion list (edit, delete, unlink, permissions)
 * - ItemCompanionLoader: Load and manage companions for specific items
 */

// ============================================================================
// SHARED UTILITIES
// ============================================================================

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Create a companion badge element
 * @param {Object} companion - Companion data
 * @param {Function} onRemove - Callback when remove button is clicked
 * @returns {HTMLElement}
 */
function createCompanionBadge(companion, onRemove) {
  const badge = document.createElement('div');
  badge.className =
    'inline-flex items-center gap-2 bg-blue-100 text-blue-900 px-3 py-2 rounded-lg text-sm mr-2 mb-2';
  badge.dataset.companionId = companion.id;

  const nameSpan = document.createElement('span');
  nameSpan.className = 'truncate';
  nameSpan.textContent = companion.name || companion.email;

  // Status icon (only for selector)
  if (companion.isLinked !== undefined) {
    const statusIcon = document.createElement('span');
    statusIcon.className = 'text-xs ml-auto';
    statusIcon.title = companion.isLinked ? 'Linked to account' : 'Not linked to account';
    statusIcon.textContent = companion.isLinked ? '✓' : '○';
    badge.appendChild(nameSpan);
    badge.appendChild(statusIcon);
  } else {
    badge.appendChild(nameSpan);
  }

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className =
    'text-blue-900 hover:text-blue-700 font-bold ml-1 focus:outline-none flex-shrink-0';
  removeBtn.textContent = '×';
  removeBtn.style.fontSize = '1.2em';
  removeBtn.style.lineHeight = '1';
  removeBtn.title = 'Remove';
  removeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (onRemove) onRemove(companion.id);
  });

  badge.appendChild(removeBtn);
  return badge;
}

// ============================================================================
// COMPANION SELECTOR CLASS
// ============================================================================

/**
 * CompanionSelector - Search and select companions for forms
 * Used in trip creation and other forms where companions need to be selected
 */
export class CompanionSelector {
  constructor() {
    this.selectedCompanions = [];
    this.searchTimeout = null;
    this.currentResults = [];

    this.initializeElements();
    this.bindEvents();
    this.loadExistingCompanions();
  }

  initializeElements() {
    this.searchInput = document.getElementById('companionSearch');
    this.dropdown = document.getElementById('companionDropdown');
    this.selectedContainer = document.getElementById('selectedCompanions');
    this.hiddenInput = document.getElementById('companionsHidden');
    this.addCompanionBtn = document.getElementById('addCompanionBtn');
  }

  bindEvents() {
    if (!this.searchInput) return;

    // Search input events
    this.searchInput.addEventListener('input', (e) => {
      this.handleSearch(e.target.value);
    });

    this.searchInput.addEventListener('focus', () => {
      if (this.currentResults.length > 0 || this.searchInput.value.length >= 2) {
        this.showDropdown();
      }
    });

    this.searchInput.addEventListener('blur', (e) => {
      // Delay hiding to allow clicks on dropdown items
      setTimeout(() => {
        if (!this.dropdown.contains(document.activeElement)) {
          this.hideDropdown();
        }
      }, 200);
    });

    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleAddNew();
      }
    });

    // Add companion button
    if (this.addCompanionBtn) {
      this.addCompanionBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleAddNew();
      });
    }

    // Click outside to close dropdown
    document.addEventListener('click', (e) => {
      if (!this.searchInput.contains(e.target) && !this.dropdown.contains(e.target)) {
        this.hideDropdown();
      }
    });
  }

  async handleSearch(query) {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    if (query.length < 2) {
      this.hideDropdown();
      return;
    }

    this.searchTimeout = setTimeout(async () => {
      try {
        const response = await fetch(`/companions/api/search?q=${encodeURIComponent(query)}`);
        const companions = await response.json();

        // Filter out already selected companions
        this.currentResults = companions.filter(
          (c) => !this.selectedCompanions.some((sc) => sc.id === c.id)
        );

        this.displayResults(this.currentResults, query);
      } catch (error) {
        // Silently handle search errors
      }
    }, 300);
  }

  displayResults(companions, query) {
    this.dropdown.innerHTML = '';

    if (companions.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'py-2 px-4 text-sm text-gray-500';
      noResults.textContent = 'No companions found';
      this.dropdown.appendChild(noResults);
    } else {
      companions.forEach((companion) => {
        const item = this.createDropdownItem(companion);
        this.dropdown.appendChild(item);
      });
    }

    this.showDropdown();
  }

  createDropdownItem(companion) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className =
      'w-full text-left cursor-pointer py-2 px-4 hover:bg-gray-100 rounded-lg focus:outline-none focus:bg-gray-100 transition-colors';

    const mainInfo = document.createElement('div');
    mainInfo.innerHTML = `
      <div class="font-medium text-sm text-gray-900">${escapeHtml(companion.name)}</div>
      <div class="text-xs text-gray-500">${escapeHtml(companion.email)}</div>
    `;

    const statusBadges = document.createElement('div');
    statusBadges.className = 'flex gap-1 mt-1';

    if (companion.isLinked) {
      const linkedBadge = document.createElement('span');
      linkedBadge.className = 'text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded';
      linkedBadge.textContent = 'Linked';
      statusBadges.appendChild(linkedBadge);
    } else {
      const unlinkedBadge = document.createElement('span');
      unlinkedBadge.className = 'text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded';
      unlinkedBadge.textContent = 'Not Linked';
      statusBadges.appendChild(unlinkedBadge);
    }

    if (!companion.isOwn) {
      const sharedBadge = document.createElement('span');
      sharedBadge.className = 'text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded';
      sharedBadge.textContent = 'Shared';
      statusBadges.appendChild(sharedBadge);
    }

    item.appendChild(mainInfo);
    item.appendChild(statusBadges);

    item.addEventListener('click', (e) => {
      e.preventDefault();
      this.selectCompanion(companion);
    });

    return item;
  }

  selectCompanion(companion) {
    this.selectedCompanions.push(companion);
    this.updateSelectedDisplay();
    this.updateHiddenInput();
    this.searchInput.value = '';
    this.hideDropdown();
  }

  removeCompanion(companionId) {
    this.selectedCompanions = this.selectedCompanions.filter((c) => c.id !== companionId);
    this.updateSelectedDisplay();
    this.updateHiddenInput();
  }

  updateSelectedDisplay() {
    this.selectedContainer.innerHTML = '';

    this.selectedCompanions.forEach((companion) => {
      const badge = createCompanionBadge(companion, (id) => this.removeCompanion(id));
      this.selectedContainer.appendChild(badge);
    });
  }

  updateHiddenInput() {
    const companionIds = this.selectedCompanions.map((c) => c.id);
    this.hiddenInput.value = JSON.stringify(companionIds);
  }

  async handleAddNew() {
    const query = this.searchInput.value.trim();
    if (!query) {
      // Silently return if no name provided
      return;
    }

    this.showAddCompanionForm(query);
  }

  showAddCompanionForm(name = '') {
    const formHtml = `
      <div class="space-y-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 class="text-sm font-semibold text-gray-900">Add New Companion</h3>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input type="text" id="newCompanionName" value="${escapeHtml(name)}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" required>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" id="newCompanionEmail" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" required>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
          <input type="tel" id="newCompanionPhone" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
        </div>
        <div class="flex gap-2">
          <button type="button" id="saveCompanionBtn" class="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 text-sm font-medium">
            Add Companion
          </button>
          <button type="button" id="cancelCompanionBtn" class="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 text-sm font-medium">
            Cancel
          </button>
        </div>
      </div>
    `;

    let formContainer = document.getElementById('companionFormContainer');
    if (!formContainer) {
      formContainer = document.createElement('div');
      formContainer.id = 'companionFormContainer';
      this.dropdown.insertAdjacentElement('afterend', formContainer);
    }

    formContainer.innerHTML = formHtml;
    formContainer.classList.remove('hidden');

    document.getElementById('saveCompanionBtn').addEventListener('click', () => {
      this.saveNewCompanion(formContainer);
    });

    document.getElementById('cancelCompanionBtn').addEventListener('click', () => {
      formContainer.classList.add('hidden');
    });

    document.getElementById('newCompanionEmail').focus();
  }

  async saveNewCompanion(formContainer) {
    const name = document.getElementById('newCompanionName').value.trim();
    const email = document.getElementById('newCompanionEmail').value.trim();
    const phone = document.getElementById('newCompanionPhone').value.trim();

    if (!name || !email) {
      // Silently return if required fields are missing
      return;
    }

    if (!isValidEmail(email)) {
      // Silently return if email format is invalid
      return;
    }

    try {
      const response = await fetch('/companions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, phone }),
      });

      if (response.ok) {
        const newCompanion = await response.json();
        this.selectCompanion(newCompanion);
        formContainer.classList.add('hidden');
        formContainer.innerHTML = '';
        this.searchInput.value = '';
        this.hideDropdown();
      } else {
        // Silently handle response errors
      }
    } catch (error) {
      // Silently handle errors
    }
  }

  showDropdown() {
    if (this.dropdown) {
      this.dropdown.classList.remove('hidden');
    }
  }

  hideDropdown() {
    if (this.dropdown) {
      this.dropdown.classList.add('hidden');
    }
  }

  loadExistingCompanions() {
    if (window.existingCompanions && window.existingCompanions.length > 0) {
      this.setSelectedCompanions(window.existingCompanions);
    }
  }

  setSelectedCompanions(companions) {
    this.selectedCompanions = [...companions];
    this.updateSelectedDisplay();
    this.updateHiddenInput();
  }
}

// ============================================================================
// COMPANION MANAGER CLASS
// ============================================================================

/**
 * CompanionManager - Manage companion list operations
 * Used in the companions sidebar for editing, deleting, unlinking
 */
export class CompanionManager {
  constructor() {
    this.attachGlobalListeners();
  }

  attachGlobalListeners() {
    // Global click handler for all companion actions
    document.addEventListener(
      'click',
      (event) => {
        const sidebarContent = document.getElementById('secondary-sidebar-content');
        if (!sidebarContent) return;

        // Menu toggle buttons
        const menuBtn = event.target.closest('[data-companion-menu-btn]');
        if (menuBtn) {
          event.stopPropagation();
          const companionId = menuBtn.dataset.companionMenuBtn;
          const menu = sidebarContent.querySelector(`[data-companion-menu="${companionId}"]`);
          if (menu) {
            // Close other menus
            sidebarContent.querySelectorAll('[data-companion-menu]').forEach((m) => {
              if (m !== menu) m.classList.add('hidden');
            });
            menu.classList.toggle('hidden');
          }
          return;
        }

        // Edit button
        const editBtn = event.target.closest('[data-companion-edit]');
        if (editBtn) {
          event.stopPropagation();
          const companionId = editBtn.dataset.companionEdit;
          this.loadEditForm(companionId);
          return;
        }

        // Delete button
        const deleteBtn = event.target.closest('[data-companion-delete]');
        if (deleteBtn) {
          event.stopPropagation();
          const companionId = deleteBtn.dataset.companionDelete;
          this.deleteCompanion(companionId);
          return;
        }

        // Unlink button
        const unlinkBtn = event.target.closest('[data-companion-unlink]');
        if (unlinkBtn) {
          event.stopPropagation();
          const companionId = unlinkBtn.dataset.companionUnlink;
          this.unlinkCompanion(companionId);
          return;
        }

        // Permission toggle
        const permissionCheckbox = event.target.closest('[data-companion-permission]');
        if (permissionCheckbox) {
          const companionId = permissionCheckbox.dataset.companionPermission;
          this.togglePermission(companionId, permissionCheckbox.checked);
          return;
        }

        // Close menus when clicking outside
        const isMenuBtn = event.target.closest('[data-companion-menu-btn]');
        if (!isMenuBtn && sidebarContent) {
          sidebarContent.querySelectorAll('[data-companion-menu]').forEach((menu) => {
            menu.classList.add('hidden');
          });
        }
      },
      true
    ); // Use capture phase

    // Form submission handler
    document.addEventListener('submit', (event) => {
      const form = event.target;

      // Edit companion form
      if (form.id === 'edit-companion-form') {
        event.preventDefault();
        this.submitEditForm(form);
      }

      // Create companion form
      if (form.id === 'create-companion-form') {
        event.preventDefault();
        this.submitCreateForm(form);
      }
    });
  }

  loadEditForm(companionId) {
    if (typeof loadSidebarContent === 'function') {
      loadSidebarContent(`/companions/${companionId}/sidebar/edit`);
    }
  }

  async submitEditForm(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sidebar-Request': 'true',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok && response.status !== 400) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Reload the companions sidebar (on success or error to ensure consistent state)
      if (typeof loadSidebarContent === 'function') {
        await loadSidebarContent('/account/companions-sidebar', { fullWidth: true });
      }
    } catch (error) {
      // Reload the companions sidebar on error to ensure consistent state
      if (typeof loadSidebarContent === 'function') {
        await loadSidebarContent('/account/companions-sidebar', { fullWidth: true });
      }
    }
  }

  async submitCreateForm(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sidebar-Request': 'true',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok && response.status !== 400) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Reload the companions sidebar (on success or error to ensure consistent state)
      if (typeof loadSidebarContent === 'function') {
        await loadSidebarContent('/account/companions-sidebar', { fullWidth: true });
      }
    } catch (error) {
      // Reload the companions sidebar on error to ensure consistent state
      if (typeof loadSidebarContent === 'function') {
        await loadSidebarContent('/account/companions-sidebar', { fullWidth: true });
      }
    }
  }

  async deleteCompanion(companionId) {
    if (
      !confirm(
        'Are you sure you want to delete this travel companion? This will remove them from all trips they are currently part of.'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/companions/${companionId}`, {
        method: 'DELETE',
        headers: {
          'X-Sidebar-Request': 'true',
        },
      });

      if (!response.ok && response.status !== 404 && response.status !== 500) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Reload the companions sidebar (on success or error to ensure consistent state)
      if (typeof loadSidebarContent === 'function') {
        await loadSidebarContent('/account/companions-sidebar', { fullWidth: true });
      }
    } catch (error) {
      // Reload the companions sidebar on error to ensure consistent state
      if (typeof loadSidebarContent === 'function') {
        await loadSidebarContent('/account/companions-sidebar', { fullWidth: true });
      }
    }
  }

  async unlinkCompanion(companionId) {
    if (
      !confirm(
        "Are you sure you want to unlink this companion's account? They will no longer be able to see trips you've added them to until they are linked again."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/companions/${companionId}/unlink`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Sidebar-Request': 'true',
        },
      });

      if (!response.ok && response.status !== 404 && response.status !== 500) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Reload the companions sidebar (on success or error to ensure consistent state)
      if (typeof loadSidebarContent === 'function') {
        await loadSidebarContent('/account/companions-sidebar', { fullWidth: true });
      }
    } catch (error) {
      // Reload the companions sidebar on error to ensure consistent state
      if (typeof loadSidebarContent === 'function') {
        await loadSidebarContent('/account/companions-sidebar', { fullWidth: true });
      }
    }
  }

  async togglePermission(companionId) {
    try {
      const response = await fetch(`/companions/${companionId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Sidebar-Request': 'true',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok && response.status !== 404 && response.status !== 500) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        // Reload the companions sidebar on error to ensure consistent state
        if (typeof loadSidebarContent === 'function') {
          await loadSidebarContent('/account/companions-sidebar', { fullWidth: true });
        }
      }
    } catch (error) {
      // Reload the companions sidebar on error to ensure consistent state
      if (typeof loadSidebarContent === 'function') {
        await loadSidebarContent('/account/companions-sidebar', { fullWidth: true });
      }
    }
  }
}

// ============================================================================
// ITEM COMPANION LOADER CLASS
// ============================================================================

/**
 * ItemCompanionLoader - Manage companions for specific items
 * Used in flight, hotel, event forms to manage item-specific companion associations
 */
export class ItemCompanionLoader {
  constructor() {
    this.itemType = window.itemType;
    this.itemId = window.itemId;
    this.tripId = window.tripId;
  }

  /**
   * Initialize item companions
   */
  async initialize() {
    // Load companions for both trip-associated items and standalone items (if editing existing item)
    if (this.itemId) {
      // Editing existing item - load its current companions
      await this.loadCompanions();
    } else if (this.tripId) {
      // Adding new item to trip - load trip-level companions
      await this.loadCompanions();
    }

    this.initializeSearch();
    this.attachFormDebugger();
  }

  /**
   * Load companions for the current item
   */
  async loadCompanions() {
    const container = document.getElementById('itemCompanions');
    if (!container) return;

    try {
      let companions = [];

      if (this.itemId) {
        // Existing item - fetch item companions
        const response = await fetch(`/api/items/${this.itemType}/${this.itemId}/companions`);
        if (response.ok) {
          const data = await response.json();
          companions = data.data || [];
        }
      } else if (this.tripId) {
        // New item - fetch trip-level companions
        const response = await fetch(`/api/trips/${this.tripId}/companions`);
        if (response.ok) {
          const data = await response.json();
          companions = data.data || [];
        }
      }

      this.displayCompanions(companions);
    } catch (error) {
      container.innerHTML = '<div class="text-red-500 text-sm">Error loading companions</div>';
    }
  }

  /**
   * Display companions as removable badges
   */
  displayCompanions(companions) {
    const container = document.getElementById('itemCompanions');
    if (!container) return;

    if (!companions || companions.length === 0) {
      container.innerHTML =
        '<div class="text-center text-gray-500 text-sm py-2">No companions added to this item</div>';
      this.updateHiddenField([]);
      return;
    }

    container.innerHTML = '';
    companions.forEach((companion) => {
      const badge = createCompanionBadge(companion, (id) => this.removeCompanion(id));
      badge.classList.add('companion-badge');
      container.appendChild(badge);
    });

    this.updateHiddenField(companions.map((c) => c.id));
  }

  /**
   * Remove a companion from the item
   */
  async removeCompanion(companionId) {
    const badge = document.querySelector(`[data-companion-id="${companionId}"]`);
    if (!badge) return;

    const isNewItem = !this.itemId;

    try {
      // Get current companion IDs (excluding the one being removed)
      const currentBadges = document.querySelectorAll('.companion-badge');
      const companionIds = Array.from(currentBadges)
        .filter((b) => b.dataset.companionId !== companionId)
        .map((b) => b.dataset.companionId);

      // For existing items, send update to server
      if (!isNewItem) {
        const response = await fetch(`/api/items/${this.itemType}/${this.itemId}/companions`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ companionIds }),
        });

        if (!response.ok) {
          return;
        }
      }

      // Remove badge from UI
      badge.remove();

      // Check if no companions left
      const container = document.getElementById('itemCompanions');
      if (container.children.length === 0) {
        container.innerHTML =
          '<div class="text-center text-gray-500 text-sm py-2">No companions added to this item</div>';
      }

      this.updateHiddenField(companionIds);
    } catch (error) {
      // Silently handle removal errors
    }
  }

  /**
   * Add a companion to the item
   */
  async addCompanion(companionId, companionName, companionEmail) {
    const isNewItem = !this.itemId;

    try {
      // Get current companion IDs
      const currentBadges = document.querySelectorAll('.companion-badge');
      const companionIds = Array.from(currentBadges).map((b) => b.dataset.companionId);
      companionIds.push(companionId);

      // Only send to server for existing items
      if (!isNewItem) {
        const response = await fetch(`/api/items/${this.itemType}/${this.itemId}/companions`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ companionIds }),
        });

        if (!response.ok) {
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
      const badge = createCompanionBadge(
        { id: companionId, name: companionName, email: companionEmail },
        (id) => this.removeCompanion(id)
      );
      badge.classList.add('companion-badge');
      container.appendChild(badge);

      // Update hidden field
      this.updateHiddenField(companionIds);

      // Clear search
      const searchInput = document.getElementById('companionSearch');
      if (searchInput) {
        searchInput.value = '';
      }
      const searchResults = document.getElementById('companionSearchResults');
      if (searchResults) {
        searchResults.classList.add('hidden');
      }
    } catch (error) {
      // Silently handle addition errors
    }
  }

  /**
   * Update the hidden input field with companion IDs
   */
  updateHiddenField(companionIds = null) {
    let ids = companionIds;

    if (!companionIds) {
      ids = Array.from(document.querySelectorAll('.companion-badge')).map(
        (b) => b.dataset.companionId
      );
    }

    const input = document.getElementById('itemCompanionsJson');
    if (input) {
      input.value = JSON.stringify(ids);
    }
  }

  /**
   * Initialize companion search functionality
   */
  initializeSearch() {
    const searchInput = document.getElementById('companionSearch');
    const searchResults = document.getElementById('companionSearchResults');

    if (!searchInput) return;

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
            searchResults.innerHTML =
              '<div class="px-3 py-2 text-gray-500 text-sm">No companions found</div>';
            searchResults.classList.remove('hidden');
            return;
          }

          // Filter out companions already added
          const currentBadges = document.querySelectorAll('.companion-badge');
          const addedIds = new Set(Array.from(currentBadges).map((b) => b.dataset.companionId));
          const availableCompanions = companions.filter((c) => !addedIds.has(c.id));

          if (availableCompanions.length === 0) {
            searchResults.innerHTML =
              '<div class="px-3 py-2 text-gray-500 text-sm">All matching companions are already added</div>';
            searchResults.classList.remove('hidden');
            return;
          }

          searchResults.innerHTML = availableCompanions
            .map(
              (c) => `
            <div class="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0" onclick="window.itemCompanionLoader.addCompanion('${c.id}', '${escapeHtml(c.name)}', '${escapeHtml(c.email)}'); return false;">
              <div class="font-medium text-gray-900 text-sm">${escapeHtml(c.name)}</div>
              <div class="text-xs text-gray-500">${escapeHtml(c.email)}</div>
            </div>
          `
            )
            .join('');

          searchResults.classList.remove('hidden');
        } catch (error) {
          searchResults.innerHTML =
            '<div class="px-3 py-2 text-red-500 text-sm">Error searching companions</div>';
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
   * Attach form submission debugger
   */
  attachFormDebugger() {
    // Form submission tracking - no longer needed with modern debugging
  }
}

// ============================================================================
// INITIALIZATION FUNCTIONS (for backward compatibility)
// ============================================================================

/**
 * Initialize CompanionSelector (for forms)
 */
export function initCompanionSelector() {
  if (document.getElementById('companionSearch')) {
    window.companionSelectorInstance = new CompanionSelector();
  }
}

/**
 * Initialize CompanionManager (for sidebar)
 */
export function initCompanionManager() {
  if (!window.companionManagerInstance) {
    window.companionManagerInstance = new CompanionManager();
  }
}

/**
 * Initialize ItemCompanionLoader (for item forms)
 * @returns {Promise<void>} Promise that resolves when initialization is complete
 */
export async function initializeItemCompanions() {
  const loader = new ItemCompanionLoader();
  window.itemCompanionLoader = loader; // Make globally accessible
  await loader.initialize();
}

// Auto-initialize on DOMContentLoaded
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initCompanionSelector();
    initCompanionManager();
  });

  // Make classes available globally for inline onclick handlers
  window.CompanionSelector = CompanionSelector;
  window.CompanionManager = CompanionManager;
  window.ItemCompanionLoader = ItemCompanionLoader;
  window.initCompanionSelector = initCompanionSelector;
  window.initCompanionManager = initCompanionManager;
  window.initializeItemCompanions = initializeItemCompanions;

  // Legacy function names for backward compatibility
  window.unlinkCompanionAccount = function (companionId) {
    if (window.companionManagerInstance) {
      window.companionManagerInstance.unlinkCompanion(companionId);
    }
  };

  window.deleteCompanionSidebar = function (companionId) {
    if (window.companionManagerInstance) {
      window.companionManagerInstance.deleteCompanion(companionId);
    }
  };

  window.toggleCompanionPermission = function (companionId) {
    if (window.companionManagerInstance) {
      window.companionManagerInstance.togglePermission(companionId);
    }
  };

  window.removeCompanionFromItem = function (companionId) {
    if (window.itemCompanionLoader) {
      window.itemCompanionLoader.removeCompanion(companionId);
    }
  };

  window.addCompanionToItem = function (companionId, companionName, companionEmail) {
    if (window.itemCompanionLoader) {
      window.itemCompanionLoader.addCompanion(companionId, companionName, companionEmail);
    }
  };
}
