/**
 * Lazy Loader for Voucher Management Code
 * Loads voucher-related modules only when needed
 */

let voucherModuleLoaded = false;
let voucherLoadingPromise = null;

/**
 * Lazy load the voucher management module
 * @returns {Promise} Promise that resolves when module is loaded
 */
async function loadVoucherModule() {
  // If already loaded, return immediately
  if (voucherModuleLoaded) {
    return Promise.resolve();
  }

  // If currently loading, return the existing promise
  if (voucherLoadingPromise) {
    return voucherLoadingPromise;
  }

  // Start loading
  voucherLoadingPromise = import('./voucher-sidebar-manager.js')
    .then(() => {
      voucherModuleLoaded = true;
      console.log('✅ Voucher module loaded');
    })
    .catch((error) => {
      console.error('Failed to load voucher module:', error);
      voucherLoadingPromise = null; // Reset so it can be retried
      throw error;
    });

  return voucherLoadingPromise;
}

/**
 * Wrapper for openVoucherAttachmentPanel that lazy loads the module first
 */
async function openVoucherAttachmentPanel(flightId, tripId, flightDetails) {
  try {
    // Load the voucher module if not already loaded
    await loadVoucherModule();

    // Call the actual function (now available globally)
    if (typeof window.openVoucherAttachmentPanelImpl === 'function') {
      return window.openVoucherAttachmentPanelImpl(flightId, tripId, flightDetails);
    }
    console.error('openVoucherAttachmentPanelImpl not found after loading module');
  } catch (error) {
    console.error('Error opening voucher panel:', error);
  }
}

// Expose globally for inline onclick handlers
window.openVoucherAttachmentPanel = openVoucherAttachmentPanel;
