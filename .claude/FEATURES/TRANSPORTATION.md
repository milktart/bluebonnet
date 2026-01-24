# 🚗 Transportation Feature

Complete guide to transportation and ground travel management.

---

## Overview

Transportation covers all ground-based travel: taxis, trains, buses, ride-shares, car rentals, ferries, etc.

**Related:** Flights (connecting), Calendar, Maps, Companions

---

## Data Model

**File:** `models/Transportation.js`

```javascript
{
  id: UUID,
  tripId: UUID,
  userId: UUID,
  transportationType: String,  // taxi/train/bus/rideshare/ferry/etc
  departureLocation: String,   // Where leaving from
  arrivalLocation: String,     // Where going to
  departureDateTime: ISO String,
  arrivalDateTime: ISO String,
  timezone: String,
  confirmationNumber: String,  // Booking ref
  cost: Decimal,
  notes: String,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## Types

**Supported Transportation Types:**

- `taxi` - Taxi/cab/uber/lyft
- `train` - Train/rail
- `bus` - Bus/coach
- `ferry` - Ferry/boat
- `rideshare` - Ride-share services
- `personal` - Personal vehicle
- `other` - Other ground transport

Each type can have specific fields (train number, bus route, confirmation number, etc.)

---

## API Endpoints

### Create Transportation

```
POST /api/trips/:tripId/transportation
Body: {
  transportationType, departureLocation, arrivalLocation,
  departureDateTime, arrivalDateTime, timezone,
  confirmationNumber, cost, notes
}
Returns: { success: true, transportation: {...} }
```

### Get Transportation

```
GET /api/trips/:tripId/transportation
Returns: { success: true, transportation: [...] }
```

### Update Transportation

```
PUT /api/transportation/:id
Body: {...}
Returns: { success: true, transportation: {...} }
```

### Delete Transportation

```
DELETE /api/transportation/:id
Returns: { success: true }
```

---

## Frontend Implementation

### Add/Edit Form

**File:** `views/partials/transportation-form.ejs`

Features:

- Transportation type selector
- Departure/arrival location inputs
- Datetime pickers
- Cost tracking
- Confirmation number field
- Notes

---

## Business Logic

### Layover Detection

System detects when transportation bridges two flights:

- Flight A arrives at airport at time X
- Transportation departs from airport at time X + Y
- Gap calculation shown to user
- Suggested transportation durations

### Timeline Integration

Transportation appears in trip timeline:

- Between flights (layover transport)
- Between hotel checkout and next event
- From airport to hotel

### Cost Tracking

Total transportation cost calculated:

- Sum of all transportation items
- Per-leg cost tracking
- Trip total includes transportation

---

## Calendar Integration

Transportation displayed as:

- Time block from departure to arrival
- Different styling from flights/hotels
- Appears in day view timeline
- Can detect and highlight same-location conflicts

---

## Companions

Can assign to specific companions:

- Which companion taking which transport
- Group transportation vs individual

---

## Maps & Visualization

Routes shown on map:

- Departure marker
- Arrival marker
- Route line between (if available)
- Time and type shown in popup

---

## Phase 1 Migration (Svelte)

### New Components

```
src/lib/components/
├── TransportationForm.svelte
├── TransportationCard.svelte
├── TransportationTimeline.svelte
└── TransportationMap.svelte
```

---

## Validation Rules

- Departure < Arrival
- Dates within trip range
- Locations not empty
- Transportation type from valid list
- Cost >= 0

---

## Related Documentation

- **[Flights](./FLIGHTS.md)** - Connecting flights
- **[Calendar](./CALENDAR.md)** - Timeline display
- **[Maps](./MAPS.md)** - Route visualization
- **[Car Rentals](./CAR_RENTALS.md)** - Vehicle rentals

---

**Last Updated:** 2025-12-17
**Status:** Fully implemented, Phase 1 migration planned
