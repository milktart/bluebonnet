# 🎭 Events Feature

Complete guide to events and activities management in Bluebonnet.

---

## Overview

Events represent activities, attractions, and bookings during trips. Can be any type: restaurants, museums, tours, concerts, shows, etc.

**Related:** Calendar, Companions, Maps, Vouchers

---

## Data Model

**File:** `models/Event.js`

```javascript
{
  id: UUID,
  tripId: UUID,
  userId: UUID,
  title: String,           // Event name
  description: String,     // Details
  eventDate: ISO String,   // Date only (UTC)
  eventTime: String,       // HH:MM format
  timezone: String,        // Local timezone
  location: String,        // Address or location name
  address: String,         // Full address
  city: String,
  duration: Integer,       // Minutes
  eventType: String,       // restaurant/museum/tour/concert/etc
  notes: String,
  latitude: Decimal,       // From geocoding
  longitude: Decimal,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## API Endpoints

### Create Event
```
POST /api/trips/:tripId/events
Body: {
  title, description, eventDate, eventTime, timezone,
  location, address, duration, eventType, notes
}
Returns: { success: true, event: {...} }
```

### Get Events
```
GET /api/trips/:tripId/events
Returns: { success: true, events: [...] }
```

### Update Event
```
PUT /api/events/:id
Body: {...}
Returns: { success: true, event: {...} }
```

### Delete Event
```
DELETE /api/events/:id
Returns: { success: true }
```

---

## Frontend Implementation

### Add/Edit Form
**File:** `views/partials/event-form.ejs`

Features:
- Event type selector (restaurant, museum, concert, etc.)
- Date/time picker
- Location with address autocomplete
- Duration calculator
- Description/notes field
- Attendee selection from companions

### Form Fields
- `title` - Event name
- `eventType` - Dropdown (values from enum or config)
- `eventDate` - Date picker
- `eventTime` - Time picker (HH:MM)
- `timezone` - Auto-populate from location
- `location` - Name or venue name
- `address` - Full address (geocoded)
- `duration` - Duration in minutes
- `description` - Details about event
- `notes` - Additional notes

---

## Business Logic

### Duration Display
Shows as "2 hours 30 minutes" on calendar/timeline

### Timezone Handling
- Stored with timezone
- Displayed in local time on calendar
- Conversion for companions in different timezones

### Event Type Classification
Used for:
- Calendar color coding
- Icon selection
- Filtering
- Analytics

Types: restaurant, museum, tour, concert, show, activity, sports, theater, flight-adjustment (layover activities), other

---

## Calendar Integration

### Visual Display
- Events appear on their date
- Time shown on timeline
- Color-coded by event type
- Can have multiple events same day
- Conflicts/overlaps highlighted

### Day View
Shows hourly breakdown:
- All flights
- All hotels (arrival/departure)
- All events in time order

---

## Companion Integration

Events can include multiple companions:
- Attendee list
- RSVP status (optional)
- Cost per person tracking (optional)
- Notes per attendee (optional)

---

## Maps & Visualization

Events appear on map as:
- Marker at event location
- Custom icon per event type
- Name and time in popup
- Clusters for many events in area

---

## Phase 1 Migration (Svelte)

### New Components
```
src/lib/components/
├── EventForm.svelte
├── EventCard.svelte
├── EventTimeline.svelte
└── EventMap.svelte
```

---

## Vouchers

Events can have vouchers:
- Restaurant gift cards
- Activity/tour vouchers
- Show/concert tickets (tracked as voucher)
- Meal credit vouchers

---

## Validation Rules

- Title not empty
- Event date within trip dates
- Time in valid format (HH:MM)
- Duration > 0 minutes
- Location not empty (recommended)
- Event type from valid list

---

## Related Documentation

- **[Calendar](./CALENDAR.md)** - Display integration
- **[Maps](./MAPS.md)** - Location visualization
- **[Companions](./COMPANIONS.md)** - Attendee management
- **[Vouchers](./VOUCHERS.md)** - Credit tracking

---

**Last Updated:** 2025-12-17
**Status:** Fully implemented, Phase 1 migration planned
