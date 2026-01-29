# Phase 4 Integration Testing Plan

**Date:** 2026-01-29
**Status:** In Progress
**Scope:** All 5 refactored controllers (Flight, Hotel, Event, CarRental, Transportation)

---

## Test Execution Strategy

Manual QA testing covering:

1. CRUD operations for each item type
2. Datetime handling with timezone conversions
3. Geocoding and coordinate storage
4. Companion associations
5. Trip association changes
6. Error handling and validation

---

## Test Scenarios

### SCENARIO 1: Create Flight with Timezone Conversion

**Setup:**

- User: logged in
- Trip: exists (e.g., "Summer Europe Trip")
- Origin: New York (America/New_York, UTC-5)
- Destination: London (Europe/London, UTC+0)

**Test Steps:**

1. Navigate to trip detail page
2. Click "Add Flight" button
3. Fill form:
   - Flight Number: AA100
   - Airline: American Airlines
   - Origin: New York (JFK)
   - Origin Timezone: America/New_York
   - Departure Date: 2026-06-15
   - Departure Time: 14:00
   - Destination: London (LHR)
   - Destination Timezone: Europe/London
   - Arrival Date: 2026-06-16
   - Arrival Time: 08:00
   - Confirmation: AA123456
4. Submit form (AJAX)

**Expected Results:**

- ✅ Flight created successfully
- ✅ Database stores UTC times:
  - departureDateTime: 2026-06-15 19:00:00 UTC (14:00 EDT + 5 hours)
  - arrivalDateTime: 2026-06-16 07:00:00 UTC (08:00 BST - 1 hour)
- ✅ Flight appears in trip list
- ✅ Display shows local times:
  - Departure: 2:00 PM (in America/New_York)
  - Arrival: 8:00 AM (in Europe/London)
- ✅ Coordinates geocoded for origin and destination
- ✅ API returns 201 status with flight data

**Test Case Code:**

```javascript
POST /api/flights
Body: {
  flightNumber: "AA100",
  airline: "American Airlines",
  origin: "New York (JFK)",
  originTimezone: "America/New_York",
  departureDate: "2026-06-15",
  departureTime: "14:00",
  destination: "London (LHR)",
  destinationTimezone: "Europe/London",
  arrivalDate: "2026-06-16",
  arrivalTime: "08:00",
  confirmationNumber: "AA123456",
  tripId: "trip-123"
}

Expected Response: 201 Created
{
  success: true,
  data: {
    id: "flight-456",
    flightNumber: "AA100",
    airline: "American Airlines",
    originTimezone: "America/New_York",
    destinationTimezone: "Europe/London",
    departureDateTime: "2026-06-15T19:00:00.000Z",  // UTC
    arrivalDateTime: "2026-06-16T07:00:00.000Z",     // UTC
    lat: 40.6413,  // JFK
    lng: -73.7781,
    destLat: 51.4700,  // LHR
    destLng: -0.4543
  }
}
```

---

### SCENARIO 2: Update Hotel with Geocoding

**Setup:**

- Hotel: exists (Chicago, partial address)
- New address more specific
- No timezone changes

**Test Steps:**

1. Open trip detail, find hotel
2. Click edit (sidebar loads)
3. Update:
   - Address: "The Peninsula Chicago, 108 E Superior St, Chicago, IL 60611"
   - Phone: "+1-312-337-2800"
   - Check-in: Keep same date/time
4. Submit form (AJAX)

**Expected Results:**

- ✅ Hotel updated successfully
- ✅ Geocoding re-ran (new address):
  - lat: 41.8894
  - lng: -87.6244
- ✅ Coordinates stored in database
- ✅ Hotel appears updated in list
- ✅ Phone number sanitized and stored
- ✅ API returns 200 status with updated hotel

**Database Check:**

