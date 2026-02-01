/**
 * API v1 Car Rentals Routes
 * RESTful JSON API for car rental management
 */

const express = require('express');
const apiResponse = require('../../../utils/apiResponse');
const { ensureAuthenticated } = require('../../../middleware/auth');
const { getItemPermissions } = require('../../../utils/itemPermissionHelper');

const router = express.Router();

/**
 * Helper function to load trip companions with trip owner listed first
 */
async function loadTripCompanions(tripId, trip) {
  if (!tripId || !trip) return [];

  const { TripCompanion, TravelCompanion, User } = require('../../../models');
  const tripCompanions = [];

  const tripCompanionRecords = await TripCompanion.findAll({
    where: { tripId },
    include: [
      {
        model: TravelCompanion,
        as: 'companion',
        attributes: ['id', 'email', 'firstName', 'lastName', 'name', 'userId'],
      },
    ],
  });

  // Add trip owner as first companion if not already in list
  const tripOwnerInList = tripCompanionRecords.some((tc) => tc.companion?.userId === trip.userId);
  if (!tripOwnerInList && trip.userId) {
    const owner = await User.findByPk(trip.userId, {
      attributes: ['id', 'firstName', 'lastName', 'email'],
    });
    if (owner) {
      tripCompanions.push({
        id: owner.id,
        email: owner.email,
        firstName: owner.firstName,
        lastName: owner.lastName,
        name: `${owner.firstName} ${owner.lastName}`.trim(),
        userId: owner.id,
        isOwner: true,
      });
    }
  }

  // Add other trip companions
  tripCompanions.push(
    ...tripCompanionRecords.map((tc) => ({
      id: tc.companion.id,
      email: tc.companion.email,
      firstName: tc.companion.firstName,
      lastName: tc.companion.lastName,
      name: tc.companion.name,
      userId: tc.companion.userId,
    }))
  );

  return tripCompanions;
}

// Handle CORS preflight requests
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// All car rental routes require authentication
router.use(ensureAuthenticated);

/**
 * GET /api/v1/car-rentals/trips/:tripId
 * Retrieve all car rentals associated with a specific trip
 *
 * Returns car rentals ordered by pickup date/time (earliest first)
 * Validates that requesting user owns the trip
 *
 * @param {string} req.params.tripId - Trip ID (UUID)
 *
 * @returns {Object} 200 OK response with car rentals array
 * @returns {Array} returns - Array of car rental objects
 * @returns {string} returns[].id - Car rental ID
 * @returns {string} returns[].tripId - Associated trip ID
 * @returns {string} returns[].company - Rental company name
 * @returns {string} returns[].carType - Vehicle type (sedan, SUV, etc.)
 * @returns {string} returns[].pickupLocation - Pickup location
 * @returns {string} returns[].pickupDateTime - Pickup in UTC ISO format
 * @returns {string} returns[].dropoffDateTime - Dropoff in UTC ISO format
 * @returns {string} [returns[].confirmationNumber] - Booking confirmation
 *
 * @throws {401} Unauthorized - User not authenticated
 * @throws {403} Forbidden - User does not own the trip
 * @throws {404} Not found - Trip not found
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
 */
router.get('/trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { CarRental } = require('../../../models');
    const { Trip } = require('../../../models');

    // Verify trip belongs to user
    const trip = await Trip.findOne({
      where: { id: tripId, userId: req.user.id },
    });

    if (!trip) {
      return apiResponse.forbidden(res, 'Access denied');
    }

    const carRentals = await CarRental.findAll({
      where: { tripId },
      order: [['pickupDateTime', 'ASC']],
    });

    return apiResponse.success(res, carRentals, `Retrieved ${carRentals.length} car rentals`);
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to retrieve car rentals', error);
  }
});

/**
 * GET /api/v1/car-rentals/:id
 * Retrieve a specific car rental with its companion assignments
 *
 * Includes all companions assigned to this rental (both direct and inherited from trip)
 *
 * @param {string} req.params.id - Car rental ID (UUID)
 *
 * @returns {Object} 200 OK response with car rental details
 * @returns {string} returns.id - Car rental ID
 * @returns {string} returns.company - Rental company
 * @returns {string} returns.carType - Vehicle type (sedan, SUV, compact, minivan, etc.)
 * @returns {string} returns.carModel - Vehicle model
 * @returns {string} returns.carColor - Vehicle color
 * @returns {string} returns.pickupLocation - Pickup location address
 * @returns {string} returns.dropoffLocation - Dropoff location address
 * @returns {string} returns.pickupDateTime - Pickup in UTC ISO format
 * @returns {string} returns.dropoffDateTime - Dropoff in UTC ISO format
 * @returns {string} [returns.confirmationNumber] - Booking reference
 * @returns {string} [returns.rentalAgreementNumber] - Agreement number
 * @returns {number} [returns.dailyRate] - Daily rate
 * @returns {Array} returns.itemCompanions - Assigned companions
 * @returns {string} returns.itemCompanions[].id - Companion ID
 * @returns {string} returns.itemCompanions[].email - Companion email
 * @returns {string} returns.itemCompanions[].firstName - First name
 * @returns {string} returns.itemCompanions[].lastName - Last name
 * @returns {boolean} returns.itemCompanions[].inheritedFromTrip - Trip-level flag
 *
 * @throws {401} Unauthorized - User not authenticated
 * @throws {404} Not found - Car rental not found
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
 */
