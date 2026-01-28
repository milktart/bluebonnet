/**
 * Dashboard Bundle Entry Point
 * Includes all JavaScript needed for the dashboard page
 */

// Import event delegation setup
import { initializeEventDelegation } from '../event-delegation.js';

// Import dashboard-specific modules
import '../maps.js';
import '../trip-view-utils.js';
import '../sidebar-loader.js';
import '../async-form-handler.js'; // Needed for form submission in sidebar
// Companion management now handled by Svelte components
import '../trip-view-sidebar.js'; // Needed for showAddForm() on dashboard when creating standalone items
// Voucher module is lazy-loaded on demand
import '../voucher-lazy-loader.js';
import '../trips-list.js';
// Event delegation handlers - MUST be imported before initializeEventDelegation()
import '../dashboard-handlers.js';

// Initialize event delegation immediately (after handlers are registered)
// This ensures event delegation works even if the module loads after DOMContentLoaded fires
initializeEventDelegation();

// Also ensure it's reinitialized if DOMContentLoaded hasn't fired yet
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeEventDelegation();
  });
}