```sql
SELECT id, hotelName, address, lat, lng, phone
FROM Hotels
WHERE id = 'hotel-123';

Expected:
| id | hotelName | address | lat | lng | phone |
|---|---|---|---|---|---|
| hotel-123 | The Peninsula | The Pentagon Chicago, 108 E Superior St... | 41.8894 | -87.6244 | +1-312-337-2800 |
```

---

### SCENARIO 3: Create Event with Optional Fields

**Setup:**

- Event: standalone (not in trip yet)
- Optional fields: contactEmail, contactPhone, description

**Test Steps:**

1. Create new event:
   - Name: "Metallica Concert"
   - Location: "United Center, Chicago"
   - Start: 2026-07-20, 20:00
   - End: 2026-07-20, 23:00
   - Contact Email: "info@unitedcenter.com"
   - Contact Phone: "+1-312-455-4500"
   - Description: "Amazing live performance"
2. Submit (AJAX)

**Expected Results:**

- ✅ Event created successfully
- ✅ Optional fields sanitized:
  - contactEmail: "info@unitedcenter.com" (stored)
  - contactPhone: "+1-312-455-4500" (stored)
  - description: "Amazing live performance" (stored)
- ✅ Coordinates geocoded for location
- ✅ Event appears in dashboard
- ✅ API returns 201 with event data

**Null Field Test:**

- Create event with empty email/phone/description fields
- ✅ Fields store as NULL in database
- ✅ No errors on submission

---

### SCENARIO 4: CarRental Create & Update with Dual Locations

**Setup:**

- Create car rental with two locations + timezones

**Test Steps:**

1. Create car rental:
   - Company: Hertz
   - Pickup: Los Angeles (LAX)
   - Pickup Timezone: America/Los_Angeles
   - Pickup Date: 2026-08-01, 10:00
   - Dropoff: San Francisco (SFO)
   - Dropoff Timezone: America/Los_Angeles
   - Dropoff Date: 2026-08-03, 18:00
   - Confirmation: HZ987654
2. Submit form (AJAX)

**Expected Results:**

- ✅ CarRental created successfully
- ✅ Both locations geocoded:
  - pickupLat: 33.9425, pickupLng: -118.4081 (LAX)
  - dropoffLat: 37.6213, dropoffLng: -122.3790 (SFO)
- ✅ Timezones stored correctly
- ✅ DateTimes converted to UTC:
  - pickupDateTime: 2026-08-01 17:00:00 UTC (10:00 PDT + 7)
  - dropoffDateTime: 2026-08-03 01:00:00 UTC (18:00 PDT + 7)
- ✅ CarRental appears in trip

**Update Test:**

- Change pickupLocation to "Downtown LA" (should re-geocode)
- ✅ New coordinates saved
- ✅ Old coordinates replaced (not accumulating)
- ✅ All other fields preserved

---

### SCENARIO 5: Transportation Create with Multiple Timezones

**Setup:**

- Multiple leg journey with different timezones

**Test Steps:**

1. Create transportation:
   - Method: Flight
   - Journey Number: AC205
   - Origin: Toronto (YYZ)
   - Origin Timezone: America/Toronto
   - Departure: 2026-09-10, 15:00
   - Destination: Los Angeles (LAX)
   - Destination Timezone: America/Los_Angeles
   - Arrival: 2026-09-10, 17:00 (local, but -3 hours due to TZ)
   - Confirmation: AC999
   - Seat: 12A
2. Submit form

**Expected Results:**

- ✅ Transportation created
- ✅ Dual-location geocoding:
  - originLat: 43.6777, originLng: -79.6104 (YYZ)
  - destinationLat: 33.9425, destinationLng: -118.4081 (LAX)
- ✅ Timezone conversions:
  - departureDateTime: 2026-09-10 19:00:00 UTC (15:00 EDT + 4)
  - arrivalDateTime: 2026-09-11 00:00:00 UTC (17:00 PDT + 7)
- ✅ Seat stored
- ✅ Transportation appears in trip

---

### SCENARIO 6: Companion Association

**Setup:**

- Create item with companions

**Test Steps:**

