/**
 * Base Controller Helpers
 * Common CRUD patterns shared across all resource controllers
 * Reduces code duplication in flightController, hotelController, etc.
 */

const geocodingService = require('../../services/geocodingService');
const { localToUTC } = require('../../utils/timezoneHelper');
/**
 * Verify that a trip exists and belongs to the current user
 * @param {string} tripId - Trip ID to verify
 * @param {string} userId - Current user's ID
 * @param {Object} Trip - Trip model
 * @returns {Promise<Object|null>} - Trip object if valid, null otherwise
 */
async function verifyTripOwnership(tripId, userId, Trip) {
  if (!tripId) return null;

  const trip = await Trip.findOne({
    where: { id: tripId, userId },
  });

  return trip;
}

/**
 * Geocode a location if it has changed
 * @param {string} newLocation - New location string
 * @param {string} oldLocation - Previous location string (or null for new records)
 * @param {Object} oldCoords - Previous coordinates {lat, lng} (or null for new records)
 * @returns {Promise<Object|null>} - Coordinates {lat, lng} or null
 */
async function geocodeIfChanged(newLocation, oldLocation = null, oldCoords = null) {
  if (!newLocation) return null;

  // If location hasn't changed, return existing coordinates
  if (oldLocation && newLocation === oldLocation && oldCoords) {
    return oldCoords;
  }

  // Geocode the new location
  return geocodingService.geocodeLocation(newLocation);
}

/**
 * Convert two locations to coordinates (for resources with origin/destination)
 * Handles both new records and updates
 * @param {Object} params
 * @param {string} params.originNew - New origin location
 * @param {string} params.originOld - Previous origin location
 * @param {Object} params.originCoordsOld - Previous origin coordinates {lat, lng}
 * @param {string} params.destNew - New destination location
 * @param {string} params.destOld - Previous destination location
 * @param {Object} params.destCoordsOld - Previous destination coordinates {lat, lng}
 * @returns {Promise<Object>} - {originCoords, destCoords}
 */
async function geocodeOriginDestination({
  originNew,
  originOld = null,
  originCoordsOld = null,
  destNew,
  destOld = null,
  destCoordsOld = null,
}) {
  const originCoords = await geocodeIfChanged(originNew, originOld, originCoordsOld);
  const destCoords = await geocodeIfChanged(destNew, destOld, destCoordsOld);

  return { originCoords, destCoords };
}

/**
 * Verify resource ownership (for resources that belong directly to a user)
 * @param {Object} resource - Resource object with userId
 * @param {string} currentUserId - Current user's ID
 * @returns {boolean} - True if user owns the resource
 */
function verifyResourceOwnership(resource, currentUserId) {
  if (!resource) return false;

  // Convert both to strings for comparison
  const resourceUserId = String(resource.userId || '');
  const userId = String(currentUserId || '');

  return resourceUserId === userId;
}

/**
 * Verify resource ownership through trip (for resources that belong to a trip)
 * @param {Object} resource - Resource object with trip association
 * @param {string} currentUserId - Current user's ID
 * @returns {boolean} - True if user owns the trip that owns the resource
 */
function verifyResourceOwnershipViaTrip(resource, currentUserId) {
  if (!resource || !resource.trip) return false;

  // Convert both to strings for comparison (UUIDs can be objects or strings)
  const tripUserId = String(resource.trip.userId || '');
  const userId = String(currentUserId || '');

  return tripUserId === userId;
}

/**
 * Convert datetime-local input to UTC
 * @param {string} datetime - Datetime string
 * @param {string} timezone - Timezone string
 * @returns {Date} - UTC date
 */
function convertToUTC(datetime, timezone) {
  return localToUTC(datetime, timezone);
}

/**
 * Geocode location with airport code fallback (for flights)
 * Uses timezone data from data/airports.json as the source of truth
 * @param {string} location - Location string (could be airport code or address)
 * @param {Object} airportService - Airport service for code lookup
 * @param {string} currentTimezone - Current timezone (will be updated if airport found)
 * @returns {Promise<Object>} - {coords: {lat, lng}, timezone: string, formattedLocation: string}
 */
async function geocodeWithAirportFallback(location, airportService, currentTimezone = null) {
  if (!location) return { coords: null, timezone: currentTimezone, formattedLocation: location };

  // Check if location is or starts with a 3-letter airport code
  // Handles both "AUS" and "AUS - Austin, United States"
  const airportCodeMatch = location.trim().match(/^([A-Z]{3})(\s|$|-)/i);
  let airportCode = null;

  if (airportCodeMatch) {
    airportCode = airportCodeMatch[1].toUpperCase();
  } else if (location.length === 3 && /^[A-Z]{3}$/i.test(location.trim())) {
    airportCode = location.trim().toUpperCase();
  }

  if (airportCode) {
    const airportData = await airportService.getAirportByCode(airportCode);
    if (airportData) {
      // Use timezone from database as source of truth
      const timezone = airportData.timezone || currentTimezone;
      return {
        coords: { lat: airportData.lat, lng: airportData.lng },
        timezone,
        formattedLocation: `${airportData.iata} - ${airportData.city}, ${airportData.country}`,
      };
    }
  }

  // Fallback to regular geocoding
  const coords = await geocodingService.geocodeLocation(location);
  return {
    coords,
    timezone: currentTimezone,
    formattedLocation: location,
  };
}

module.exports = {
  verifyTripOwnership,
  geocodeIfChanged,
  geocodeOriginDestination,
  verifyResourceOwnership,
  verifyResourceOwnershipViaTrip,
  convertToUTC,
  geocodeWithAirportFallback,
};
