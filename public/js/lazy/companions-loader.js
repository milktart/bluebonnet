/**
 * Companions Lazy Loader
 * Dynamically loads companion management features only when needed
 * Reduces initial bundle size by ~33KB
 */

let companionsLoaded = false;
let companionsLoadingPromise = null;

/**
 * Load companions module on demand
 * @returns {Promise<object>} Companions module exports
 */
export async function loadCompanions() {
  // If already loaded, return immediately
  if (companionsLoaded) {
    return window.Companions;
  }

  // If currently loading, return existing promise
  if (companionsLoadingPromise) {
    return companionsLoadingPromise;
  }

  // Start loading
  companionsLoadingPromise = (async () => {
    try {
      console.log('👥 Loading companions module...');

      // Dynamically import companions module
      const companionsModule = await import('../companions.js');

      companionsLoaded = true;
      console.log('✅ Companions module loaded');

      return companionsModule;
    } catch (error) {
      console.error('❌ Failed to load companions:', error);
      companionsLoadingPromise = null; // Allow retry
      throw error;
    }
  })();

  return companionsLoadingPromise;
}

/**
 * Initialize companions functionality
 * Automatically loads module if not already loaded
 * @param {object} options - Initialization options
 */
export async function initCompanions(options = {}) {
  await loadCompanions();

  // Initialize companions if global init function exists
  if (window.initializeCompanions) {
    window.initializeCompanions(options);
  }
}

/**
 * Auto-load companions when companion-related elements are detected
 */
export function autoLoadCompanions() {
  // Check if page has companion-related UI
  const hasCompanionUI =
    document.querySelector('[data-companion]') ||
    document.querySelector('[id*="companion"]') ||
    document.querySelector('[class*="companion"]') ||
    document.querySelector('#tripCompanionSearch') ||
    document.querySelector('#companionSearch') ||
    document.querySelector('#companionSelector');

  if (hasCompanionUI) {
    // Load on user interaction instead of immediately
    const loadOnInteraction = () => {
      loadCompanions();
      // Remove listeners after first interaction
      document.removeEventListener('click', loadOnInteraction);
      document.removeEventListener('focus', loadOnInteraction, true);
    };

    document.addEventListener('click', loadOnInteraction);
    document.addEventListener('focus', loadOnInteraction, true);
  }
}
