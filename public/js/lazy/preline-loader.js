/**
 * Preline UI Lazy Loader
 * Dynamically loads Preline only when UI components are needed
 * Reduces initial bundle size by ~380KB
 */

let prelineLoaded = false;
let prelineLoadingPromise = null;

/**
 * Load Preline UI library on demand
 * @returns {Promise<void>}
 */
export async function loadPreline() {
  // If already loaded, return immediately
  if (prelineLoaded) {
    return;
  }

  // If currently loading, return existing promise
  if (prelineLoadingPromise) {
    return prelineLoadingPromise;
  }

  // Start loading
  prelineLoadingPromise = (async () => {
    try {
      // Dynamically import Preline
      await import('../preline.js');

      prelineLoaded = true;

      // Initialize Preline components on the page
      if (window.HSStaticMethods && window.HSStaticMethods.autoInit) {
        window.HSStaticMethods.autoInit();
      }
    } catch (error) {
      prelineLoadingPromise = null; // Allow retry
      throw error;
    }
  })();

  return prelineLoadingPromise;
}

/**
 * Initialize Preline for specific elements
 * Automatically loads Preline if not already loaded
 * @param {HTMLElement|string} element - Element or selector
 */
export async function initPrelineFor(element) {
  await loadPreline();

  // Re-initialize Preline for dynamic content
  if (window.HSStaticMethods && window.HSStaticMethods.autoInit) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) {
      window.HSStaticMethods.autoInit([el]);
    }
  }
}

/**
 * Check if page needs Preline and load it
 * Call this on page load to auto-detect Preline components
 */
export async function autoLoadPreline() {
  // Check if page has Preline components
  const hasPrelineComponents =
    document.querySelector('[data-hs-overlay]') ||
    document.querySelector('[data-hs-dropdown]') ||
    document.querySelector('[data-hs-accordion]') ||
    document.querySelector('[data-hs-tab]') ||
    document.querySelector('[data-hs-tooltip]') ||
    document.querySelector('[data-hs-collapse]') ||
    document.querySelector('[data-hs-combobox]');

  if (hasPrelineComponents) {
    await loadPreline();
  }
}