router.get('/:id', async (req, res) => {
  try {
    const { CarRental, Trip, TravelCompanion, ItemCompanion, User } = require('../../../models');
    const carRental = await CarRental.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }],
    });

    if (!carRental) {
      return apiResponse.notFound(res, 'Car rental not found');
    }

    // Get companions for this car rental
    const itemCompanions = await ItemCompanion.findAll({
      where: { itemType: 'car_rental', itemId: carRental.id },
      include: [
        {
          model: TravelCompanion,
          as: 'companion',
          attributes: ['id', 'email', 'firstName', 'lastName', 'name', 'userId'],
        },
      ],
    });

    // Add companions to response
    const rentalData = carRental.toJSON();
    const companionsList = itemCompanions.map((ic) => ({
      id: ic.companion.id,
      companionId: ic.companion.id,
      email: ic.companion.email,
      firstName: ic.companion.firstName,
      lastName: ic.companion.lastName,
      name: ic.companion.name,
      userId: ic.companion.userId,
      inheritedFromTrip: ic.inheritedFromTrip,
    }));

    // Add car rental owner as first companion if not already in list
    if (carRental.userId) {
      const ownerInList = companionsList.some((c) => c.userId === carRental.userId);
      if (!ownerInList) {
        const owner = await User.findByPk(carRental.userId, {
          attributes: ['id', 'firstName', 'lastName', 'email'],
        });
        if (owner) {
          companionsList.unshift({
            id: owner.id,
            email: owner.email,
            firstName: owner.firstName,
            lastName: owner.lastName,
            name: `${owner.firstName} ${owner.lastName}`.trim(),
            userId: owner.id,
            isOwner: true,
          });
        }
      }
    }

    rentalData.itemCompanions = companionsList;

    // Set canEdit flag using centralized permission helper
    const userId = req.user?.id;
    const permissions = await getItemPermissions(carRental, userId);
    rentalData.canEdit = permissions.canEdit;
    rentalData.canDelete = permissions.canDelete;

    // Add trip companions if car rental is part of a trip
    let tripCompanions = [];
    if (carRental.tripId && carRental.trip) {
      tripCompanions = await loadTripCompanions(carRental.tripId, carRental.trip);
      rentalData.tripCompanions = tripCompanions;
      rentalData.tripOwnerId = carRental.trip.userId;
    } else if (carRental.tripId && !carRental.trip) {
      // If tripId exists but trip wasn't loaded, fetch it
      const { Trip } = require('../../../models');
      const trip = await Trip.findByPk(carRental.tripId);
      if (trip) {
        tripCompanions = await loadTripCompanions(carRental.tripId, trip);
        rentalData.tripCompanions = tripCompanions;
        rentalData.tripOwnerId = trip.userId;
      }
    }

    return apiResponse.success(res, rentalData, 'Car rental retrieved successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to retrieve car rental', error);
  }
});

/**
 * POST /api/v1/car-rentals
 * Create a standalone car rental (not associated with a trip)
 *
 * Supports separate date and time fields for pickup and dropoff
 * Combines into pickupDateTime and dropoffDateTime
 *
 * @param {Object} req.body - Request body
 * @param {string} req.body.company - Rental company name
 * @param {string} req.body.carType - Vehicle type (sedan, SUV, compact, minivan, etc.)
 * @param {string} [req.body.carModel] - Vehicle model
 * @param {string} [req.body.carColor] - Vehicle color
 * @param {string} req.body.pickupLocation - Pickup location address
 * @param {string} req.body.dropoffLocation - Dropoff location address
 * @param {string} [req.body.pickupDate] - Pickup date (YYYY-MM-DD)
 * @param {string} [req.body.pickupTime] - Pickup time (HH:mm)
 * @param {string} [req.body.dropoffDate] - Dropoff date (YYYY-MM-DD)
 * @param {string} [req.body.dropoffTime] - Dropoff time (HH:mm)
 * @param {string} [req.body.confirmationNumber] - Booking confirmation
 * @param {string} [req.body.rentalAgreementNumber] - Agreement number
 * @param {number} [req.body.dailyRate] - Daily rental rate
 * @param {string} [req.body.notes] - Additional notes
 *
 * @returns {Object} 201 Created response with car rental object
 * @returns {string} returns.id - Car rental ID (UUID)
 * @returns {string} returns.company - Rental company
 * @returns {string} returns.carType - Vehicle type
 * @returns {string} returns.pickupLocation - Pickup location
 * @returns {string} returns.dropoffLocation - Dropoff location
 * @returns {string} returns.pickupDateTime - Pickup in UTC ISO format
 * @returns {string} returns.dropoffDateTime - Dropoff in UTC ISO format
 *
 * @throws {400} Bad request - Missing required fields
 * @throws {401} Unauthorized - User not authenticated
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
 */