1. Create flight with companions:
   - Flight: AA100
   - Companions: ["Alice", "Bob"]
2. Submit form (AJAX)

**Expected Results:**

- ✅ Flight created
- ✅ Companions associated via ItemCompanion table:
  - itemId: flight-456
  - itemType: flight
  - companionName: "Alice"
  - companionName: "Bob"
- ✅ Frontend shows companions in flight details
- ✅ Companions appear in trip timeline

**Update Test:**

- Update flight, change companions to ["Alice", "Charlie"]
- ✅ "Bob" removed from ItemCompanion
- ✅ "Charlie" added to ItemCompanion
- ✅ "Alice" still present

---

### SCENARIO 7: Trip Association Changes

**Setup:**

- Item created standalone
- Later associated with trip
- Later moved to different trip

**Test Steps:**

1. Create hotel standalone (no tripId)
   - ✅ Hotel created with tripId = null

2. Edit hotel, attach to "Summer Trip"
   - ✅ ItemTrip record created: { itemId: hotel-123, itemType: hotel, tripId: trip-1 }
   - ✅ Hotel appears in trip detail

3. Edit hotel again, move to "Fall Trip"
   - ✅ Old ItemTrip removed: trip-1
   - ✅ New ItemTrip created: trip-2
   - ✅ Hotel appears in Fall Trip
   - ✅ Hotel no longer in Summer Trip

4. Edit hotel, remove from all trips
   - ✅ ItemTrip record deleted
   - ✅ Hotel appears only in dashboard

---

### SCENARIO 8: Error Handling - Validation Errors

**Test Cases:**

1. Missing required fields (Flight):
   - POST /api/flights without flightNumber
   - Expected: 400 Bad Request
   - Response includes: { errors: [{ path: 'flightNumber', msg: '...' }] }

2. Invalid timezone:
   - POST /api/flights with originTimezone: "Invalid/Zone"
   - Expected: 400 or sanitized to null
   - Verify behavior in service

3. Invalid datetime format:
   - POST /api/flights with departureDate: "not-a-date"
   - Expected: 400 Bad Request

4. Unauthorized access:
   - User A creates hotel in User B's trip
   - POST /api/trips/trip-b-123/hotels
   - Expected: 403 Forbidden

---

### SCENARIO 9: Timezone Display Accuracy

**Test Setup:**

- Create flight: NYC → Tokyo
- User viewing from multiple timezones

**Flight Times (stored as UTC):**

- Departure: 2026-06-15 22:00 UTC (6:00 PM EDT)
- Arrival: 2026-06-16 11:00 UTC (8:00 AM JST)

**User 1: Viewing from America/New_York (EDT, UTC-4)**

- ✅ Display: "6:00 PM" (June 15)
- ✅ Display: "7:00 AM" (June 16)

**User 2: Viewing from Asia/Tokyo (JST, UTC+9)**

- ✅ Display: "7:00 AM" (June 16)
- ✅ Display: "8:00 AM" (June 16)

---

### SCENARIO 10: Geocoding Fallback

**Test Cases:**

1. Valid location:
   - "Empire State Building, New York"
   - ✅ Geocodes successfully
   - ✅ Coordinates stored

2. Ambiguous location:
   - "Main St, USA"
   - ✅ Geocodes (first result)
   - ✅ Coordinates stored

3. Invalid location:
   - "xyz123notaplace"
   - Expected: Service handles gracefully
   - ✅ Either skips geocoding or stores null

---

## Test Execution Checklist

### Pre-Testing

- [ ] Ensure both backend and frontend running
- [ ] Database is clean or test data seeded
- [ ] Logged in as test user
- [ ] Browser DevTools open (Network tab)

### Flight Controller

- [ ] Scenario 1: Create flight with timezone conversion
- [ ] Update existing flight (change dates, times, locations)
- [ ] Delete flight, verify restoration from session
- [ ] Companion sync on flight update
- [ ] Trip association changes

