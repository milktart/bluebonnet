# ✈️ Flights Feature

Complete guide to the flight management system in Bluebonnet.

---

## Overview

Flights are the primary travel item in trip planning. Users can add, edit, and delete flights with full support for layovers, companions, and voucher tracking.

**Related:** Airports, Timezone handling, Companions, Vouchers

---

## Data Model

**File:** `models/Flight.js`

```javascript
{
  id: UUID,
  tripId: UUID,           // Associated trip
  userId: UUID,           // Flight owner
  airline: String,        // e.g., "United Airlines"
  flightNumber: String,   // e.g., "UA123"
  origin: String,         // IATA code (JFK)
  destination: String,    // IATA code (LHR)
  departureDateTime: ISO String,  // UTC
  arrivalDateTime: ISO String,    // UTC
  originTimezone: String, // e.g., "America/New_York"
  destinationTimezone: String,
  notes: String,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## API Endpoints

### Create Flight

```
POST /api/trips/:tripId/flights
Body: {
  airline, flightNumber, origin, destination,
  departureDateTime, arrivalDateTime,
  originTimezone, destinationTimezone, notes
}
Returns: { success: true, flight: {...} }
```

### Get Flights

```
GET /api/trips/:tripId/flights
Returns: { success: true, flights: [...] }
```

### Update Flight

```
PUT /api/flights/:id
Body: {airline, flightNumber, ...}
Returns: { success: true, flight: {...} }
```

### Delete Flight

```
DELETE /api/flights/:id
Returns: { success: true }
```

---

## Frontend Implementation

### Add/Edit Form

**File:** `views/partials/flight-form.ejs`

Features:

- Airport autocomplete (IATA code search)
- Departure/arrival datetime picker
- Timezone inference from airports
- Flight number formatting
- Notes field

**Form Fields:**

- `airline` - Select or text input
- `flightNumber` - Text input
- `origin` - Airport autocomplete
- `destination` - Airport autocomplete
- `departureDate` / `departureTime` - Combined into `departureDateTime`
- `arrivalDate` / `arrivalTime` - Combined into `arrivalDateTime`
- `originTimezone` - Auto-populated
- `destinationTimezone` - Auto-populated
- `notes` - Textarea

### Form Initialization

**File:** `public/js/form-utilities.js`

```javascript
// Sync arrival date to be >= departure date
initializeDateSync('input[name="departureDate"]', 'input[name="arrivalDate"]');

