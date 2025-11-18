/**
 * Event Delegation System
 * Phase 4 - Frontend Modernization: Remove global pollution
 *
 * Centralized event handling using data attributes instead of inline onclick handlers
 * Benefits:
 * - No global function pollution
 * - Better security (CSP-friendly)
 * - Works with dynamically loaded content
 * - Easier to maintain and test
 */

/* eslint-disable no-alert, no-console */

/**
 * Event handler registry
 * Maps action names to handler functions
 */
const eventHandlers = new Map();

/**
 * Register an event handler
 * @param {string} action - Action name (e.g., 'openModal', 'deleteItem')
 * @param {function} handler - Handler function (receives element and event)
 */
export function registerHandler(action, handler) {
  if (eventHandlers.has(action)) {
    console.warn(`Handler for action "${action}" is being overwritten`);
  }
  eventHandlers.set(action, handler);
}

/**
 * Register multiple handlers at once
 * @param {object} handlers - Object mapping action names to handler functions
 */
export function registerHandlers(handlers) {
  Object.entries(handlers).forEach(([action, handler]) => {
    registerHandler(action, handler);
  });
}

/**
 * Handle click events with data-action attribute
 * @param {Event} event - Click event
 */
function handleClick(event) {
  const target = event.target.closest('[data-action]');
  if (!target) return;

  const action = target.getAttribute('data-action');
  const handler = eventHandlers.get(action);

  if (handler) {
    // Prevent default behavior unless data-allow-default is set
    if (!target.hasAttribute('data-allow-default')) {
      event.preventDefault();
    }

    // Stop propagation if data-stop-propagation is set
    if (target.hasAttribute('data-stop-propagation')) {
      event.stopPropagation();
    }

    // Call the handler with the element and event
    handler(target, event);
  } else {
    console.warn(`No handler registered for action: ${action}`);
  }
}

/**
 * Handle change events with data-on-change attribute
 * @param {Event} event - Change event
 */
function handleChange(event) {
  const target = event.target.closest('[data-on-change]');
  if (!target) return;

  const action = target.getAttribute('data-on-change');
  const handler = eventHandlers.get(action);

  if (handler) {
    handler(target, event);
  } else {
    console.warn(`No handler registered for change action: ${action}`);
  }
}

/**
 * Handle submit events with data-on-submit attribute
 * @param {Event} event - Submit event
 */
function handleSubmit(event) {
  const target = event.target.closest('[data-on-submit]');
  if (!target) return;

  const action = target.getAttribute('data-on-submit');
  const handler = eventHandlers.get(action);

  if (handler) {
    event.preventDefault(); // Always prevent default for form submissions
    handler(target, event);
  } else {
    console.warn(`No handler registered for submit action: ${action}`);
  }
}

/**
 * Handle mouseover events with data-on-hover attribute
 * @param {Event} event - Mouseover event
 */
function handleMouseOver(event) {
  const target = event.target.closest('[data-on-hover]');
  if (!target) return;

  const action = target.getAttribute('data-on-hover');
  const handler = eventHandlers.get(action);

  if (handler) {
    handler(target, event);
  }
}

/**
 * Handle mouseout events with data-on-hover-end attribute
 * @param {Event} event - Mouseout event
 */
function handleMouseOut(event) {
  const target = event.target.closest('[data-on-hover-end]');
  if (!target) return;

  const action = target.getAttribute('data-on-hover-end');
  const handler = eventHandlers.get(action);

  if (handler) {
    handler(target, event);
  }
}

/**
 * Initialize event delegation
 * Sets up document-level event listeners
 */
export function initializeEventDelegation() {
  // Click delegation
  document.addEventListener('click', handleClick);

  // Change delegation (for selects, inputs, etc.)
  document.addEventListener('change', handleChange);

  // Submit delegation (for forms)
  document.addEventListener('submit', handleSubmit);

  // Hover delegation
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mouseout', handleMouseOut);

  console.log('✅ Event delegation initialized');
}

/**
 * Helper: Get data attributes from element
 * @param {HTMLElement} element - Element to extract data from
 * @returns {object} Object with all data attributes
 */
export function getElementData(element) {
  const data = {};

  // Get all data-* attributes
  Array.from(element.attributes).forEach((attr) => {
    if (attr.name.startsWith('data-')) {
      const key = attr.name
        .substring(5) // Remove 'data-'
        .replace(/-([a-z])/g, (g) => g[1].toUpperCase()); // Convert kebab-case to camelCase
      data[key] = attr.value;
    }
  });

  return data;
}

/**
 * Helper: Confirm action with user
 * @param {string} message - Confirmation message
 * @returns {boolean} True if user confirms
 */
export function confirmAction(message) {
  return window.confirm(message);
}

// Make functions available globally for backward compatibility
if (typeof window !== 'undefined') {
  window.registerHandler = registerHandler;
  window.registerHandlers = registerHandlers;
  window.initializeEventDelegation = initializeEventDelegation;
  window.getElementData = getElementData;
  window.confirmAction = confirmAction;
}
