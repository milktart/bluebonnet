# 🎯 Features Documentation

Complete guides for each feature in Bluebonnet. Each feature includes:

- How it works
- User flow
- Database tables involved
- Key controllers/routes
- Code examples
- How to extend

---

## Quick Links

### Travel Items (Core Features)

- **[Flights](./FLIGHT_MANAGEMENT.md)** - Commercial flights management
- **[Hotels](./HOTEL_MANAGEMENT.md)** - Accommodation booking
- **[Events](./EVENTS_MANAGEMENT.md)** - Activities and attractions
- **[Car Rentals](./CAR_RENTALS.md)** - Vehicle rental management
- **[Transportation](./TRANSPORTATION.md)** - Ground transportation

### Trip Management

- **[Trip Management](./TRIP_MANAGEMENT.md)** - Creating, editing, sharing trips
- **[Calendar View](./CALENDAR_VIEW.md)** - Timeline visualization
- **[Maps](./MAPS.md)** - Location-based features

### Companion & Voucher Systems

- **[Travel Companions](./TRAVEL_COMPANIONS.md)** - Invite people to trips
- **[Vouchers](./VOUCHERS.md)** - Track travel credits

---

## Feature Overview

### Travel Items

All five types of travel items follow the same CRUD pattern:

| Feature            | Model             | Controller                  | Routes            | Status    |
| ------------------ | ----------------- | --------------------------- | ----------------- | --------- |
| **Flight**         | Flight.js         | flightController.js         | `/flights`        | ✅ Active |
| **Hotel**          | Hotel.js          | hotelController.js          | `/hotels`         | ✅ Active |
| **Event**          | Event.js          | eventController.js          | `/events`         | ✅ Active |
| **Car Rental**     | CarRental.js      | carRentalController.js      | `/car-rentals`    | ✅ Active |
| **Transportation** | Transportation.js | transportationController.js | `/transportation` | ✅ Active |

**All are optional** - can be added to a trip or created standalone

### Trip Features

| Feature           | Purpose                               | Phase 1 Status |
| ----------------- | ------------------------------------- | -------------- |
| **Trip CRUD**     | Create, read, update, delete trips    | ✅ Migrating   |
| **Trip Sharing**  | Invite companions, manage permissions | ✅ Migrating   |
| **Calendar View** | Timeline visualization of items       | ✅ Migrating   |
| **Maps**          | View locations on map                 | ✅ Migrating   |

### Systems

| System                | Purpose                           | Phase 1 Status |
| --------------------- | --------------------------------- | -------------- |
| **Travel Companions** | Invite people, manage permissions | ✅ Migrating   |
| **Vouchers**          | Track travel credits and upgrades | ✅ Migrating   |

---

## How to Add a Travel Item to a Trip

All travel items follow the same basic flow:

### 1. User Interface (Svelte)

```
User clicks "Add Flight/Hotel/Event/etc."
    ↓
Form opens in sidebar
    ↓
User fills in details
    ↓
User clicks "Save"
```

### 2. Backend Processing

```
Form submitted to /api/flights (or /hotels, /events, etc.)
    ↓
Controller validates trip ownership
    ↓
Service validates data
    ↓
Service geocodes location (if needed)
    ↓
Model creates database record
    ↓
JSON response sent back
```

### 3. UI Update

```
Response received
    ↓
Store updated with new item
    ↓
Component reactively updates
    ↓
User sees new item in trip
```

See: [CRUD Pattern](../PATTERNS/CRUD_PATTERN.md)

---

## Travel Item Specifics

### Flights

**What:** Commercial flights with airline, flight number, departure/arrival

**Key Fields:**

- Airline (e.g., "United Airlines")
- Flight number (e.g., "UA123")
- Origin (with airport code handling, e.g., "JFK")
- Departure datetime
- Destination
- Arrival datetime
- PNR (optional)
- Seat (optional)

**Special:** Handles airport codes, timezone inference from airport

See: [Flight Management](./FLIGHT_MANAGEMENT.md)

### Hotels

**What:** Accommodations with check-in/check-out dates

**Key Fields:**

- Hotel name
- Check-in date
- Check-out date
- Location/address
- Confirmation number (optional)

See: [Hotel Management](./HOTEL_MANAGEMENT.md)

### Events

**What:** Activities, attractions, meetings

**Key Fields:**

- Event name
- Date/time
- Location
- Description (optional)
- Notes (optional)

See: [Events Management](./EVENTS_MANAGEMENT.md)

### Car Rentals

**What:** Vehicle rentals

**Key Fields:**

- Rental company
- Vehicle type
- Pickup location
- Pickup datetime
- Return location
- Return datetime
- Confirmation number (optional)

See: [Car Rentals](./CAR_RENTALS.md)

### Transportation

**What:** Ground transportation (taxi, shuttle, train, bus)

**Key Fields:**

- Transportation type
- Origin
- Destination
- Departure datetime
- Arrival datetime
- Confirmation number (optional)

See: [Transportation](./TRANSPORTATION.md)

---

## Feature Relationships

```
Trip
├── Flights (0 or more)
├── Hotels (0 or more)
├── Events (0 or more)
├── Car Rentals (0 or more)
├── Transportation (0 or more)
├── Travel Companions (0 or more)
│   └── Can edit trip items (if allowed)
└── Vouchers (0 or more)
    └── Can be applied to flights
```

---

## Associated Systems

### Travel Companions

Allows you to:

- Invite people to trips
- Set permissions (can they edit?)
- See who's going
- Assign vouchers to companions

See: [Travel Companions](./TRAVEL_COMPANIONS.md)

### Vouchers

Allows you to:

- Create and track travel credits
- Attach to specific flights
- Assign to companions
- Track usage

See: [Vouchers](./VOUCHERS.md)

---

## Phase 1 Migration Status

### Currently Being Migrated to Svelte

- ✅ Trip management pages
- ✅ Flight form and list
- ✅ Hotel form and list
- ✅ Event form and list
- ✅ Car rental form and list
- ✅ Transportation form and list
- ✅ Calendar view
- ✅ Maps view
- ✅ Companion management
- ✅ Voucher management

**Timeline:** All features scheduled for Phase 1 (Weeks 1-12)

---

## Related Documentation

- **[CRUD Pattern](../PATTERNS/CRUD_PATTERN.md)** - How all CRUD operations work
- **[Form Pattern](../PATTERNS/FORM_PATTERN.md)** - Form submission patterns
- **[Components](../COMPONENTS/README.md)** - Reusable component library
- **[Phase 1 Migration](../MODERNIZATION/PHASE_1_MIGRATION_GUIDE.md)** - Migration timeline
- **[Data Model](../ARCHITECTURE/DATA_MODEL/README.md)** - Entity relationships

---

## Getting Started

**New to a feature?**

1. Read the feature-specific doc (e.g., FLIGHT_MANAGEMENT.md)
2. Check the [CRUD Pattern](../PATTERNS/CRUD_PATTERN.md)
3. Look at code examples in the feature doc
4. Check component specs in [Components](../COMPONENTS/README.md)

**Adding a new field to a feature?**

1. Update database model
2. Update API endpoint
3. Update Svelte form component
4. Update component state/store
5. Test end-to-end

---

**Last Updated:** 2025-12-17
