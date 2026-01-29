# Timezone Pattern Documentation

**Last Updated:** 2026-01-29
**Pattern Version:** 2.0 (standardized across all travel item types)

---

## Overview

All travel item models (Flight, Hotel, Event, CarRental, Transportation) follow a consistent timezone pattern for storing and displaying datetime information.

### Core Principle

- **Stored in Database:** UTC (Coordinated Universal Time)
- **Displayed to User:** Local timezone of the event/location
- **User Input:** Local datetime + timezone selector

---

## Pattern by Item Type

### 1. Flight (Two-Location Pattern)

```javascript
// Datetime Fields (stored in UTC)
departureDateTime: DATE
arrivalDateTime: DATE

// Timezone Fields (user's local timezone for each location)
originTimezone: STRING     // e.g., "America/Austin"
destinationTimezone: STRING // e.g., "Europe/Amsterdam"

// Coordinate Fields (from geocoding)
originLat, originLng: DECIMAL     // Coordinates of departure airport
destinationLat, destinationLng: DECIMAL // Coordinates of arrival airport
```

**Example:**

- User in Austin (UTC-6) books flight departing Austin 2:00 PM local time
- Backend converts: 2:00 PM Austin time → 8:00 PM UTC
- Stored in database: `departureDateTime = 2024-01-15 20:00:00 UTC`
- Display: When user views (in Austin), shows "2:00 PM" (converts 20:00 UTC to Austin time)
- Display: If friend in Amsterdam views, shows "3:00 AM next day" (converts to Amsterdam time)

---

### 2. Hotel (Single-Location Pattern)

```javascript
// Datetime Fields (stored in UTC)
checkInDateTime: DATE
checkOutDateTime: DATE

// Timezone Fields (timezone of hotel location)
checkInTimezone: STRING  // e.g., "Europe/Paris"
checkOutTimezone: STRING // e.g., "Europe/Paris"

// Coordinate Fields (from geocoding)
lat, lng: DECIMAL // Coordinates of hotel location
```

**Example:**

- User books hotel in Paris, checks in Jan 15, 2:00 PM Paris time
- Backend converts: 2:00 PM Paris time → 1:00 PM UTC
- Stored in database: `checkInDateTime = 2024-01-15 13:00:00 UTC`
- Display: User in Paris sees "2:00 PM", user in NYC sees "8:00 AM"

---

### 3. Event (Two-Datetime Pattern)

```javascript
// Datetime Fields (stored in UTC)
startDateTime: DATE
endDateTime: DATE

// Timezone Fields (timezone of event location)
startTimezone: STRING // e.g., "America/New_York"
endTimezone: STRING   // e.g., "America/New_York"

// Coordinate Fields (from geocoding, if location geocoded)
lat, lng: DECIMAL // Coordinates of event location
```

**Example:**

- User creates event "Theater Show" in New York, starts 8:00 PM NY time
- Backend converts: 8:00 PM NY time → 1:00 AM next day UTC
- Stored in database: `startDateTime = 2024-01-16 01:00:00 UTC`
- Display: User in NY sees "8:00 PM", user in LA sees "5:00 PM"

---

### 4. CarRental (Two-Location Pattern)

```javascript
// Datetime Fields (stored in UTC)
pickupDateTime: DATE
dropoffDateTime: DATE

// Timezone Fields (usually pickup location timezone)
pickupTimezone: STRING   // e.g., "America/Miami"
dropoffTimezone: STRING  // e.g., "America/Miami"

// Coordinate Fields (from geocoding)
pickupLat, pickupLng: DECIMAL     // Pickup location coordinates
dropoffLat, dropoffLng: DECIMAL   // Dropoff location coordinates
```

---

### 5. Transportation (Two-Location Pattern)

```javascript
// Datetime Fields (stored in UTC)
departureDateTime: DATE
arrivalDateTime: DATE

// Timezone Fields (departure/arrival timezone)
departureTimezone: STRING // e.g., "America/Dallas"
arrivalTimezone: STRING   // e.g., "America/Denver"

// Coordinate Fields (from geocoding)
departureLat, departureLng: DECIMAL // Departure location
arrivalLat, arrivalLng: DECIMAL     // Arrival location
```

---

## Implementation Details

### DateTime Preparation Pipeline

All datetime processing follows this sequence:

1. **Parse:** User submits separate `date` (YYYY-MM-DD) and `time` (HH:MM) fields

   ```javascript
   // Frontend sends:
   { departureDate: "2024-01-15", departureTime: "14:30" }
   ```

2. **Combine:** Join date + time into ISO datetime string

   ```javascript
   // After combineDateTimeFields():
   {
     departureDateTime: '2024-01-15T14:30';
   }
   ```

3. **Sanitize:** Clean timezone values (convert empty/"undefined" to null)

   ```javascript
   // After sanitizeTimezones():
   {
     originTimezone: 'America/Austin';
   } // Was "undefined" → now trimmed/validated
   ```

4. **Geocode:** Lookup coordinates and timezone from location

   ```javascript
   // After geocodeWithAirportFallback():
   { origin: "AUS - Austin, United States", originLat: 30.1892, originLng: -97.6674, originTimezone: "America/Chicago" }
   ```

