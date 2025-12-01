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
import '../companions.js';
import '../trip-view-sidebar.js'; // Needed for showAddForm() on dashboard when creating standalone items
// Voucher module is lazy-loaded on demand
import '../voucher-lazy-loader.js';
import '../trips-list.js';
// Event delegation handlers - MUST be imported before initializeEventDelegation()
import '../dashboard-handlers.js';

// Initialize event delegation (after handlers are registered)
initializeEventDelegation();

// Log bundle load
// eslint-disable-next-line no-console
console.log('✅ Dashboard bundle loaded');
