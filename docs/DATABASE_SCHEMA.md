# Database Schema & Service Layer Documentation

Complete reference for database tables, relationships, and service layer architecture.

## Table of Contents

- [Database Overview](#database-overview)
- [Core Tables](#core-tables)
- [Relationship Tables](#relationship-tables)
- [Service Layer](#service-layer)
- [Data Access Patterns](#data-access-patterns)

---

## Database Overview

### Technology

- **Database**: PostgreSQL 15
- **ORM**: Sequelize 6.x
- **Migrations**: Sequelize CLI
- **Character Set**: UTF-8
- **Timezone**: UTC (all timestamps)

### Naming Conventions

- Tables: `snake_case` (plural nouns)
- Columns: `camelCase`
- Primary Keys: `id` (UUID v4)
- Foreign Keys: `{model}Id` (e.g., `userId`, `tripId`)
- Timestamps: `createdAt`, `updatedAt` (auto-managed by Sequelize)

---

## Core Tables

### Users

User accounts and authentication.

**Table**: `users`

| Column      | Type         | Constraints      | Description                |
| ----------- | ------------ | ---------------- | -------------------------- |
| `id`        | UUID         | PRIMARY KEY      | Unique user identifier     |
| `email`     | VARCHAR(255) | UNIQUE, NOT NULL | User email address (login) |
| `password`  | VARCHAR(255) | NOT NULL         | bcrypt hashed password     |
| `firstName` | VARCHAR(100) | NOT NULL         | User's first name          |
| `lastName`  | VARCHAR(100) | NOT NULL         | User's last name           |
| `createdAt` | TIMESTAMP    | NOT NULL         | Account creation timestamp |
| `updatedAt` | TIMESTAMP    | NOT NULL         | Last update timestamp      |

**Indexes**:

- `users_pkey` on `id`
- `users_email_key` on `email` (unique)

**Service**: `UserService` (via Passport.js)

**Sample Query**:

```sql
SELECT id, email, "firstName", "lastName"
FROM users
WHERE email = 'user@example.com';
```

---

### Trips

Main travel trip records.

**Table**: `trips`

| Column          | Type         | Constraints             | Description             |
| --------------- | ------------ | ----------------------- | ----------------------- |
| `id`            | UUID         | PRIMARY KEY             | Unique trip identifier  |
| `userId`        | UUID         | FOREIGN KEY → users(id) | Trip owner              |
| `name`          | VARCHAR(255) | NOT NULL                | Trip name/title         |
| `departureDate` | DATE         | NOT NULL                | Trip start date         |
| `returnDate`    | DATE         | NOT NULL                | Trip end date           |
| `purpose`       | VARCHAR(50)  | DEFAULT 'pleasure'      | pleasure/business/other |
| `description`   | TEXT         |                         | Trip notes/description  |
| `createdAt`     | TIMESTAMP    | NOT NULL                | Creation timestamp      |
| `updatedAt`     | TIMESTAMP    | NOT NULL                | Last update timestamp   |

**Indexes**:

- `trips_pkey` on `id`
- `trips_user_id` on `userId`
- `trips_departure_date` on `departureDate`
- `trips_return_date` on `returnDate`

**Constraints**:

- `returnDate` >= `departureDate` (enforced at application level)

**Service**: `TripService`

**Relationships**:

- **Belongs To**: User
- **Has Many**: Flights, Hotels, Transportation, CarRentals, Events
- **Has Many**: TripCompanions (through)
- **Has Many**: TripInvitations

**Sample Query**:

```sql
SELECT t.*,
       COUNT(f.id) as flight_count,
       COUNT(h.id) as hotel_count
FROM trips t
LEFT JOIN flights f ON f."tripId" = t.id
LEFT JOIN hotels h ON h."tripId" = t.id
WHERE t."userId" = $1
  AND t."departureDate" >= CURRENT_DATE
GROUP BY t.id
ORDER BY t."departureDate" ASC;
```

---

### Flights

Flight bookings and details.

**Table**: `flights`

| Column              | Type        | Constraints                      | Description                             |
| ------------------- | ----------- | -------------------------------- | --------------------------------------- |
| `id`                | UUID        | PRIMARY KEY                      | Unique flight identifier                |
| `tripId`            | UUID        | FOREIGN KEY → trips(id), NULL OK | Associated trip (null for standalone)   |
| `flightNumber`      | VARCHAR(20) | NOT NULL                         | Airline + flight number (e.g., "AA100") |
| `origin`            | VARCHAR(10) | NOT NULL                         | IATA code or city                       |
| `destination`       | VARCHAR(10) | NOT NULL                         | IATA code or city                       |
| `departureDateTime` | TIMESTAMP   | NOT NULL                         | Departure date and time                 |
| `arrivalDateTime`   | TIMESTAMP   | NOT NULL                         | Arrival date and time                   |
| `seatNumber`        | VARCHAR(10) |                                  | Seat assignment (e.g., "12A")           |
| `confirmationCode`  | VARCHAR(50) |                                  | Airline confirmation/PNR                |
| `notes`             | TEXT        |                                  | Additional notes                        |
| `createdAt`         | TIMESTAMP   | NOT NULL                         | Creation timestamp                      |
| `updatedAt`         | TIMESTAMP   | NOT NULL                         | Last update timestamp                   |

**Indexes**:

- `flights_pkey` on `id`
- `flights_trip_id` on `tripId`
- `flights_departure_date_time` on `departureDateTime`
- `flights_origin_destination` on `(origin, destination)`

**Service**: `FlightService`

**Relationships**:

- **Belongs To**: Trip (optional)
- **Belongs To**: Airport (origin)
- **Belongs To**: Airport (destination)
- **Has Many**: ItemCompanions
- **Has Many**: VoucherAttachments

**Sample Query**:

```sql
SELECT f.*,
       ao."name" as origin_name,
       ao."city" as origin_city,
       ad."name" as dest_name,
       ad."city" as dest_city
FROM flights f
LEFT JOIN airports ao ON ao.iata = f.origin
LEFT JOIN airports ad ON ad.iata = f.destination
WHERE f."tripId" = $1
ORDER BY f."departureDateTime" ASC;
```

---

### Airports

Global airport database (static reference data).

**Table**: `airports`

| Column      | Type          | Constraints | Description              |
| ----------- | ------------- | ----------- | ------------------------ |
| `iata`      | VARCHAR(3)    | PRIMARY KEY | 3-letter IATA code       |
| `icao`      | VARCHAR(4)    |             | 4-letter ICAO code       |
| `name`      | VARCHAR(255)  | NOT NULL    | Airport name             |
| `city`      | VARCHAR(255)  | NOT NULL    | City name                |
| `country`   | VARCHAR(255)  | NOT NULL    | Country name             |
| `latitude`  | DECIMAL(10,6) |             | Latitude coordinate      |
| `longitude` | DECIMAL(10,6) |             | Longitude coordinate     |
| `timezone`  | VARCHAR(50)   |             | IANA timezone identifier |

**Indexes**:

- `airports_pkey` on `iata`
- `airports_city` on `city`
- `airports_name` on `name`

**Service**: `AirportService`

**Cache Strategy**: 24-hour TTL (static data)

**Sample Query**:

```sql
SELECT iata, name, city, country, latitude, longitude
FROM airports
WHERE LOWER(city) LIKE LOWER($1) OR LOWER(name) LIKE LOWER($1)
ORDER BY
  CASE WHEN LOWER(iata) = LOWER($2) THEN 0 ELSE 1 END,
  CASE WHEN LOWER(city) = LOWER($2) THEN 0 ELSE 1 END,
  name ASC
LIMIT 10;
```

---

### Travel Companions

User-created companion profiles.

**Table**: `travel_companions`

| Column         | Type         | Constraints                      | Description                     |
| -------------- | ------------ | -------------------------------- | ------------------------------- |
| `id`           | UUID         | PRIMARY KEY                      | Unique companion identifier     |
| `createdBy`    | UUID         | FOREIGN KEY → users(id)          | User who created companion      |
| `userId`       | UUID         | FOREIGN KEY → users(id), NULL OK | Linked user account (if exists) |
| `name`         | VARCHAR(255) | NOT NULL                         | Companion's full name           |
| `email`        | VARCHAR(255) |                                  | Companion's email               |
| `dateOfBirth`  | DATE         |                                  | Date of birth                   |
| `relationship` | VARCHAR(50)  |                                  | Relationship to creator         |
| `createdAt`    | TIMESTAMP    | NOT NULL                         | Creation timestamp              |
| `updatedAt`    | TIMESTAMP    | NOT NULL                         | Last update timestamp           |

**Indexes**:

- `travel_companions_pkey` on `id`
- `travel_companions_created_by` on `createdBy`
- `travel_companions_user_id` on `userId`
- `travel_companions_email` on `email`

**Constraints**:

- Unique constraint on `(createdBy, email)` (enforced at application level)

**Service**: `CompanionService`

**Relationships**:

- **Belongs To**: User (creator, via `createdBy`)
- **Belongs To**: User (linked account, via `userId`)
- **Has Many**: TripCompanions
- **Has Many**: ItemCompanions
- **Has Many**: CompanionRelationships

---

### Vouchers

Travel vouchers and certificates.

**Table**: `vouchers`

| Column              | Type          | Constraints                         | Description                                  |
| ------------------- | ------------- | ----------------------------------- | -------------------------------------------- |
| `id`                | UUID          | PRIMARY KEY                         | Unique voucher identifier                    |
| `userId`            | UUID          | FOREIGN KEY → users(id)             | Voucher owner                                |
| `type`              | VARCHAR(50)   | NOT NULL                            | FLIGHT/HOTEL/GENERAL/etc.                    |
| `issuer`            | VARCHAR(255)  | NOT NULL                            | Airline/hotel/company name                   |
| `voucherNumber`     | VARCHAR(100)  | UNIQUE, NOT NULL                    | Voucher/certificate number                   |
| `associatedAccount` | VARCHAR(255)  |                                     | Frequent flyer/loyalty account               |
| `currency`          | VARCHAR(3)    | DEFAULT 'USD'                       | Currency code (ISO 4217)                     |
| `totalValue`        | DECIMAL(10,2) |                                     | Total voucher value                          |
| `usedAmount`        | DECIMAL(10,2) | DEFAULT 0                           | Amount already used                          |
| `status`            | VARCHAR(20)   | NOT NULL                            | OPEN/PARTIALLY_USED/USED/EXPIRED/TRANSFERRED |
| `expirationDate`    | DATE          |                                     | Expiration date                              |
| `parentVoucherId`   | UUID          | FOREIGN KEY → vouchers(id), NULL OK | Original voucher (for reissues)              |
| `notes`             | TEXT          |                                     | Additional notes                             |
| `createdAt`         | TIMESTAMP     | NOT NULL                            | Creation timestamp                           |
| `updatedAt`         | TIMESTAMP     | NOT NULL                            | Last update timestamp                        |

**Indexes**:

- `vouchers_pkey` on `id`
- `vouchers_user_id` on `userId`
- `vouchers_voucher_number` on `voucherNumber` (unique)
- `vouchers_status` on `status`
- `vouchers_expiration_date` on `expirationDate`

**Service**: `VoucherService`

**Relationships**:

- **Belongs To**: User
- **Belongs To**: Voucher (parent, optional)
- **Has Many**: VoucherAttachments

**Virtual Attributes**:

- `remainingBalance`: `totalValue - usedAmount` (computed)

---

## Relationship Tables

### Trip Companions

Links companions to trips.

**Table**: `trip_companions`

| Column        | Type      | Constraints                         | Description            |
| ------------- | --------- | ----------------------------------- | ---------------------- |
| `id`          | UUID      | PRIMARY KEY                         | Unique relationship ID |
| `tripId`      | UUID      | FOREIGN KEY → trips(id)             | Trip reference         |
| `companionId` | UUID      | FOREIGN KEY → travel_companions(id) | Companion reference    |
| `createdAt`   | TIMESTAMP | NOT NULL                            | When added to trip     |
| `updatedAt`   | TIMESTAMP | NOT NULL                            | Last update            |

**Indexes**:

- `trip_companions_pkey` on `id`
- `trip_companions_trip_id` on `tripId`
- `trip_companions_companion_id` on `companionId`
- Unique constraint on `(tripId, companionId)`

---

### Item Companions

Assigns companions to specific travel items (flights, events, etc.).

**Table**: `item_companions`

| Column         | Type        | Constraints | Description             |
| -------------- | ----------- | ----------- | ----------------------- |
| `id`           | UUID        | PRIMARY KEY | Unique assignment ID    |
| `itemType`     | VARCHAR(50) | NOT NULL    | FLIGHT/EVENT/HOTEL/etc. |
| `itemId`       | UUID        | NOT NULL    | ID of the item          |
| `travelerType` | VARCHAR(20) | NOT NULL    | USER/COMPANION          |
| `travelerId`   | UUID        | NOT NULL    | User or companion ID    |
| `createdAt`    | TIMESTAMP   | NOT NULL    | Creation timestamp      |
| `updatedAt`    | TIMESTAMP   | NOT NULL    | Last update             |

**Indexes**:

- `item_companions_pkey` on `id`
- `item_companions_item` on `(itemType, itemId)`
- `item_companions_traveler` on `(travelerType, travelerId)`

**Polymorphic Associations**:

- `itemType` + `itemId` → Flight, Event, Hotel, etc.
- `travelerType` + `travelerId` → User or TravelCompanion

---

### Voucher Attachments

Links vouchers to flights.

**Table**: `voucher_attachments`

| Column         | Type          | Constraints                | Description            |
| -------------- | ------------- | -------------------------- | ---------------------- |
| `id`           | UUID          | PRIMARY KEY                | Unique attachment ID   |
| `voucherId`    | UUID          | FOREIGN KEY → vouchers(id) | Voucher reference      |
| `flightId`     | UUID          | FOREIGN KEY → flights(id)  | Flight reference       |
| `travelerId`   | UUID          | NOT NULL                   | User or companion ID   |
| `travelerType` | VARCHAR(20)   | NOT NULL                   | USER/COMPANION         |
| `amountUsed`   | DECIMAL(10,2) | NOT NULL                   | Amount of voucher used |
| `createdAt`    | TIMESTAMP     | NOT NULL                   | Creation timestamp     |
| `updatedAt`    | TIMESTAMP     | NOT NULL                   | Last update            |

**Indexes**:

- `voucher_attachments_pkey` on `id`
- `voucher_attachments_voucher_id` on `voucherId`
- `voucher_attachments_flight_id` on `flightId`

---

### Trip Invitations

Pending invitations for companions to join trips.

**Table**: `trip_invitations`

| Column          | Type        | Constraints             | Description               |
| --------------- | ----------- | ----------------------- | ------------------------- |
| `id`            | UUID        | PRIMARY KEY             | Unique invitation ID      |
| `tripId`        | UUID        | FOREIGN KEY → trips(id) | Trip reference            |
| `invitedUserId` | UUID        | FOREIGN KEY → users(id) | Invited user              |
| `invitedBy`     | UUID        | FOREIGN KEY → users(id) | User who sent invite      |
| `status`        | VARCHAR(20) | DEFAULT 'pending'       | pending/accepted/declined |
| `createdAt`     | TIMESTAMP   | NOT NULL                | Invitation sent timestamp |
| `updatedAt`     | TIMESTAMP   | NOT NULL                | Last status change        |

**Indexes**:

- `trip_invitations_pkey` on `id`
- `trip_invitations_trip_id` on `tripId`
- `trip_invitations_invited_user_id` on `invitedUserId`
- `trip_invitations_status` on `status`

---

### Companion Relationships

Links companion profiles to user accounts.

**Table**: `companion_relationships`

| Column        | Type      | Constraints                         | Description             |
| ------------- | --------- | ----------------------------------- | ----------------------- |
| `id`          | UUID      | PRIMARY KEY                         | Unique relationship ID  |
| `companionId` | UUID      | FOREIGN KEY → travel_companions(id) | Companion profile       |
| `userId`      | UUID      | FOREIGN KEY → users(id)             | Linked user account     |
| `createdAt`   | TIMESTAMP | NOT NULL                            | Link creation timestamp |
| `updatedAt`   | TIMESTAMP | NOT NULL                            | Last update             |

**Indexes**:

- `companion_relationships_pkey` on `id`
- `companion_relationships_companion_id` on `companionId`
- `companion_relationships_user_id` on `userId`
- Unique constraint on `(companionId, userId)`

---

## Service Layer

### Service Architecture

All services extend `BaseService` which provides common CRUD operations.

```javascript
class BaseService {
  constructor(Model, modelName) {
    this.Model = Model;
    this.modelName = modelName;
  }

  // Common methods
  async findById(id, options = {}) {
    /* ... */
  }
  async create(data) {
    /* ... */
  }
  async update(instance, data) {
    /* ... */
  }
  async delete(instance) {
    /* ... */
  }
  async count(where = {}) {
    /* ... */
  }
  async findByIdAndVerifyOwnership(id, userId, options = {}) {
    /* ... */
  }
  async verifyOwnership(instance, userId) {
    /* ... */
  }
}
```

### TripService

**Location**: `services/tripService.js`

**Methods**:

| Method                               | Description                      | Cache             |
| ------------------------------------ | -------------------------------- | ----------------- |
| `getUserTrips(userId, options)`      | Get user's trips with filtering  | ✅ 5min           |
| `getTripWithDetails(tripId, userId)` | Get single trip with all details | ❌                |
| `createTrip(data, userId)`           | Create new trip                  | Invalidates cache |
| `updateTrip(tripId, data, userId)`   | Update existing trip             | Invalidates cache |
| `deleteTrip(tripId, userId)`         | Delete trip                      | Invalidates cache |
| `getTripStatistics(userId)`          | Get trip statistics              | ✅ 10min          |
| `searchTrips(userId, query, limit)`  | Search user's trips              | ❌                |
| `getStandaloneItems(userId)`         | Get items not in trips           | ❌                |

**Example Usage**:

```javascript
const tripService = require('./services/tripService');

// Get upcoming trips
const trips = await tripService.getUserTrips(userId, {
  filter: 'upcoming',
  page: 1,
  limit: 20,
});

// Create trip
const trip = await tripService.createTrip(
  {
    name: 'Tokyo 2025',
    departureDate: '2025-06-01',
    returnDate: '2025-06-15',
    purpose: 'pleasure',
  },
  userId
);
```

---

### AirportService

**Location**: `services/airportService.js`

**Methods**:

| Method                            | Description         | Cache     |
| --------------------------------- | ------------------- | --------- |
| `getAirportByCode(iataCode)`      | Get airport by IATA | ✅ 24hr   |
| `searchAirports(query, limit)`    | Search airports     | ✅ 24hr   |
| `getAirlineByCode(iataCode)`      | Get airline info    | ❌ (JSON) |
| `parseFlightNumber(flightNumber)` | Parse flight number | ❌        |

**Example Usage**:

```javascript
const airportService = require('./services/airportService');

// Get airport
const airport = await airportService.getAirportByCode('ORD');
// { iata: 'ORD', name: "Chicago O'Hare International", city: 'Chicago, IL', ... }

// Search airports
const results = await airportService.searchAirports('chicago', 10);
// [{ iata: 'ORD', ... }, { iata: 'MDW', ... }, ...]
```

---

### CompanionService

**Location**: `services/companionService.js`

**Methods**:

| Method                                            | Description           | Cache             |
| ------------------------------------------------- | --------------------- | ----------------- |
| `getUserCompanions(userId, options)`              | Get user's companions | ✅ 5min           |
| `createCompanion(data, userId)`                   | Create new companion  | Invalidates cache |
| `updateCompanion(companionId, data, userId)`      | Update companion      | Invalidates cache |
| `deleteCompanion(companionId, userId)`            | Delete companion      | Invalidates cache |
| `addCompanionToTrip(companionId, tripId, userId)` | Add to trip           | ❌                |
| `removeCompanionFromTrip(companionId, tripId)`    | Remove from trip      | ❌                |
| `searchCompanions(userId, query, limit)`          | Search companions     | ❌                |
| `linkCompanionToAccount(companionId, userId)`     | Link to user account  | ❌                |

---

### VoucherService

**Location**: `services/voucherService.js`

**Methods**:

| Method                                            | Description          | Cache             |
| ------------------------------------------------- | -------------------- | ----------------- |
| `getUserVouchers(userId, filters)`                | Get user's vouchers  | ✅ 5min           |
| `createVoucher(data, userId)`                     | Create voucher       | Invalidates cache |
| `updateVoucher(voucherId, data, userId)`          | Update voucher       | Invalidates cache |
| `deleteVoucher(voucherId, userId)`                | Delete voucher       | Invalidates cache |
| `attachVoucherToFlight(voucherId, flightId, ...)` | Attach to flight     | Invalidates cache |
| `reissueVoucher(voucherId, userId)`               | Reissue with balance | Invalidates cache |
| `getExpiringVouchers(userId, days)`               | Get expiring soon    | ❌                |
| `getVoucherStatistics(userId)`                    | Get statistics       | ❌                |

---

### CacheService

**Location**: `services/cacheService.js`

**Purpose**: High-level caching abstraction over Redis

**Key Methods**:

| Method                                       | Description        |
| -------------------------------------------- | ------------------ |
| `getCachedAirportByCode(code)`               | Get cached airport |
| `cacheAirportByCode(code, data)`             | Cache airport data |
| `getCachedUserTrips(userId, filter, page)`   | Get cached trips   |
| `cacheUserTrips(userId, filter, page, data)` | Cache trip data    |
| `invalidateUserTrips(userId)`                | Clear trip cache   |
| `invalidateTripStats(userId)`                | Clear stats cache  |

**Cache Keys**:

```javascript
// Examples
'airport:code:ORD';
'airport:search:chicago:10';
'trips:user:uuid-here:upcoming:1';
'trips:stats:uuid-here';
'companions:user:uuid-here';
'vouchers:user:uuid-here';
```

---

## Data Access Patterns

### Pattern 1: Cached List Query

```javascript
async getUserTrips(userId, options = {}) {
  // 1. Check cache
  const cached = await cacheService.getCachedUserTrips(userId, filter, page);
  if (cached) return cached;

  // 2. Query database
  const trips = await Trip.findAll({ where: { userId }, ...options });

  // 3. Cache result
  await cacheService.cacheUserTrips(userId, filter, page, trips);

  return trips;
}
```

### Pattern 2: Create with Cache Invalidation

```javascript
async createTrip(data, userId) {
  // 1. Create record
  const trip = await Trip.create({ ...data, userId });

  // 2. Invalidate related caches
  await cacheService.invalidateUserTrips(userId);
  await cacheService.invalidateTripStats(userId);

  return trip;
}
```

### Pattern 3: Ownership Verification

```javascript
async updateTrip(tripId, data, userId) {
  // 1. Find and verify ownership
  const trip = await this.findByIdAndVerifyOwnership(tripId, userId);
  if (!trip) throw new Error('Trip not found or access denied');

  // 2. Update
  await this.update(trip, data);

  // 3. Invalidate cache
  await cacheService.invalidateUserTrips(userId);

  return trip;
}
```

### Pattern 4: Eager Loading (Avoid N+1)

```javascript
const trips = await Trip.findAll({
  where: { userId },
  include: [
    { model: Flight, as: 'flights' },
    { model: Hotel, as: 'hotels' },
    { model: TravelCompanion, as: 'companions' },
  ],
});
```

---

## Database Maintenance

### Backup Strategy

```bash
# Daily backup
pg_dump -U postgres -d travel_planner > backup_$(date +%Y%m%d).sql

# Restore
psql -U postgres -d travel_planner < backup_20251119.sql
```

### Index Maintenance

```sql
-- Rebuild indexes
REINDEX TABLE trips;

-- Analyze for query optimization
ANALYZE trips;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

### Cleanup Queries

```sql
-- Delete expired vouchers (older than 2 years)
DELETE FROM vouchers
WHERE "expirationDate" < CURRENT_DATE - INTERVAL '2 years'
  AND status = 'EXPIRED';

-- Delete old invitations (older than 90 days)
DELETE FROM trip_invitations
WHERE status IN ('accepted', 'declined')
  AND "updatedAt" < CURRENT_DATE - INTERVAL '90 days';
```

---

## Migration Management

### Creating Migrations

```bash
# Create new migration
npx sequelize-cli migration:generate --name add-field-to-trips

# Run migrations
npm run db:migrate

# Undo last migration
npm run db:migrate:undo

# Check status
npm run db:migrate:status
```

### Migration Template

```javascript
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('trips', 'newField', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('trips', 'newField');
  },
};
```

---

## Performance Tips

1. **Use Indexes**: Create indexes on frequently queried columns
2. **Eager Load**: Use `include` to avoid N+1 queries
3. **Paginate**: Always paginate large result sets
4. **Cache**: Use Redis for frequently accessed data
5. **Analyze**: Regularly run `ANALYZE` on tables
6. **Connection Pool**: Configure Sequelize pool size appropriately

```javascript
// Good - Eager loading
const trips = await Trip.findAll({
  include: [{ model: Flight }],
});

// Bad - N+1 queries
const trips = await Trip.findAll();
for (const trip of trips) {
  const flights = await trip.getFlights(); // N+1!
}
```

---

## References

- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/15/)
- [Database Normalization](https://en.wikipedia.org/wiki/Database_normalization)