5. **Convert to UTC:** Transform local datetime to UTC using timezone
   ```javascript
   // After convertToUTC():
   {
     departureDateTime: '2024-01-15T20:30:00Z';
   } // 2:30 PM Austin → 8:30 PM UTC
   ```

**All processing is centralized in DateTimeService:**

```javascript
const prepared = DateTimeService.prepareDateTime(data, {
  datePairs: ['departure', 'arrival'],
  timezoneFields: ['originTimezone', 'destinationTimezone'],
  dateTimeFields: ['departureDateTime', 'arrivalDateTime'],
  tzPairs: ['originTimezone', 'destinationTimezone'],
});
```

---

## Timezone Validation

All timezone values must be:

1. **Valid IANA timezone strings** (e.g., "America/New_York", "Europe/London")
2. **Not empty strings or "undefined"** (sanitized to null)
3. **Properly set during geocoding** (airport/location lookup provides timezone)

**Validation method:**

```javascript
DateTimeService.isValidTimezone(timezone); // Returns boolean
```

---

## Display Conversion

When displaying datetimes to users:

```javascript
// Convert UTC → Local timezone for display
DateTimeService.utcToLocal(utcDate, userTimezone);
// Returns: "2024-01-15T14:30" (local time representation)

// Format for display
DateTimeService.formatInTimezone(utcDate, userTimezone, 'DD MMM YYYY HH:mm');
// Returns: "15 Jan 2024 14:30"
```

---

## Edge Cases & Handling

### 1. No Timezone Provided

- Treated as UTC
- Displayed as UTC to user
- Warning logged in console

### 2. Invalid Timezone String

- Sanitized to null
- System falls back to UTC
- Warning logged: "Invalid timezone 'xyz' - falling back to UTC"

### 3. Daylight Saving Time (DST)

- Handled automatically by JavaScript's Intl API
- UTC storage eliminates DST complications
- Display conversion uses system's DST rules

### 4. User Timezone Changes

- No database changes needed (stored in UTC)
- Display automatically uses new user timezone
- No migration required

---

## Adding Timezone Support to New Item Types

When adding a new travel item type (e.g., `cruise`, `tour`), follow this pattern:

1. **Add datetime fields to model:**

   ```javascript
   departureDateTime: DataTypes.DATE,
   arrivalDateTime: DataTypes.DATE,
   ```

2. **Add timezone fields to model:**

   ```javascript
   departureTimezone: {
     type: DataTypes.STRING,
     allowNull: true,
     comment: 'Timezone for departure location (e.g., America/New_York)',
   },
   arrivalTimezone: {
     type: DataTypes.STRING,
     allowNull: true,
     comment: 'Timezone for arrival location (e.g., Europe/Amsterdam)',
   },
   ```

3. **Create service class extending TravelItemService:**

   ```javascript
   class CruiseService extends TravelItemService {
     // Inherits all datetime handling from TravelItemService
   }
   ```

4. **Use in controller:**
   ```javascript
   const prepared = DateTimeService.prepareDateTime(req.body, {
     datePairs: ['departure', 'arrival'],
     timezoneFields: ['departureTimezone', 'arrivalTimezone'],
     dateTimeFields: ['departureDateTime', 'arrivalDateTime'],
     tzPairs: ['departureTimezone', 'arrivalTimezone'],
   });
   ```

---

## Testing Timezone Logic

### Test Cases to Include:

1. **Same timezone for both locations**
   - Verify datetime conversion
   - Verify display shows correct local time

2. **Different timezones**
   - Verify UTC conversion is correct
   - Verify display adjustment for each timezone

3. **Edge cases**
   - Midnight crossing (local time 11:59 PM → UTC next day)
   - DST transitions (if testing around March/November)
   - Invalid timezones (verify fallback to UTC)

### Example Test:

```javascript
// User in Austin books flight departing Austin 2:00 PM, arriving Amsterdam 8:00 AM next day
const flight = {
  departureDateTime: '2024-01-15T14:00', // Austin local
  departureTimezone: 'America/Chicago',
  arrivalDateTime: '2024-01-16T08:00', // Amsterdam local
  arrivalTimezone: 'Europe/Amsterdam',
};

// Expected after conversion:
// departureDateTime: "2024-01-15T20:00:00Z" (2 PM Chicago = 8 PM UTC)
// arrivalDateTime: "2024-01-16T07:00:00Z" (8 AM Amsterdam = 7 AM UTC)
```

---

## References

- **DateTimeService:** `/services/DateTimeService.js`
- **TravelItemService:** `/services/TravelItemService.js`
- **timezoneHelper:** `/utils/timezoneHelper.js`
- **Models:** `/models/{Flight,Hotel,Event,CarRental,Transportation}.js`
- **Controllers:** `/controllers/{flight,hotel,event,carRental,transportation}Controller.js`

---

## Migration Notes

**Backward Compatibility:**

- UTC storage ensures all old data is still valid
- Timezone fields can be added to existing records
- No data loss or transformation required
- Gradual migration: new items use timezones, old items default to UTC

**Future Improvements:**

- Add automatic timezone detection based on IP location
- Add "local time" display preference to user profile
- Cache timezone lookups to reduce geocoding calls
- Implement daylight saving time-aware scheduling
