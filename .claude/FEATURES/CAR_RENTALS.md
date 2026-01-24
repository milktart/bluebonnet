# 🚙 Car Rentals Feature

Complete guide to car rental management in Bluebonnet.

---

## Overview

Car rentals represent vehicle rentals during trips. Track pickup/dropoff locations and times, vehicle info, and rental costs.

**Related:** Transportation, Locations, Calendar

---

## Data Model

**File:** `models/CarRental.js`

```javascript
{
  id: UUID,
  tripId: UUID,
  userId: UUID,
  pickupLocation: String,      // City or airport code
  pickupDateTime: ISO String,  // UTC
  dropoffLocation: String,
  dropoffDateTime: ISO String, // UTC
  timezone: String,
  company: String,             // Hertz, Avis, Enterprise, etc
  vehicleType: String,         // Sedan, SUV, Truck, etc
  confirmationNumber: String,
  estimatedCost: Decimal,      // Daily rate × days
  mileageLimit: Integer,       // km or miles
  insuranceIncluded: Boolean,
  notes: String,
  latitude: Decimal,           // Pickup location
  longitude: Decimal,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## API Endpoints

### Create Car Rental

```
POST /api/trips/:tripId/car-rentals
Body: {
  pickupLocation, pickupDateTime, dropoffLocation, dropoffDateTime,
  timezone, company, vehicleType, confirmationNumber,
  estimatedCost, mileageLimit, insuranceIncluded, notes
}
Returns: { success: true, carRental: {...} }
```

### Get Car Rentals

```
GET /api/trips/:tripId/car-rentals
Returns: { success: true, carRentals: [...] }
```

### Update Car Rental

```
PUT /api/car-rentals/:id
Body: {...}
Returns: { success: true, carRental: {...} }
```

### Delete Car Rental

```
DELETE /api/car-rentals/:id
Returns: { success: true }
```

---

## Frontend Implementation

### Add/Edit Form

**File:** `views/partials/car-rental-form.ejs`

Features:

- Pickup/dropoff location inputs
- Datetime pickers
- Vehicle type selector
- Company selector
- Confirmation number field
- Insurance checkbox
- Mileage tracking
- Cost calculator

### Duration Calculation

Automatically calculates:

- Number of rental days
- Daily rate calculation
- Total cost estimate

---

## Business Logic

### Rental Period

```javascript
const rentalDays = (dropoffDateTime - pickupDateTime) / MS_PER_DAY;
const totalCost = dailyRate * rentalDays;
```

### Location Tracking

- Pickup coordinates geocoded and stored
- Dropoff coordinates geocoded and stored
- Used for map visualization and route planning

### Companion Assignment

Can assign to multiple companions:

- Primary driver
- Additional drivers
- Passenger count

---

## Calendar Integration

Displayed as:

- Time block from pickup to dropoff
- Color-coded for car rental
- Duration shown as number of days
- Vehicle type shown in tooltip
- Can highlight pickup/dropoff at airports

---

## Maps & Visualization

Shows:

- Pickup location marker
- Dropoff location marker
- Route line between (if different)
- Company and vehicle info in popup
- Mileage distance estimate

---

## Phase 1 Migration (Svelte)

### New Components

```
src/lib/components/
├── CarRentalForm.svelte
├── CarRentalCard.svelte
├── CarRentalTimeline.svelte
└── CarRentalMap.svelte
```

---

## Validation Rules

- Dropoff > Pickup (enforced)
- Dates within trip range
- Locations not empty
- Vehicle type selected
- Cost >= 0
- Mileage >= 0 (if provided)

---

## Vouchers

Car rentals can have:

- Upgrade vouchers
- Rental credit vouchers
- Loyalty program points

---

## Related Documentation

- **[Transportation](./TRANSPORTATION.md)** - Ground travel
- **[Calendar](./CALENDAR.md)** - Timeline display
- **[Maps](./MAPS.md)** - Location visualization

---

**Last Updated:** 2025-12-17
**Status:** Fully implemented, Phase 1 migration planned