router.post('/', async (req, res) => {
  try {
    const { CarRental } = require('../../../models');

    // Transform form data to match model
    const rentalData = {
      ...req.body,
      userId: req.user.id,
    };

    // Combine date and time fields into datetime
    if (req.body.pickupDate && req.body.pickupTime) {
      rentalData.pickupDateTime = new Date(`${req.body.pickupDate}T${req.body.pickupTime}`);
    }
    if (req.body.dropoffDate && req.body.dropoffTime) {
      rentalData.dropoffDateTime = new Date(`${req.body.dropoffDate}T${req.body.dropoffTime}`);
    }

    // Create car rental without tripId (standalone)
    const carRental = await CarRental.create(rentalData);

    return apiResponse.created(res, carRental, 'Car rental created successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to create car rental', error);
  }
});

/**
 * POST /api/v1/car-rentals/trips/:tripId
 * Create a car rental for a specific trip
 *
 * Automatically adds all trip-level companions to the new car rental
 * Validates trip ownership and processes date/time fields
 *
 * @param {string} req.params.tripId - Trip ID (UUID)
 * @param {Object} req.body - Request body (same as POST /api/v1/car-rentals)
 * @param {string} req.body.company - Rental company
 * @param {string} req.body.carType - Vehicle type
 * @param {string} [req.body.carModel] - Vehicle model
 * @param {string} [req.body.carColor] - Vehicle color
 * @param {string} req.body.pickupLocation - Pickup location
 * @param {string} req.body.dropoffLocation - Dropoff location
 * @param {string} [req.body.pickupDate] - Pickup date (YYYY-MM-DD)
 * @param {string} [req.body.pickupTime] - Pickup time (HH:mm)
 * @param {string} [req.body.dropoffDate] - Dropoff date (YYYY-MM-DD)
 * @param {string} [req.body.dropoffTime] - Dropoff time (HH:mm)
 * @param {string} [req.body.confirmationNumber] - Confirmation number
 * @param {string} [req.body.rentalAgreementNumber] - Agreement number
 * @param {number} [req.body.dailyRate] - Daily rate
 *
 * @returns {Object} 201 Created response with car rental object
 * @returns {string} returns.id - Car rental ID
 * @returns {string} returns.tripId - Associated trip ID
 * @returns {Array} returns.itemCompanions - Auto-added companions from trip level
 *
 * @throws {400} Bad request - Invalid parameters
 * @throws {401} Unauthorized - User not authenticated
 * @throws {403} Forbidden - User does not own the trip
 * @throws {404} Not found - Trip not found
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
 */
router.post('/trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { Trip } = require('../../../models');
    const { CarRental } = require('../../../models');
    const itemCompanionHelper = require('../../../utils/itemCompanionHelper');

    // Verify trip belongs to user
    const trip = await Trip.findOne({
      where: { id: tripId, userId: req.user.id },
    });

    if (!trip) {
      return apiResponse.forbidden(res, 'Access denied');
    }

    // Transform form data to match model
    const rentalData = {
      ...req.body,
      tripId,
    };

    // Combine date and time fields into datetime
    if (req.body.pickupDate && req.body.pickupTime) {
      rentalData.pickupDateTime = new Date(`${req.body.pickupDate}T${req.body.pickupTime}`);
    }
    if (req.body.dropoffDate && req.body.dropoffTime) {
      rentalData.dropoffDateTime = new Date(`${req.body.dropoffDate}T${req.body.dropoffTime}`);
    }

    // Create car rental
    const carRental = await CarRental.create(rentalData);

    // Auto-add trip-level companions to the new car rental
    try {
      await itemCompanionHelper.autoAddTripCompanions(
        'car_rental',
        carRental.id,
        tripId,
        req.user.id
      );
    } catch (companionError) {
      // Log error but don't fail the car rental creation
      console.error('[Car Rental Creation] Error auto-adding companions:', companionError);
    }

    return apiResponse.created(res, carRental, 'Car rental created successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to create car rental', error);
  }
});

