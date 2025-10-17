# Controller Helpers Documentation

This directory contains reusable helper functions for controllers to reduce code duplication and standardize common patterns.

## resourceController.js

Common utilities for CRUD operations across all resource controllers (flights, hotels, car rentals, transportation, events).

### Import

```javascript
const {
  verifyTripOwnership,
  geocodeIfChanged,
  geocodeOriginDestination,
  redirectAfterSuccess,
  redirectAfterError,
  verifyResourceOwnership,
  verifyResourceOwnershipViaTrip,
  convertToUTC,
  geocodeWithAirportFallback
} = require('./helpers/resourceController');
```

---

## Function Reference

### Authorization

#### `verifyTripOwnership(tripId, userId, Trip)`

Verify that a trip exists and belongs to the current user.

**Parameters:**
- `tripId` (string) - Trip ID to verify
- `userId` (string) - Current user's ID
- `Trip` (Model) - Trip Sequelize model

**Returns:** `Promise<Object|null>` - Trip object if valid, null otherwise

**Example:**
```javascript
const trip = await verifyTripOwnership(tripId, req.user.id, Trip);
if (!trip) {
  return redirectAfterError(res, req, null, 'Trip not found');
}
```

#### `verifyResourceOwnership(resource, currentUserId)`

Verify that a resource belongs directly to a user (for resources with `userId` field).

**Parameters:**
- `resource` (Object) - Resource object with userId property
- `currentUserId` (string) - Current user's ID

**Returns:** `boolean` - True if user owns the resource

**Example:**
```javascript
const event = await Event.findByPk(req.params.id);
if (!verifyResourceOwnership(event, req.user.id)) {
  return redirectAfterError(res, req, null, 'Event not found');
}
```

#### `verifyResourceOwnershipViaTrip(resource, currentUserId)`

Verify that a resource belongs to a trip owned by the user (for resources accessed via trip).

**Parameters:**
- `resource` (Object) - Resource object with `trip` association
- `currentUserId` (string) - Current user's ID

**Returns:** `boolean` - True if user owns the trip that owns the resource

**Example:**
```javascript
const hotel = await Hotel.findByPk(req.params.id, {
  include: [{ model: Trip, as: 'trip' }]
});
if (!verifyResourceOwnershipViaTrip(hotel, req.user.id)) {
  return redirectAfterError(res, req, null, 'Hotel not found');
}
```

---

### Geocoding

#### `geocodeIfChanged(newLocation, oldLocation?, oldCoords?)`

Geocode a location only if it has changed (or for new records).

**Parameters:**
- `newLocation` (string) - New location string
- `oldLocation` (string) - Previous location string (optional, for updates)
- `oldCoords` (Object) - Previous coordinates {lat, lng} (optional, for updates)

**Returns:** `Promise<Object|null>` - Coordinates {lat, lng} or null

**Examples:**
```javascript
// For new records
const coords = await geocodeIfChanged(address);

// For updates
const coords = await geocodeIfChanged(
  newAddress,
  hotel.address,
  { lat: hotel.lat, lng: hotel.lng }
);
```

#### `geocodeOriginDestination(params)`

Geocode both origin and destination, with smart caching for updates.

**Parameters:**
- `params.originNew` (string) - New origin location
- `params.originOld` (string) - Previous origin (optional, for updates)
- `params.originCoordsOld` (Object) - Previous origin coords (optional)
- `params.destNew` (string) - New destination location
- `params.destOld` (string) - Previous destination (optional)
- `params.destCoordsOld` (Object) - Previous destination coords (optional)

**Returns:** `Promise<Object>` - {originCoords, destCoords}

**Examples:**
```javascript
// For new records
const { originCoords, destCoords } = await geocodeOriginDestination({
  originNew: origin,
  destNew: destination
});

// For updates
const { originCoords, destCoords } = await geocodeOriginDestination({
  originNew: origin,
  originOld: transportation.origin,
  originCoordsOld: { lat: transportation.originLat, lng: transportation.originLng },
  destNew: destination,
  destOld: transportation.destination,
  destCoordsOld: { lat: transportation.destinationLat, lng: transportation.destinationLng }
});
```

#### `geocodeWithAirportFallback(location, airportService, currentTimezone?)`

Specialized geocoding for flight origins/destinations that handles airport codes.

