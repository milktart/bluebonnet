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

// Initialize event delegation immediately (don't wait for DOMContentLoaded)
// This ensures event delegation works even if the module loads after DOMContentLoaded fires
initializeEventDelegation();

// Also ensure it's reinitialized if DOMContentLoaded hasn't fired yet
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeEventDelegation();
  });
}
