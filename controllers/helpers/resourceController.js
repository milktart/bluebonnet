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
    where: { id: tripId, userId: userId }
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
  return await geocodingService.geocodeLocation(newLocation);
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
  destCoordsOld = null
}) {
  const originCoords = await geocodeIfChanged(originNew, originOld, originCoordsOld);
  const destCoords = await geocodeIfChanged(destNew, destOld, destCoordsOld);

  return { originCoords, destCoords };
}

/**
 * Standard redirect after CRUD operation
 * @param {Object} res - Express response object
 * @param {Object} req - Express request object
 * @param {string} tripId - Trip ID to redirect to (or null)
 * @param {string} tab - Tab to show on trip view page
 * @param {string} successMessage - Flash message to show
 */
function redirectAfterSuccess(res, req, tripId, tab, successMessage) {
  if (successMessage) {
    req.flash('success_msg', successMessage);
  }

  if (tripId) {
    res.redirect(`/trips/${tripId}?tab=${tab}`);
  } else {
    res.redirect('/trips');
  }
}

/**
 * Standard redirect after error
 * @param {Object} res - Express response object
 * @param {Object} req - Express request object
 * @param {string} tripId - Trip ID to redirect to (or null)
 * @param {string} errorMessage - Flash message to show
 */
function redirectAfterError(res, req, tripId, errorMessage) {
  if (errorMessage) {
    req.flash('error_msg', errorMessage);
  }

  if (tripId) {
    res.redirect(`/trips/${tripId}`);
  } else {
    res.redirect('/trips');
  }
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

  return resource.trip.userId === currentUserId;
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

module.exports = {
  verifyTripOwnership,
  geocodeIfChanged,
  geocodeOriginDestination,
  redirectAfterSuccess,
  redirectAfterError,
  verifyResourceOwnership,
  verifyResourceOwnershipViaTrip,
  convertToUTC
};
