/**
 * Maps Lazy Loader
 * Dynamically loads map functionality only when needed
 * Reduces initial bundle size by ~25KB
 */

let mapsLoaded = false;
let mapsLoadingPromise = null;

/**
 * Load maps module on demand
 * @returns {Promise<object>} Maps module exports
 */
export async function loadMaps() {
  // If already loaded, return immediately
  if (mapsLoaded) {
    return window.TripMaps;
  }

  // If currently loading, return existing promise
  if (mapsLoadingPromise) {
    return mapsLoadingPromise;
  }

  // Start loading
  mapsLoadingPromise = (async () => {
    try {
      // Dynamically import maps module
      const mapsModule = await import('../maps.js');

      mapsLoaded = true;

      return mapsModule;
    } catch (error) {
      mapsLoadingPromise = null; // Allow retry
      throw error;
    }
  })();

  return mapsLoadingPromise;
}

/**
 * Initialize map for a specific container
 * @param {string|HTMLElement} container - Map container element or ID
 * @param {object} options - Map initialization options
 * @returns {Promise<object>} Map instance
 */
export async function initMap(container, options = {}) {
  await loadMaps();

  const containerId = typeof container === 'string' ? container : container.id;

  // Initialize map using global function
  if (window.initializeMap) {
    return window.initializeMap(containerId, options);
  }

  throw new Error('Map initialization function not available');
}

/**
 * Auto-load maps if map containers exist on page
 * Uses Intersection Observer for viewport detection
 */
export function autoLoadMaps() {
  const mapContainers = document.querySelectorAll('[id*="map"], [class*="map"]');

  if (mapContainers.length === 0) {
    return;
  }

  // Use Intersection Observer to load maps when they come into view
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadMaps();
          observer.disconnect(); // Load once and stop observing
        }
      });
    },
    { rootMargin: '100px' } // Start loading 100px before map enters viewport
  );

  mapContainers.forEach((container) => observer.observe(container));
}
