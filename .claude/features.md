# Bluebonnet Features Matrix

Quick reference for all features and their implementation.

---

## Travel Items (All CRUD-enabled)

All items follow same CRUD pattern. See `patterns.md` for details.

| Feature            | Model                      | Controller                    | Routes                                                     | Status    |
| ------------------ | -------------------------- | ----------------------------- | ---------------------------------------------------------- | --------- |
| **Flight**         | `models/Flight.js`         | `flightController.js`         | `/api/flights`, `/api/trips/:tripId/flights`               | ✅ Active |
| **Hotel**          | `models/Hotel.js`          | `hotelController.js`          | `/api/hotels`, `/api/trips/:tripId/hotels`                 | ✅ Active |
| **Event**          | `models/Event.js`          | `eventController.js`          | `/api/events`, `/api/trips/:tripId/events`                 | ✅ Active |
| **Car Rental**     | `models/CarRental.js`      | `carRentalController.js`      | `/api/car-rentals`, `/api/trips/:tripId/car-rentals`       | ✅ Active |
| **Transportation** | `models/Transportation.js` | `transportationController.js` | `/api/transportation`, `/api/trips/:tripId/transportation` | ✅ Active |

**Special:** Items can be created standalone (no trip) OR attached to a trip. All cascade delete when parent trip deleted.

---

## Core Features

| Feature             | Purpose                               | Key Files                                    | Status    |
| ------------------- | ------------------------------------- | -------------------------------------------- | --------- |
| **Trip Management** | Create/view/edit/delete trips         | `tripController.js`, `Trip.js`               | ✅ Active |
| **Authentication**  | Login/registration/logout             | `authController.js`, `passport.js`           | ✅ Active |
| **Trip Sharing**    | Invite companions, manage permissions | `companionController.js`, `TripCompanion.js` | ✅ Active |
| **Vouchers**        | Track travel credits/upgrades         | `voucherController.js`, `Voucher.js`         | ✅ Active |
| **Calendar**        | Timeline view of trip items           | `calendar.js`, `trip-view.ejs`               | ✅ Active |
| **Maps**            | Location visualization                | `maps.js`, `geocodingService.js`             | ✅ Active |

---

## Flight Details

**Use case:** Track commercial flights with departure/arrival

**Key Fields:**

- Airline (e.g., "United Airlines")
- Flight number (e.g., "UA123")
- Origin airport (e.g., "JFK")
- Departure datetime
- Destination airport (e.g., "LAX")
- Arrival datetime
- PNR (optional)
- Seat (optional)

**Special:** Handles airport codes, timezone inference

**Files:**

- Model: `models/Flight.js`
- Controller: `controllers/flightController.js`
- Routes: `routes/flights.js` or `routes/api/v1/flights.js`
- Form: `views/partials/flight-form.ejs`

---

## Hotel Details

**Use case:** Track accommodations with check-in/checkout

**Key Fields:**

- Hotel name
- Check-in date
- Check-out date
- Location/address
- Confirmation number (optional)

**Files:**

- Model: `models/Hotel.js`
- Controller: `controllers/hotelController.js`
- Routes: `routes/hotels.js`
- Form: `views/partials/hotel-form.ejs`

---

## Event Details

**Use case:** Track activities, attractions, meetings

**Key Fields:**

- Event name
- Date/time
- Location
- Description (optional)

**Files:**

- Model: `models/Event.js`
- Controller: `controllers/eventController.js`
- Routes: `routes/events.js`
- Form: `views/partials/event-form.ejs`

---

## Car Rental Details

**Use case:** Track vehicle rentals

**Key Fields:**

- Rental company
- Vehicle type
- Pickup location
- Pickup datetime
- Return location
- Return datetime
- Confirmation number (optional)

**Files:**

- Model: `models/CarRental.js`
- Controller: `controllers/carRentalController.js`
- Routes: `routes/car-rentals.js`
- Form: `views/partials/car-rental-form.ejs`

---

## Transportation Details

**Use case:** Track ground transportation (taxi, shuttle, train, bus)

**Key Fields:**

- Transportation type (taxi, shuttle, train, etc.)
- Origin
- Destination
- Departure datetime
- Arrival datetime
- Confirmation number (optional)

**Files:**

- Model: `models/Transportation.js`
- Controller: `controllers/transportationController.js`
- Routes: `routes/transportation.js`
- Form: `views/partials/transportation-form.ejs`

---

## Travel Companions System

**Use case:** Invite people to trips, manage permissions

**Features:**

- Create companion profiles (name, email, phone)
- Add companions to trips
- Set edit permissions per companion per trip
- Optional link to user account

**Key Models:**

- `TravelCompanion` - Companion profile
- `TripCompanion` - Junction table (trip membership + permissions)

**Key Fields (TripCompanion):**

- `tripId` - Which trip
- `companionId` - Which companion
- `canEdit` - Permission to edit trip items
- `addedBy` - Who added them (userId)

**Files:**

- Models: `models/TravelCompanion.js`, `models/TripCompanion.js`
- Controller: `controllers/companionController.js`
- Routes: `routes/companions.js`
- Sidebar: `views/partials/companions-sidebar.ejs`

---

## Vouchers System

**Use case:** Track travel credits, upgrade vouchers, gift cards

