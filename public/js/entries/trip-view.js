/**
 * Trip View Bundle Entry Point
 * Includes all JavaScript needed for individual trip view page
 */

// Import trip-view specific modules
import '../maps.js';
import '../trip-view-utils.js';
import '../preline.js';
import '../trip-view-sidebar.js';
import '../sidebar-loader.js';
import '../async-form-handler.js';
import '../companions.js';
// Voucher module is lazy-loaded on demand
import '../voucher-lazy-loader.js';

// Log bundle load
console.log('✅ Trip view bundle loaded');
