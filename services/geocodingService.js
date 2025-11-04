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

/**
 * Reverse geocode coordinates to get location info including country
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<{country_code: string, timezone: string} | null>}
 */
async function reverseGeocode(lat, lng) {
  if (!lat || !lng) {
    return null;
  }

  const cacheKey = `reverse_${lat}_${lng}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
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

    console.log(`Reverse geocoding: ${lat}, ${lng}`);

    // Use Nominatim reverse geocoding
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        format: 'json',
        lat: lat,
        lon: lng
      },
      headers: {
        'User-Agent': 'TravelPlannerApp/1.0'
      },
      timeout: 10000
    });

    if (response.data && response.data.address) {
      const countryCode = response.data.address.country_code?.toUpperCase();
      const result = {
        country_code: countryCode,
        timezone: getTimezoneForCountry(countryCode, lat, lng)
      };

      geocodeCache.set(cacheKey, result);
      return result;
    }

    return null;
  } catch (error) {
    console.error(`Reverse geocoding error for (${lat}, ${lng}):`, error.message);
    return null;
  }
}

/**
 * Infer timezone from latitude/longitude
 * Uses reverse geocoding to get country, then looks up timezone
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string|null>} - IANA timezone string or null
 */
async function inferTimezone(lat, lng) {
  if (!lat || !lng) {
    return null;
  }

  try {
    const geoData = await reverseGeocode(lat, lng);
    return geoData?.timezone || null;
  } catch (error) {
    console.error('Error inferring timezone:', error);
    return null;
  }
}

/**
 * Map country code to timezone
 * @param {string} countryCode - Two-letter country code (e.g., 'US', 'GB')
 * @param {number} lat - Latitude (for fallback estimation)
 * @param {number} lng - Longitude (for fallback estimation)
 * @returns {string} - IANA timezone string
 */
function getTimezoneForCountry(countryCode, lat, lng) {
  // Country code to primary timezone mapping
  const countryTimezones = {
    // Americas
    'US': 'America/New_York',
    'CA': 'America/Toronto',
    'MX': 'America/Mexico_City',
    'BR': 'America/Sao_Paulo',
    'AR': 'America/Argentina/Buenos_Aires',
    'CL': 'America/Santiago',
    'CO': 'America/Bogota',
    'PE': 'America/Lima',

    // Europe
    'GB': 'Europe/London',
    'IE': 'Europe/Dublin',
    'FR': 'Europe/Paris',
    'DE': 'Europe/Berlin',
    'IT': 'Europe/Rome',
    'ES': 'Europe/Madrid',
    'NL': 'Europe/Amsterdam',
    'BE': 'Europe/Brussels',
    'CH': 'Europe/Zurich',
    'AT': 'Europe/Vienna',
    'SE': 'Europe/Stockholm',
    'NO': 'Europe/Oslo',
    'DK': 'Europe/Copenhagen',
    'FI': 'Europe/Helsinki',
    'PL': 'Europe/Warsaw',
    'CZ': 'Europe/Prague',
    'RU': 'Europe/Moscow',

    // Asia
    'JP': 'Asia/Tokyo',
    'CN': 'Asia/Shanghai',
    'IN': 'Asia/Kolkata',
    'SG': 'Asia/Singapore',
    'TH': 'Asia/Bangkok',
    'MY': 'Asia/Kuala_Lumpur',
    'PH': 'Asia/Manila',
    'KR': 'Asia/Seoul',
    'ID': 'Asia/Jakarta',
    'VN': 'Asia/Ho_Chi_Minh',
    'HK': 'Asia/Hong_Kong',

    // Middle East
    'AE': 'Asia/Dubai',
    'SA': 'Asia/Riyadh',
    'IL': 'Asia/Jerusalem',
    'TR': 'Europe/Istanbul',

    // Africa
    'ZA': 'Africa/Johannesburg',
    'EG': 'Africa/Cairo',
    'NG': 'Africa/Lagos',
    'KE': 'Africa/Nairobi',

    // Oceania
    'AU': 'Australia/Sydney',
    'NZ': 'Pacific/Auckland'
  };

  if (countryCode && countryTimezones[countryCode]) {
    return countryTimezones[countryCode];
  }

  // Fallback: estimate timezone from longitude
  if (lng !== undefined) {
    const estimatedOffset = Math.round(lng / 15);
    if (estimatedOffset >= -12 && estimatedOffset <= 12) {
      const hours = Math.abs(estimatedOffset);
      const sign = estimatedOffset >= 0 ? '+' : '-';
      return `UTC${sign}${hours}`;
    }
  }

  return 'UTC';
}

module.exports = {
  geocodeLocation,
  reverseGeocode,
  inferTimezone,
  getTimezoneForCountry,
  clearCache,
  getCacheSize
};