// Auto-populate timezones from airports
initializeOriginDestTimezoneInference(originSelector, destSelector, originTzField, destTzField);
```

### Companion Assignment

Each flight can have passengers assigned from trip companions:

- Owner (trip creator) automatically included
- Companions with edit permission can be added
- Vouchers can be assigned to specific passengers per flight

---

## Display & Calendar Integration

### Trip View Display

**File:** `views/partials/trip-sidebar-content.ejs`

Flights displayed in chronological order:

- Flight number with airline
- Departure/arrival times (formatted in local timezone)
- Origin → Destination airports
- Duration calculation
- Edit/delete actions

### Calendar View

**File:** `public/js/calendar.js`

Flights appear on calendar as:

- Departure marker on departure date
- Different color/style from hotels
- Clickable to view flight details
- Draggable to reschedule (optional)

---

## Key Business Logic

### Timezone Handling

1. **User Input:** Departure/arrival times in local timezone via datetime picker
2. **Storage:** Convert to UTC before storing (handled by controller)
3. **Display:** Show in origin/destination timezones (handled by frontend)

### Duration Calculation

```javascript
function calculateFlightDuration(departureUTC, arrivalUTC) {
  return (arrivalUTC - departureUTC) / MS_PER_HOUR;
}
```

### Layover Detection

When adding a new flight, system can detect layovers:

- Flight A arrives at time X
- Flight B departs from same airport at time X + Y
- Gap between = layover duration

```javascript
// Layovers shown in timeline view
const layoverDuration = flight2.departure - flight1.arrival;
```

### Validation Rules

- Departure < Arrival (enforced)
- IATA codes valid (checked against airport database)
- Flight number format valid
- Date range within trip dates (optional but recommended)

---

## Voucher Integration

### Applying Vouchers to Flights

**File:** `views/partials/voucher-details-flight.ejs`

Each flight can have multiple vouchers:

- Travel credits
- Airline vouchers
- Upgrade vouchers
- Gift cards

Process:

1. Open flight edit form
2. Navigate to "Vouchers" tab
3. Select voucher from trip's available vouchers
4. Assign to specific passenger(s)
5. Mark voucher as "used" or "partial"

### Voucher Status Tracking

- `pending` - Created but not used
- `used` - Applied to flight
- `expired` - Past trip end date

---

## Related Features

### Companions

- Flights can assign vouchers to specific companions
- Companion availability affects flight timing preferences
- Multi-passenger flights coordination

### Maps

- Flights visualized on map with origin/destination markers
- Route line drawn from origin to destination
- Airport coordinates from geocoding service

### Calendar

- Flights displayed on calendar view
- Drag-to-reschedule (optional feature)
- Conflict detection with hotels/events

---

## Phase 1 Migration (Svelte)

### New Component Structure

```
src/lib/components/
├── FlightForm.svelte       # Add/edit form
├── FlightCard.svelte       # Display in list
├── FlightTimeline.svelte   # Timeline view
└── FlightVouchers.svelte   # Voucher management
```

### Svelte Implementation

```svelte
<script lang="ts">
  import { tripStore } from '$lib/stores/tripStore';
  import { apiClient } from '$lib/services/apiClient';
  import DateTimePicker from '$lib/components/DateTimePicker.svelte';
  import AirportAutocomplete from '$lib/components/AirportAutocomplete.svelte';

  let isAddMode = true;
  let flight = {
    airline: '',
    flightNumber: '',
    origin: '',
    destination: '',
    departureDateTime: '',
    arrivalDateTime: '',
  };

  async function handleSubmit() {
    const response = await apiClient.post(
      `/api/trips/${$tripStore.currentTrip.id}/flights`,
      flight
    );

    if (response.success) {
      $tripStore.flights = [...$tripStore.flights, response.flight];
      // Close form, refresh view
    }
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  <AirportAutocomplete bind:value={flight.origin} label="From" />
  <AirportAutocomplete bind:value={flight.destination} label="To" />
  <DateTimePicker bind:value={flight.departureDateTime} label="Depart" />
  <DateTimePicker bind:value={flight.arrivalDateTime} label="Arrive" />
  <input bind:value={flight.airline} placeholder="Airline" />
  <input bind:value={flight.flightNumber} placeholder="Flight #" />
  <button type="submit">{isAddMode ? 'Add' : 'Update'} Flight</button>
</form>
```

---

## Testing

### Unit Tests

- Flight model validation
- Timezone conversion logic
- Duration calculation
- Layover detection

### Integration Tests

- Create flight via API
- Update flight with valid data
- Delete flight and cascade
- Voucher attachment

### E2E Tests

- Add flight to trip (full flow)
- Edit flight dates and times
- Apply voucher to flight
- View on calendar

---

## Debugging

**Common Issues:**

1. **Timezone mismatch in display**
   - Check `originTimezone` and `destinationTimezone` fields
   - Verify datetime-formatter.js is loaded
   - Check browser console for timezone parsing errors

2. **Airport autocomplete not working**
   - Verify airport database is seeded: `npm run db:seed-airports`
   - Check Redis cache is enabled
   - Test endpoint: `/api/v1/airports/search?q=jfk`

3. **Arrival time before departure**
   - Check form validation rules
   - Verify date sync is working: `initializeDateSync()`
   - Test with multi-day flights

---

## Related Documentation

- **[Airports & Timezones](../ARCHITECTURE/INTEGRATIONS/README.md#airport-service)** - Airport data
- **[Timezone Handling](../ARCHITECTURE/DATA_MODEL/README.md#timezone-handling)** - Design details
- **[Vouchers](./VOUCHERS.md)** - Voucher system
- **[Calendar](./CALENDAR.md)** - Calendar display
- **[API Reference](../ARCHITECTURE/BACKEND/README.md)** - Full API docs

---

**Last Updated:** 2025-12-17
**Status:** Fully implemented in Express+EJS, Phase 1 migration to Svelte planned