**Parameters:**
- `location` (string) - Location string (could be airport code or address)
- `airportService` (Object) - Airport service for IATA code lookup
- `currentTimezone` (string) - Current timezone (optional, will be updated if airport found)

**Returns:** `Promise<Object>` - {coords: {lat, lng}, timezone: string, formattedLocation: string}

**How it works:**
1. Checks if location is a 3-letter airport code (e.g., "JFK")
2. If airport code found, returns airport coordinates, timezone, and formatted name
3. Otherwise falls back to regular geocoding

**Example:**
```javascript
// Flight controller usage
const originResult = await geocodeWithAirportFallback(origin, airportService, originTimezone);
const destResult = await geocodeWithAirportFallback(destination, airportService, destinationTimezone);

// Update locations and timezones with airport data
origin = originResult.formattedLocation; // "JFK - New York, USA"
destination = destResult.formattedLocation;
if (!originTimezone) originTimezone = originResult.timezone; // "America/New_York"
if (!destinationTimezone) destinationTimezone = destResult.timezone;
```

---

### Redirects

#### `redirectAfterSuccess(res, req, tripId, tab, successMessage)`

Standard redirect after successful CRUD operation.

**Parameters:**
- `res` (Object) - Express response object
- `req` (Object) - Express request object
- `tripId` (string|null) - Trip ID to redirect to (or null for /trips)
- `tab` (string) - Tab to show on trip view page (e.g., 'hotels', 'flights')
- `successMessage` (string) - Flash message to display

**Example:**
```javascript
redirectAfterSuccess(res, req, tripId, 'hotels', 'Hotel added successfully');
// Redirects to: /trips/:tripId?tab=hotels with success flash message
```

#### `redirectAfterError(res, req, tripId, errorMessage)`

Standard redirect after error.

**Parameters:**
- `res` (Object) - Express response object
- `req` (Object) - Express request object
- `tripId` (string|null) - Trip ID to redirect to (or null for /trips)
- `errorMessage` (string) - Flash message to display

**Example:**
```javascript
redirectAfterError(res, req, req.params.tripId, 'Error adding hotel');
// Redirects to: /trips/:tripId with error flash message
```

---

### Date/Time

#### `convertToUTC(datetime, timezone)`

Convert local datetime to UTC using timezone.

**Parameters:**
- `datetime` (string) - Datetime string from datetime-local input
- `timezone` (string) - Timezone string (e.g., 'America/New_York')

**Returns:** `Date` - UTC date object

**Example:**
```javascript
checkInDateTime: convertToUTC(checkInDateTime, timezone)
```

---

## Usage Patterns

### Create Operation

```javascript
exports.createResource = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { /* ... fields ... */ } = req.body;

    // 1. Verify trip ownership
    const trip = await verifyTripOwnership(tripId, req.user.id, Trip);
    if (!trip) {
      return redirectAfterError(res, req, null, 'Trip not found');
    }

    // 2. Geocode location(s)
    const coords = await geocodeIfChanged(location);

    // 3. Create resource
    await Resource.create({
      tripId,
      location,
      lat: coords?.lat,
      lng: coords?.lng,
      dateTime: convertToUTC(dateTime, timezone),
      // ... other fields
    });

    // 4. Redirect with success
    redirectAfterSuccess(res, req, tripId, 'resources', 'Resource added successfully');
  } catch (error) {
    console.error(error);
    redirectAfterError(res, req, req.params.tripId, 'Error adding resource');
  }
};
```

### Update Operation

```javascript
exports.updateResource = async (req, res) => {
  try {
    const { /* ... fields ... */ } = req.body;

    // 1. Find resource with trip
    const resource = await Resource.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip' }]
    });

    // 2. Verify ownership
    if (!verifyResourceOwnershipViaTrip(resource, req.user.id)) {
      return redirectAfterError(res, req, null, 'Resource not found');
    }

    // 3. Geocode if changed
    const coords = await geocodeIfChanged(
      location,
      resource.location,
      { lat: resource.lat, lng: resource.lng }
    );

    // 4. Update resource
    await resource.update({
      location,
      lat: coords?.lat,
      lng: coords?.lng,
      dateTime: convertToUTC(dateTime, timezone),
      // ... other fields
    });

    // 5. Redirect with success
    redirectAfterSuccess(res, req, resource.tripId, 'resources', 'Resource updated successfully');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error updating resource');
    res.redirect('back');
  }
};
```

