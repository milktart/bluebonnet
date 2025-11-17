/**
 * Trip View Bundle Entry Point (Optimized)
 * Core functionality loaded immediately, heavy modules loaded lazily
 * Phase 4 - Bundle Optimization
 */

// Core modules (always needed)
import '../trip-view-utils.js';
import '../trip-view-sidebar.js';
import '../sidebar-loader.js';
import '../async-form-handler.js';

// Lazy-loaded modules (loaded on demand)
import { autoLoadPreline } from '../lazy/preline-loader.js';
import { loadMaps } from '../lazy/maps-loader.js';
import { autoLoadCompanions } from '../lazy/companions-loader.js';

// Voucher module is lazy-loaded on demand
import '../voucher-lazy-loader.js';

// Auto-detect and lazy load modules as needed
document.addEventListener('DOMContentLoaded', async () => {
  // Lazy load Preline if UI components exist
  autoLoadPreline();

  // Load maps eagerly on trip view page (needed for initOverviewMap)
  // Check if map container exists before loading
  const hasMap = document.querySelector('#tripMap, [id*="map"]');
  if (hasMap) {
    await loadMaps();
  }

  // Lazy load companions when companion UI is detected
  autoLoadCompanions();
});

// Log bundle load
console.log('✅ Trip view bundle loaded (optimized)');