**Features:**

- Create vouchers with type (credit, upgrade, gift card)
- Attach to specific flights/items
- Assign to companions
- Track usage status (pending, used, expired)

**Key Models:**

- `Voucher` - Voucher record
- `VoucherAttachment` - Links voucher to item + companion

**Key Fields (Voucher):**

- Type (travel_credit, upgrade, gift_card, etc.)
- Description
- Status (pending, used, expired)
- tripId

**Key Fields (VoucherAttachment):**

- voucherId
- itemType (flight, hotel, etc.)
- itemId
- passengerId (companion)

**Files:**

- Models: `models/Voucher.js`, `models/VoucherAttachment.js`
- Controller: `controllers/voucherController.js`
- Routes: `routes/vouchers.js`
- Sidebar: `views/partials/vouchers-sidebar.ejs`

---

## Database Entities

### User

```
Owns many Trips
Creates many TravelCompanions
Has optional TravelCompanion profile
```

### Trip

```
Belongs to User
Has many Flights, Hotels, Events, CarRentals, Transportation
Has many TravelCompanions (via TripCompanion)
Has many Vouchers
```

### TravelCompanion

```
Optional link to User
Invited to many Trips (via TripCompanion)
```

### TripCompanion (Junction)

```
Links Trip ↔ TravelCompanion
Tracks: canEdit, addedBy, createdAt
```

### Voucher

```
Belongs to Trip
Has many VoucherAttachments
```

### VoucherAttachment

```
Belongs to Voucher
Links to item (flight/hotel/etc.) via itemType + itemId
References companion via passengerId
```

---

## Frontend Views

| View                | File                                     | Purpose                  |
| ------------------- | ---------------------------------------- | ------------------------ |
| Dashboard           | `views/dashboard.ejs`                    | Trip list, filters       |
| Trip Detail         | `views/trips/trip-view.ejs`              | Trip items, map, sidebar |
| Flight Form         | `views/partials/flight-form.ejs`         | Add/edit flight          |
| Hotel Form          | `views/partials/hotel-form.ejs`          | Add/edit hotel           |
| Event Form          | `views/partials/event-form.ejs`          | Add/edit event           |
| Car Rental Form     | `views/partials/car-rental-form.ejs`     | Add/edit car rental      |
| Transportation Form | `views/partials/transportation-form.ejs` | Add/edit transportation  |
| Companions          | `views/partials/companions-sidebar.ejs`  | Manage companions        |
| Vouchers            | `views/partials/vouchers-sidebar.ejs`    | Manage vouchers          |

---

## Frontend JavaScript

| Module         | File                                | Purpose                  |
| -------------- | ----------------------------------- | ------------------------ |
| Form Handler   | `public/js/async-form-handler.js`   | Form submission, AJAX    |
| Sidebar Loader | `public/js/sidebar-loader.js`       | Load content dynamically |
| Trip Sidebar   | `public/js/trip-view-sidebar.js`    | Trip-specific controls   |
| Maps           | `public/js/maps.js`                 | Map display/interaction  |
| Calendar       | `public/js/calendar.js`             | Calendar widget          |
| Datetime       | `public/js/datetime-formatter.js`   | Date/time formatting     |
| Autocomplete   | `public/js/airport-autocomplete.js` | Airport search           |
| Main           | `public/js/main.js`                 | General utilities        |
| Event Bus      | `public/js/eventBus.js`             | Event communication      |

---

## Adding a New Feature (Template)

To add a new travel item type (e.g., "Restaurant Reservation"):

1. **Create Model:** `models/RestaurantReservation.js`
   - Define fields
   - Add associations (belongsTo Trip, belongsTo User)

2. **Create Controller:** `controllers/restaurantReservationController.js`
   - Implement: create, read, update, delete
   - Check trip ownership
   - Return JSON for AJAX

3. **Create Routes:** `routes/restaurant-reservations.js`
   - `POST /api/trips/:tripId/restaurant-reservations` (create)
   - `GET /api/trips/:tripId/restaurant-reservations` (list)
   - `PUT /api/restaurant-reservations/:id` (update)
   - `DELETE /api/restaurant-reservations/:id` (delete)

4. **Create Form:** `views/partials/restaurant-reservation-form.ejs`
   - Use AJAX handler: `setupAsyncFormSubmission('addRestaurantForm')`

5. **Register Routes:** Add to `server.js` or routes index

6. **Add to Trip Model:** Update associations in `models/Trip.js`

7. **Add to Trip Sidebar:** Update `views/partials/trip-sidebar-content.ejs`

8. **Add Tests:** Create `tests/unit/models/RestaurantReservation.test.js`, etc.

9. **Update Docs:** Update `features.md` with new feature

---

## Related Docs

- **Patterns:** See `patterns.md` for CRUD, AJAX, sidebar patterns
- **Context:** See `context.md` for stack info
- **Development:** See `development-quick-ref.md` for commands
- **Details:** See `.claude/FEATURES/` for feature-specific docs
- **Architecture:** See `.claude/ARCHITECTURE/BACKEND/README.md` for backend details

---

**Last Updated:** 2025-12-18
**Version:** 1.0 (Consolidated from FEATURES/README.md + individual feature docs)
**Size:** ~2.5 KB (vs 8+ KB original)