### Delete Operation

```javascript
exports.deleteResource = async (req, res) => {
  try {
    // 1. Find resource with trip
    const resource = await Resource.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip' }]
    });

    // 2. Verify ownership
    if (!verifyResourceOwnershipViaTrip(resource, req.user.id)) {
      return redirectAfterError(res, req, null, 'Resource not found');
    }

    // 3. Delete
    const tripId = resource.tripId;
    await resource.destroy();

    // 4. Redirect with success
    redirectAfterSuccess(res, req, tripId, 'resources', 'Resource deleted successfully');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error deleting resource');
    res.redirect('back');
  }
};
```

### Flight-Specific Pattern (with Airport Code Handling)

Flight operations use `geocodeWithAirportFallback` instead of `geocodeIfChanged` to handle airport IATA codes:

```javascript
exports.createFlight = async (req, res) => {
  try {
    const { tripId } = req.params;
    let {
      airline,
      flightNumber,
      departureDateTime,
      arrivalDateTime,
      origin,
      originTimezone,
      destination,
      destinationTimezone,
      pnr,
      seat
    } = req.body;

    // 1. Verify trip ownership
    if (tripId) {
      const trip = await verifyTripOwnership(tripId, req.user.id, Trip);
      if (!trip) {
        return redirectAfterError(res, req, null, 'Trip not found');
      }
    }

    // 2. Auto-populate airline from flight number if not provided
    if (!airline && flightNumber) {
      const airlineName = airportService.getAirlineNameFromFlightNumber(flightNumber);
      if (airlineName) {
        airline = airlineName;
      }
    }

    // 3. Geocode with airport fallback (handles IATA codes like "JFK")
    const originResult = await geocodeWithAirportFallback(origin, airportService, originTimezone);
    const destResult = await geocodeWithAirportFallback(destination, airportService, destinationTimezone);

    // Update locations and timezones if airport data was found
    origin = originResult.formattedLocation;
    destination = destResult.formattedLocation;
    if (!originTimezone) originTimezone = originResult.timezone;
    if (!destinationTimezone) destinationTimezone = destResult.timezone;

    // 4. Create flight
    await Flight.create({
      userId: req.user.id,
      tripId: tripId || null,
      airline,
      flightNumber: flightNumber?.toUpperCase(),
      departureDateTime: convertToUTC(departureDateTime, originTimezone),
      arrivalDateTime: convertToUTC(arrivalDateTime, destinationTimezone),
      origin,
      originTimezone,
      originLat: originResult.coords?.lat,
      originLng: originResult.coords?.lng,
      destination,
      destinationTimezone,
      destinationLat: destResult.coords?.lat,
      destinationLng: destResult.coords?.lng,
      pnr,
      seat
    });

    // 5. Redirect with success
    redirectAfterSuccess(res, req, tripId, 'flights', 'Flight added successfully');
  } catch (error) {
    console.error(error);
    redirectAfterError(res, req, req.params.tripId, 'Error adding flight');
  }
};
```

**Key differences for flights:**
- Uses `geocodeWithAirportFallback` which automatically detects 3-letter airport codes
- Handles timezone extraction from airport data
- Updates location strings with formatted airport info (e.g., "JFK" → "JFK - New York, USA")
- Separates origin/destination timezones for accurate time conversion

---

## Controllers Using These Helpers

- ✅ `hotelController.js`
- ✅ `carRentalController.js`
- ✅ `eventController.js`
- ✅ `transportationController.js`
- ✅ `flightController.js` (uses geocodeWithAirportFallback for airport code handling)

---

## Benefits

1. **DRY Principle** - Write once, use everywhere
2. **Consistency** - Same patterns across all controllers
3. **Maintainability** - Fix bugs in one place
4. **Testability** - Test helpers independently
5. **Readability** - Controllers focus on business logic

---

## Future Enhancements

Potential additions to this helper module:

1. **Validation Helpers**
   ```javascript
   validateRequiredFields(fields)
   validateDateRange(startDate, endDate)
   ```

2. **Query Helpers**
   ```javascript
   findResourceWithAuth(Model, id, userId)
   findAllUserResources(Model, userId, filters)
   ```

3. **Logging Helpers**
   ```javascript
   logControllerAction(action, resource, userId)
   logControllerError(error, context)
   ```

---

**Last Updated:** 2025-10-17
**Maintainer:** Development Team
