/**
 * Common Event Handlers
 * Phase 4 - Frontend Modernization: Event Delegation
 *
 * Centralized handlers for common UI interactions
 */

/* eslint-disable no-alert, no-console, import/prefer-default-export */

import { registerHandlers, getElementData } from './event-delegation.js';

/**
 * Dismiss alert/notification
 * Usage: <button data-action="dismissAlert" data-target="alert-id">×</button>
 */
function dismissAlert(element) {
  const data = getElementData(element);
  const targetId = data.target;

  if (targetId) {
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      // Fade out animation
      targetElement.style.transition = 'opacity 0.3s ease-out';
      targetElement.style.opacity = '0';

      // Remove after animation
      setTimeout(() => {
        targetElement.remove();
      }, 300);
    }
  } else {
    // If no target specified, remove the closest alert
    const alert = element.closest('[role="alert"], .alert, [id*="alert"]');
    if (alert) {
      alert.style.transition = 'opacity 0.3s ease-out';
      alert.style.opacity = '0';
      setTimeout(() => {
        alert.remove();
      }, 300);
    }
  }
}

/**
 * Toggle visibility of an element
 * Usage: <button data-action="toggleVisibility" data-target="element-id">Toggle</button>
 */
function toggleVisibility(element) {
  const data = getElementData(element);
  const targetId = data.target;

  if (targetId) {
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.classList.toggle('hidden');
    }
  }
}

/**
 * Navigate to URL
 * Usage: <button data-action="navigate" data-url="/path">Go</button>
 */
function navigate(element) {
  const data = getElementData(element);
  const { url } = data;

  if (url) {
    window.location.href = url;
  }
}

/**
 * Confirm and navigate
 * Usage: <button data-action="confirmNavigate" data-url="/path" data-confirm="Are you sure?">Delete</button>
 */
function confirmNavigate(element) {
  const data = getElementData(element);
  const { url } = data;
  const message = data.confirm || 'Are you sure?';

  if (url && window.confirm(message)) {
    window.location.href = url;
  }
}

/**
 * Copy text to clipboard
 * Usage: <button data-action="copyToClipboard" data-text="Text to copy">Copy</button>
 */
async function copyToClipboard(element) {
  const data = getElementData(element);
  const { text } = data;

  if (text) {
    try {
      await navigator.clipboard.writeText(text);

      // Show success feedback
      const originalText = element.textContent;
      element.textContent = '✓ Copied!';

      setTimeout(() => {
        element.textContent = originalText;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  }
}

/**
 * Stop event propagation
 * Usage: <div data-action="stopPropagation">Content</div>
 */
function stopPropagation(element, event) {
  event.stopPropagation();
}

/**
 * Register all common handlers
 */
export function registerCommonHandlers() {
  registerHandlers({
    dismissAlert,
    toggleVisibility,
    navigate,
    confirmNavigate,
    copyToClipboard,
    stopPropagation,
  });

  console.log('✅ Common event handlers registered');
}

// Initialize on module load
registerCommonHandlers();
