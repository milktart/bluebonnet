/**
 * Dynamic Item Color Application
 * This script applies item-specific colors to form elements
 * Colors are loaded from data attributes on the parent form
 */

(function() {
  // Color definitions - MUST match config/itemColors.js
  const ITEM_COLORS = {
    trip: '#28536b',
    flight: '#f6d965',
    hotel: '#c2a5df',
    carRental: '#fea572',
    carrentalunset: '#fea572',
    car_rental: '#fea572',
    transportation: '#67b3e0',
    event: '#ff99c9',
  };

  function getColor(itemType) {
    const normalized = String(itemType || '').toLowerCase().replace(/_/g, '');
    return ITEM_COLORS[normalized] || ITEM_COLORS.flight;
  }

  function rgbToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function applyFormColors() {
    // Find all forms with data-item-type attribute
    const forms = document.querySelectorAll('[data-item-type]');

    forms.forEach(form => {
      const itemType = form.getAttribute('data-item-type');
      const color = getColor(itemType);

      // Apply focus ring color to all inputs and textareas
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        // Store original classes
        const originalClass = input.className;

        // Replace any existing focus ring classes with our dynamic styles
        input.style.setProperty('--focus-color', color);

        // Add dynamic focus handler
        input.addEventListener('focus', function() {
          this.style.borderColor = color;
          this.style.boxShadow = `0 0 0 3px ${rgbToRgba(color, 0.1)}`;
        });

        input.addEventListener('blur', function() {
          this.style.borderColor = '';
          this.style.boxShadow = '';
        });
      });

      // Apply button colors
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.style.backgroundColor = color;

        // Add hover effect
        submitButton.addEventListener('mouseenter', function() {
          const rgb = parseInt(color.slice(1), 16);
          const r = (rgb >> 16) & 255;
          const g = (rgb >> 8) & 255;
          const b = rgb & 255;
          // Darken by 20%
          const darker = `rgb(${Math.round(r * 0.8)}, ${Math.round(g * 0.8)}, ${Math.round(b * 0.8)})`;
          this.style.backgroundColor = darker;
        });

        submitButton.addEventListener('mouseleave', function() {
          this.style.backgroundColor = color;
        });
      }

      // Apply icon/badge colors
      const iconBadges = form.querySelectorAll('[data-icon-badge]');
      iconBadges.forEach(badge => {
        const icon = badge.querySelector('[class*="material-symbols"]');
        if (icon) {
          icon.style.color = color;
          badge.style.backgroundColor = rgbToRgba(color, 0.1);
        }
      });
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyFormColors);
  } else {
    applyFormColors();
  }

  // Also apply colors when new forms are dynamically loaded (AJAX)
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    return originalFetch.apply(this, args).then(response => {
      // Clone the response so we can read it
      const clone = response.clone();
      clone.text().then(html => {
        // If response contains HTML, reapply colors after it's rendered
        if (html.includes('<form') || html.includes('input')) {
          setTimeout(applyFormColors, 100);
        }
      });
      return response;
    });
  };
})();