### Hotel Controller

- [ ] Scenario 2: Update hotel with geocoding
- [ ] Create hotel, move between trips
- [ ] Create hotel, remove from all trips
- [ ] Optional fields (phone, etc.) sanitization

### Event Controller

- [ ] Scenario 3: Create event with optional fields
- [ ] Create all-day event (00:00 - 23:59)
- [ ] Create event with timezone
- [ ] Update event dates

### CarRental Controller

- [ ] Scenario 4: Create car rental with dual locations
- [ ] Update pickup/dropoff locations (re-geocode)
- [ ] Change timezones between locations
- [ ] Companion associations

### Transportation Controller

- [ ] Scenario 5: Create transportation with multiple timezones
- [ ] Update origin/destination (re-geocode)
- [ ] Seat assignment storage
- [ ] Trip association changes

### Error Handling

- [ ] Scenario 8: Test all validation errors
- [ ] Test unauthorized access
- [ ] Test invalid datetime formats
- [ ] Test missing required fields

### Timezone Accuracy

- [ ] Scenario 9: Verify display accuracy across timezones
- [ ] Scenario 10: Test geocoding edge cases

---

## Database Verification Queries

### Check UTC Storage (Flight Example)

```sql
SELECT id, flightNumber, departureDateTime, arrivalDateTime,
       originTimezone, destinationTimezone
FROM Flights
WHERE id = 'flight-456'
ORDER BY createdAt DESC LIMIT 1;
```

**Expected:**

- departureDateTime: 2026-06-15 19:00:00 (UTC)
- arrivalDateTime: 2026-06-16 07:00:00 (UTC)
- Times in UTC, not local

### Check Geocoding (Hotel Example)

```sql
SELECT id, hotelName, address, lat, lng
FROM Hotels
WHERE id = 'hotel-123'
ORDER BY updatedAt DESC LIMIT 1;
```

**Expected:**

- lat/lng populated
- lat between -90 and 90
- lng between -180 and 180

### Check ItemCompanion Association

```sql
SELECT ic.id, ic.itemId, ic.itemType, ic.companionName, ic.companionEmail
FROM ItemCompanions ic
WHERE ic.itemId = 'flight-456'
ORDER BY ic.createdAt;
```

**Expected:**

- Multiple rows (one per companion)
- itemType matches item type (flight)

### Check ItemTrip Association

```sql
SELECT it.id, it.itemId, it.itemType, it.tripId
FROM ItemTrips it
WHERE it.itemId = 'hotel-123'
ORDER BY it.createdAt DESC LIMIT 1;
```

**Expected:**

- Single row (most recent)
- tripId matches current trip assignment

---

## Success Criteria

✅ All CRUD operations work without errors
✅ Datetimes stored as UTC in database
✅ Display shows correct local timezone times
✅ Geocoding retrieves and stores coordinates
✅ Companions associated correctly
✅ Trip associations change properly
✅ Validation errors handled gracefully
✅ Unauthorized access denied
✅ Error messages helpful and specific
✅ No data loss on updates
✅ Optional fields sanitize correctly (null vs empty string)
✅ All scenarios complete without errors

---

## Known Issues / Notes

(To be filled in during testing)

---

## Test Results Summary

| Scenario                    | Status  | Notes |
| --------------------------- | ------- | ----- |
| 1. Flight timezone          | PENDING |       |
| 2. Hotel geocoding          | PENDING |       |
| 3. Event optional fields    | PENDING |       |
| 4. CarRental dual locations | PENDING |       |
| 5. Transportation multi-TZ  | PENDING |       |
| 6. Companion association    | PENDING |       |
| 7. Trip association         | PENDING |       |
| 8. Validation errors        | PENDING |       |
| 9. Timezone display         | PENDING |       |
| 10. Geocoding fallback      | PENDING |       |

---

## Conclusion

Upon completion of all scenarios with passing results, Phase 4 integration testing will be verified complete and controllers ready for production deployment.
