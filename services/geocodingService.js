const axios = require('axios');

// Simple in-memory cache for geocoding results
const geocodeCache = new Map();

// Rate limiting: track last request time
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

/**
 * Geocode a location name to coordinates using Nominatim (OpenStreetMap)
 * @param {string} locationName - The location to geocode
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
async function geocodeLocation(locationName) {
  if (!locationName || typeof locationName !== 'string') {
    return null;
  }

  const trimmedLocation = locationName.trim();
  if (!trimmedLocation) {
    return null;
  }

  // Check cache first
  if (geocodeCache.has(trimmedLocation)) {
    console.log(`Geocoding cache hit for: ${trimmedLocation}`);
    return geocodeCache.get(trimmedLocation);
  }

  try {
    // Respect rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve =>
        setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
      );
    }
    lastRequestTime = Date.now();

    console.log(`Geocoding: ${trimmedLocation}`);

    // Use Nominatim API for geocoding
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        format: 'json',
        q: trimmedLocation,
        limit: 1
      },
      headers: {
        'User-Agent': 'TravelPlannerApp/1.0'
      },
      timeout: 10000 // 10 second timeout
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      const coords = {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon)
      };

      // Cache the result
      geocodeCache.set(trimmedLocation, coords);

      console.log(`Geocoded ${trimmedLocation} to:`, coords);
      return coords;
    } else {
      console.log(`No geocoding results for: ${trimmedLocation}`);
      // Cache null result to avoid repeated failed lookups
      geocodeCache.set(trimmedLocation, null);
      return null;
    }
  } catch (error) {
    console.error(`Geocoding error for "${trimmedLocation}":`, error.message);
    // Don't cache errors, as they might be temporary
    return null;
  }
}

/**
 * Clear the geocoding cache
 */
function clearCache() {
  geocodeCache.clear();
  console.log('Geocoding cache cleared');
}

/**
 * Get cache size
 */
function getCacheSize() {
  return geocodeCache.size;
}

module.exports = {
  geocodeLocation,
  clearCache,
  getCacheSize
};
