/**
 * Common Bundle Entry Point
 * Shared utilities used across all pages
 */

// Import WebSocket client (must load before other modules that use it)
import '../socket-client.js';

// Import event delegation system
import { initializeEventDelegation } from '../event-delegation.js';
import '../common-handlers.js'; // Register common event handlers

// Import shared modules
import '../datetime-formatter.js';
import '../time-input-formatter.js';
import '../main.js';
import '../notifications.js';

// Initialize event delegation on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initializeEventDelegation();
});

// Log bundle load
// eslint-disable-next-line no-console
console.log('✅ Common bundle loaded');