/**
 * PUT /api/v1/car-rentals/:id
 * Update an existing car rental
 *
 * Processes date/time fields and validates car rental exists
 *
 * @param {string} req.params.id - Car rental ID (UUID)
 * @param {Object} req.body - Request body with updatable fields
 * @param {string} [req.body.company] - Updated rental company
 * @param {string} [req.body.carType] - Updated vehicle type
 * @param {string} [req.body.carModel] - Updated vehicle model
 * @param {string} [req.body.carColor] - Updated vehicle color
 * @param {string} [req.body.pickupLocation] - Updated pickup location
 * @param {string} [req.body.dropoffLocation] - Updated dropoff location
 * @param {string} [req.body.pickupDate] - Updated pickup date (YYYY-MM-DD)
 * @param {string} [req.body.pickupTime] - Updated pickup time (HH:mm)
 * @param {string} [req.body.dropoffDate] - Updated dropoff date (YYYY-MM-DD)
 * @param {string} [req.body.dropoffTime] - Updated dropoff time (HH:mm)
 * @param {string} [req.body.confirmationNumber] - Updated confirmation number
 * @param {string} [req.body.rentalAgreementNumber] - Updated agreement number
 * @param {number} [req.body.dailyRate] - Updated daily rate
 * @param {string} [req.body.notes] - Updated notes
 *
 * @returns {Object} 200 OK response with updated car rental
 * @returns {string} returns.id - Car rental ID
 * @returns {string} returns.company - Updated company
 * @returns {string} returns.carType - Updated vehicle type
 * @returns {string} returns.pickupDateTime - Updated pickup (ISO format)
 * @returns {string} returns.dropoffDateTime - Updated dropoff (ISO format)
 *
 * @throws {401} Unauthorized - User not authenticated
 * @throws {404} Not found - Car rental not found
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
 */
router.put('/:id', async (req, res) => {
  try {
    const { CarRental, Trip } = require('../../../models');
    const { requireItemEditPermission } = require('../../../utils/itemPermissionHelper');
    const carRental = await CarRental.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }],
    });

    if (!carRental) {
      return apiResponse.notFound(res, 'Car rental not found');
    }

    // Check permission to edit
    await requireItemEditPermission(carRental, req.user.id, 'car rental');

    // Transform form data to match model
    const rentalData = { ...req.body };
    const newTripId = rentalData.tripId;
    const oldTripId = carRental.tripId;

    // Combine date and time fields into datetime
    if (req.body.pickupDate && req.body.pickupTime) {
      rentalData.pickupDateTime = new Date(`${req.body.pickupDate}T${req.body.pickupTime}`);
    }
    if (req.body.dropoffDate && req.body.dropoffTime) {
      rentalData.dropoffDateTime = new Date(`${req.body.dropoffDate}T${req.body.dropoffTime}`);
    }

    // Update car rental
    const updated = await carRental.update(rentalData);

    // Handle trip association changes via ItemTrip junction table
    if (newTripId !== undefined && newTripId !== oldTripId) {
      try {
        const ItemTripService = require('../../../services/itemTripService');
        const itemTripService = new ItemTripService();

        // Remove from old trip if there was one
        if (oldTripId) {
          await itemTripService.removeItemFromTrip('car_rental', carRental.id, oldTripId);
        }

        // Add to new trip if one was provided
        if (newTripId) {
          await itemTripService.addItemToTrip('car_rental', carRental.id, newTripId, req.user.id);
        }
      } catch (error) {
        require('../../../utils/logger').error(
          'Error updating car rental trip association:',
          error
        );
        // Don't fail the update due to ItemTrip errors
      }
    }

    return apiResponse.success(res, updated, 'Car rental updated successfully');
  } catch (error) {
    if (error.statusCode === 403) {
      return apiResponse.forbidden(res, error.message);
    }
    return apiResponse.internalError(res, 'Failed to update car rental', error);
  }
});

/**
 * DELETE /api/v1/car-rentals/:id
 * Delete a car rental
 *
 * Soft delete with cascade cleanup of companion assignments
 * Validates car rental exists before deletion
 *
 * @param {string} req.params.id - Car rental ID (UUID)
 *
 * @returns {Object} 204 No Content - successful deletion (no response body)
 *
 * @throws {401} Unauthorized - User not authenticated
 * @throws {404} Not found - Car rental not found
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
 */
router.delete('/:id', async (req, res) => {
  try {
    const { CarRental, Trip } = require('../../../models');
    const { requireItemEditPermission } = require('../../../utils/itemPermissionHelper');
    const carRental = await CarRental.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }],
    });

    if (!carRental) {
      return apiResponse.notFound(res, 'Car rental not found');
    }

    // Check permission to delete
    await requireItemEditPermission(carRental, req.user.id, 'car rental');

    await carRental.destroy();

    return apiResponse.noContent(res);
  } catch (error) {
    if (error.statusCode === 403) {
      return apiResponse.forbidden(res, error.message);
    }
    return apiResponse.internalError(res, 'Failed to delete car rental', error);
  }
});

module.exports = router;
