# 🏨 Hotels Feature

Complete guide to the hotel management system in Bluebonnet.

---

## Overview

Hotels represent accommodation during trips. Users can track check-in/check-out dates, locations, rates, and assign guests.

**Related:** Calendar, Companions, Vouchers, Location geocoding

---

## Data Model

**File:** `models/Hotel.js`

```javascript
{
  id: UUID,
  tripId: UUID,
  userId: UUID,
  name: String,                // Hotel name
  address: String,             // Full address
  city: String,               // City name
  checkInDate: ISO String,    // UTC
  checkOutDate: ISO String,   // UTC
  timezone: String,           // "America/New_York"
  rate: Decimal,             // Per night in USD
  roomType: String,          // Single/Double/Suite/etc
  numberOfRooms: Integer,    // How many rooms booked
  numberOfGuests: Integer,   // Total guests
  notes: String,
  latitude: Decimal,         // From geocoding
  longitude: Decimal,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## API Endpoints

### Create Hotel
```
POST /api/trips/:tripId/hotels
Body: {
  name, address, city, checkInDate, checkOutDate,
  timezone, rate, roomType, numberOfRooms, numberOfGuests, notes
}
Returns: { success: true, hotel: {...} }
```

### Get Hotels
```
GET /api/trips/:tripId/hotels
Returns: { success: true, hotels: [...] }
```

### Update Hotel
```
PUT /api/hotels/:id
Body: {...}
Returns: { success: true, hotel: {...} }
```

### Delete Hotel
```
DELETE /api/hotels/:id
Returns: { success: true }
```

---

## Frontend Implementation

### Add/Edit Form
**File:** `views/partials/hotel-form.ejs`

Features:
- Date picker for check-in/check-out
- Address input with geocoding
- Rate calculator (nights × rate)
- Guest and room count
- Notes field

### Location & Geocoding
When address is entered:
1. Frontend sends to `/api/geocode` endpoint
2. Returns { latitude, longitude }
3. Stores with hotel record
4. Used for map display

### Calendar Integration
Displays as block on calendar:
- Check-in date: color-coded start
- Duration: check-out date minus check-in date
- Overlaps with other hotels highlighted (warning)
- Day-by-day room rate calculation shown

---

## Business Logic

### Stay Duration
```javascript
const nights = (checkOutDate - checkInDate) / MS_PER_DAY;
const totalCost = nights * rate;
```

### Guest Management
- Owner automatically included
- Companions can be added to assign room
- Multiple rooms tracked separately
- Total guest count calculation

### Rate Tracking
- Per-night rate stored
- Total cost calculated from nights
- Optional: daily rate variations
- Budget tracking across trip

---

## Voucher Integration

Hotels can have travel credits or upgrade vouchers:
- Room upgrade vouchers
- Meal/resort credit vouchers
- Loyalty point redemptions

---

## Maps & Visualization

Hotels appear on map as:
- Marker at geocoded address
- Hotel name in popup
- Address and check-in/out dates
- Clusters when many hotels in same area

---

## Phase 1 Migration (Svelte)

### New Components
```
src/lib/components/
├── HotelForm.svelte
├── HotelCard.svelte
├── HotelTimeline.svelte
└── HotelMap.svelte
```

---

## Validation Rules

- Check-out > Check-in (enforced)
- Dates within trip range (recommended)
- Address not empty
- Rate >= 0
- Guest count > 0
- Room count > 0

---

## Related Documentation

- **[Calendar](./CALENDAR.md)** - Display integration
- **[Maps](./MAPS.md)** - Geocoding and visualization
- **[Vouchers](./VOUCHERS.md)** - Credit tracking
- **[Companions](./COMPANIONS.md)** - Guest assignment

---

**Last Updated:** 2025-12-17
**Status:** Fully implemented, Phase 1 migration planned
