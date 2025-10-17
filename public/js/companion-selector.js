class CompanionSelector {
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
        this.currentResults = companions.filter(c =>
          !this.selectedCompanions.some(sc => sc.id === c.id)
        );

        this.displayResults(this.currentResults, query);
      } catch (error) {
        console.error('Search failed:', error);
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
      companions.forEach(companion => {
        const item = this.createDropdownItem(companion);
        this.dropdown.appendChild(item);
      });
    }

    this.showDropdown();
  }

  createDropdownItem(companion) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'w-full text-left cursor-pointer py-2 px-4 hover:bg-gray-100 rounded-lg focus:outline-none focus:bg-gray-100 transition-colors';

    const mainInfo = document.createElement('div');
    mainInfo.innerHTML = `
      <div class="font-medium text-sm text-gray-900">${this.escapeHtml(companion.name)}</div>
      <div class="text-xs text-gray-500">${this.escapeHtml(companion.email)}</div>
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
    this.selectedCompanions = this.selectedCompanions.filter(c => c.id !== companionId);
    this.updateSelectedDisplay();
    this.updateHiddenInput();
  }

  updateSelectedDisplay() {
    this.selectedContainer.innerHTML = '';

    this.selectedCompanions.forEach(companion => {
      const badge = document.createElement('div');
      badge.className = 'inline-flex items-center gap-2 bg-blue-100 text-blue-900 px-3 py-2 rounded-lg text-sm mr-2 mb-2';

      const nameSpan = document.createElement('span');
      nameSpan.textContent = companion.name;

      const statusIcon = document.createElement('span');
      statusIcon.className = 'text-xs ml-auto';
      statusIcon.title = companion.isLinked ? 'Linked to account' : 'Not linked to account';
      statusIcon.textContent = companion.isLinked ? '✓' : '○';

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'text-blue-900 hover:text-blue-700 font-bold ml-1 focus:outline-none';
      removeBtn.textContent = '×';
      removeBtn.style.fontSize = '1.2em';
      removeBtn.style.lineHeight = '1';
      removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.removeCompanion(companion.id);
      });

      badge.appendChild(nameSpan);
      badge.appendChild(statusIcon);
      badge.appendChild(removeBtn);

      this.selectedContainer.appendChild(badge);
    });
  }

  updateHiddenInput() {
    const companionIds = this.selectedCompanions.map(c => c.id);
    this.hiddenInput.value = JSON.stringify(companionIds);
  }

  async handleAddNew() {
    const query = this.searchInput.value.trim();
    if (!query) {
      alert('Please enter a name for the new companion');
      return;
    }

    // Create inline form for adding new companion
    this.showAddCompanionForm(query);
  }

  showAddCompanionForm(name = '') {
    // Create a simple inline form instead of modal
    const formHtml = `
      <div class="space-y-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 class="text-sm font-semibold text-gray-900">Add New Companion</h3>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input type="text" id="newCompanionName" value="${this.escapeHtml(name)}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" required>
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

    // Find or create a container for the form
    let formContainer = document.getElementById('companionFormContainer');
    if (!formContainer) {
      formContainer = document.createElement('div');
      formContainer.id = 'companionFormContainer';
      this.dropdown.insertAdjacentElement('afterend', formContainer);
    }

    formContainer.innerHTML = formHtml;
    formContainer.classList.remove('hidden');

    // Bind buttons
    document.getElementById('saveCompanionBtn').addEventListener('click', () => {
      this.saveNewCompanion(formContainer);
    });

    document.getElementById('cancelCompanionBtn').addEventListener('click', () => {
      formContainer.classList.add('hidden');
    });

    // Focus on email field
    document.getElementById('newCompanionEmail').focus();
  }

  async saveNewCompanion(formContainer) {
    const name = document.getElementById('newCompanionName').value.trim();
    const email = document.getElementById('newCompanionEmail').value.trim();
    const phone = document.getElementById('newCompanionPhone').value.trim();

    if (!name || !email) {
      alert('Name and email are required');
      return;
    }

    if (!this.isValidEmail(email)) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      const response = await fetch('/companions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, phone })
      });

      if (response.ok) {
        const newCompanion = await response.json();
        this.selectCompanion(newCompanion);
        formContainer.classList.add('hidden');
        formContainer.innerHTML = '';
        this.searchInput.value = '';
        this.hideDropdown();
      } else {
        const errorData = await response.text();
        alert('Failed to add companion: ' + errorData);
      }
    } catch (error) {
      console.error('Error adding companion:', error);
      alert('Failed to add companion');
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
    // Load existing companions if available (for edit forms)
    if (window.existingCompanions && window.existingCompanions.length > 0) {
      this.setSelectedCompanions(window.existingCompanions);
    }
  }

  setSelectedCompanions(companions) {
    this.selectedCompanions = [...companions];
    this.updateSelectedDisplay();
    this.updateHiddenInput();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize when page loads or when form is loaded
function initCompanionSelector() {
  if (document.getElementById('companionSearch')) {
    window.companionSelectorInstance = new CompanionSelector();
  }
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initCompanionSelector);
