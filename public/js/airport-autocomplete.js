/**
 * Airport Autocomplete - AJAX-based
 * Provides autocomplete functionality for airport fields using API endpoint
 * Replaces client-side searchAirports() with server-side AJAX calls
 */

class AirportAutocomplete {
  constructor(inputElement, options = {}) {
    this.input = inputElement;
    this.container = inputElement.closest('[data-airport-autocomplete]');
    this.dropdown = this.container?.querySelector('[data-airport-dropdown]');
    this.timezoneField = options.timezoneField || null;
    this.onSelect = options.onSelect || null;

    // Configuration
    this.apiUrl = '/api/v1/airports/search';
    this.minChars = 2;
    this.debounceMs = 300;
    this.maxResults = 10;

    // State
    this.debounceTimer = null;
    this.selectedIndex = -1;
    this.results = [];
    this.isOpen = false;

    this.init();
  }

  init() {
    if (!this.input || !this.dropdown) {
      return;
    }

    // Event listeners
    this.input.addEventListener('input', (e) => this.handleInput(e));
    this.input.addEventListener('focus', (e) => this.handleFocus(e));
    this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
    this.input.addEventListener('blur', (e) => this.handleBlur(e));

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.close();
      }
    });
  }

  handleInput(e) {
    const query = e.target.value.trim();

    // Clear debounce timer
    clearTimeout(this.debounceTimer);

    // Close dropdown if query is too short
    if (query.length < this.minChars) {
      this.close();
      return;
    }

    // Debounce the search
    this.debounceTimer = setTimeout(() => {
      this.search(query);
    }, this.debounceMs);
  }

  handleFocus(e) {
    const query = e.target.value.trim();
    if (query.length >= this.minChars) {
      this.search(query);
    }
  }

  handleKeydown(e) {
    if (!this.isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.results.length - 1);
        this.updateSelection();
        break;

      case 'ArrowUp':
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        this.updateSelection();
        break;

      case 'Enter':
        e.preventDefault();
        if (this.selectedIndex >= 0) {
          this.selectResult(this.results[this.selectedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        this.close();
        break;
    }
  }

  handleBlur(e) {
    // Delay to allow click on dropdown item
    setTimeout(() => {
      this.close();
    }, 200);
  }

  async search(query) {
    try {
      const response = await fetch(
        `${this.apiUrl}?q=${encodeURIComponent(query)}&limit=${this.maxResults}`
      );

      if (!response.ok) {
        this.close();
        return;
      }

      const data = await response.json();

      if (data.success && data.airports) {
        this.results = data.airports;
        this.renderResults();
        this.open();
      } else {
        this.close();
      }
    } catch (error) {
      this.close();
    }
  }

  renderResults() {
    if (this.results.length === 0) {
      this.dropdown.innerHTML =
        '<div class="py-2 px-4 text-sm text-gray-500">No airports found</div>';
      return;
    }

    this.dropdown.innerHTML = this.results
      .map(
        (airport, index) => `
      <div class="airport-result cursor-pointer py-2 px-4 text-sm text-gray-800 hover:bg-gray-100 rounded-lg ${index === this.selectedIndex ? 'bg-gray-100' : ''}"
           data-index="${index}"
           data-iata="${airport.iata}"
           data-timezone="${airport.timezone || ''}">
        <div class="font-medium">${airport.iata} - ${airport.city}</div>
        <div class="text-xs text-gray-500">${airport.name}, ${airport.country}</div>
      </div>
    `
      )
      .join('');

    // Add click handlers to results
    this.dropdown.querySelectorAll('.airport-result').forEach((item) => {
      item.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Prevent blur
        const index = parseInt(item.dataset.index, 10);
        this.selectResult(this.results[index]);
      });
    });
  }

  updateSelection() {
    const items = this.dropdown.querySelectorAll('.airport-result');
    items.forEach((item, index) => {
      if (index === this.selectedIndex) {
        item.classList.add('bg-gray-100');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('bg-gray-100');
      }
    });
  }

  selectResult(airport) {
    // Set input value to IATA code
    this.input.value = airport.iata;

    // Update timezone field if provided
    if (this.timezoneField && airport.timezone) {
      const tzField = document.getElementById(this.timezoneField);
      if (tzField) {
        tzField.value = airport.timezone;
      }
    }

    // Call custom onSelect callback if provided
    if (this.onSelect) {
      this.onSelect(airport);
    }

    // Close dropdown
    this.close();
  }

  open() {
    this.dropdown.classList.remove('hidden');
    this.isOpen = true;
    this.selectedIndex = -1;
  }

  close() {
    this.dropdown.classList.add('hidden');
    this.isOpen = false;
    this.selectedIndex = -1;
  }
}

// Initialize all airport autocomplete fields on page load
function initializeAirportAutocomplete() {
  // Find all airport autocomplete containers
  const containers = document.querySelectorAll('[data-airport-autocomplete]');

  containers.forEach((container) => {
    const input = container.querySelector('input[data-airport-input]');
    const fieldName = input?.name;

    if (!input) return;

    // Determine timezone field based on input name
    let timezoneField = null;
    if (fieldName === 'origin') {
      timezoneField = 'originTimezone';
      // Check for edit mode
      if (input.id.includes('edit_flight_origin')) {
        timezoneField = 'edit_flight_originTimezone';
      }
    } else if (fieldName === 'destination') {
      timezoneField = 'destinationTimezone';
      // Check for edit mode
      if (input.id.includes('edit_flight_destination')) {
        timezoneField = 'edit_flight_destinationTimezone';
      }
    }

    // Initialize autocomplete
    new AirportAutocomplete(input, { timezoneField });
  });
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAirportAutocomplete);
} else {
  initializeAirportAutocomplete();
}

// Export for manual initialization
window.AirportAutocomplete = AirportAutocomplete;
window.initializeAirportAutocomplete = initializeAirportAutocomplete;
