/**
 * Dashboard Bundle Entry Point
 * Includes all JavaScript needed for the dashboard page
 */

// Import dashboard-specific modules
import '../maps.js';
import '../trip-view-utils.js';
import '../sidebar-loader.js';
import '../companions.js';
// Voucher module is lazy-loaded on demand
import '../voucher-lazy-loader.js';
import '../trips-list.js';

// Log bundle load
console.log('✅ Dashboard bundle loaded');
