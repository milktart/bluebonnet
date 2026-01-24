# 📊 Data Model

Database entities, relationships, and schema documentation.

---

## Quick Navigation

- **[User Entity](./USER.md)** (coming)
- **[Trip Entity](./TRIP.md)** (coming)
- **[Travel Items](./TRAVEL_ITEMS.md)** (coming)
- **[Companions System](./COMPANIONS.md)** (coming)
- **[Vouchers System](./VOUCHERS.md)** (coming)
- **[Entity Relationships](./RELATIONSHIPS.md)** (coming)

---

## Core Entities

### User

Users who create trips and manage travel plans.

**Fields:** id, email, password, name, createdAt, updatedAt

**Relationships:**

- Owns many Trips
- Creates many TravelCompanions
- Has one TravelCompanion profile (optional)

### Trip

Travel planning document with start/end dates and multiple items.

**Fields:** id, name, userId, startDate, endDate, description, defaultCompanionEditPermission, createdAt, updatedAt

**Relationships:**

- Belongs to User
- Has many Flights, Hotels, Events, CarRentals, Transportation
- Has many TravelCompanions (via TripCompanion)
- Has many Vouchers

### Flights, Hotels, Events, CarRentals, Transportation

Travel items belonging to a trip.

**Common Fields:** id, tripId, userId, createdAt, updatedAt, [item-specific fields]

**Relationships:**

- Belong to Trip
- Optional: Belong to User (for standalone items)
- May have Vouchers attached

### TravelCompanion

Companion profile that can be invited to trips.

**Fields:** id, userId (optional), name, email, phone, createdAt, updatedAt

**Relationships:**

- Optionally linked to User
- Invited to many Trips (via TripCompanion)

### TripCompanion (Junction)

Links companions to trips with permissions.

**Fields:** id, tripId, companionId, canEdit, addedBy, createdAt

**Relationships:**

- Links Trip to TravelCompanion
- Tracks permissions and who added them

### Voucher

Travel credit or upgrade voucher.

**Fields:** id, tripId, type, description, status, createdAt, updatedAt

**Relationships:**

- Belongs to Trip
- Has many VoucherAttachments

### VoucherAttachment

Links vouchers to specific items and assigns to companions.

**Fields:** id, voucherId, itemType, itemId, passengerId, createdAt

**Relationships:**

- Belongs to Voucher
- Links to flight/hotel/etc.
- May reference companion

---

## Entity Relationships Diagram

```
User (1)
 ├─→ (many) Trip
 ├─→ (many) TravelCompanion (as creator)
 └─→ (1)    TravelCompanion (as profile, optional)

Trip (1)
 ├─→ (many) Flight
 ├─→ (many) Hotel
 ├─→ (many) Event
 ├─→ (many) CarRental
 ├─→ (many) Transportation
 ├─→ (many) TravelCompanion (via TripCompanion)
 └─→ (many) Voucher

TravelCompanion ←→ Trip (many-to-many via TripCompanion)

Voucher (1)
 └─→ (many) VoucherAttachment
```

---

## Data Types

All primary keys are **UUIDs** (universally unique identifiers).

### Timestamps

- `createdAt` - When record created
- `updatedAt` - Last modification time

Both stored in UTC (GMT-0) for consistency.

### Dates

- Flight: `departureDateTime`, `arrivalDateTime`
- Hotel: `checkInDate`, `checkOutDate`
- Event: `eventDate`, `eventTime`

Stored as ISO strings with timezone info.

### Coordinates

- `latitude`, `longitude` - DECIMAL(10, 8)
- For flights, hotels, events with locations

### Enums (Status Fields)

- Voucher status: `pending`, `used`, `expired`
- Event type: `flight`, `hotel`, `event`, etc.

---

## Key Design Patterns

### CASCADE DELETE

When a Trip is deleted, all its:

- Flights
- Hotels
- Events
- CarRentals
- Transportation
- Vouchers
- TripCompanions

...are automatically deleted.

**Benefit:** Maintains data integrity, no orphaned records

### Soft Delete (Planned)

Some entities may use soft deletes in future:

- `deletedAt` timestamp field
- Records marked as deleted, not removed
- Benefit: Can recover deleted items

### Associations

Models define relationships:

```javascript
// models/Trip.js
Trip.hasMany(models.Flight, { onDelete: 'CASCADE' });
Trip.hasMany(models.Hotel, { onDelete: 'CASCADE' });
Trip.belongsToMany(models.TravelCompanion, {
  through: models.TripCompanion,
});
```

### Permissions

TripCompanion tracks:

- `canEdit` - Can companion edit trip?
- `addedBy` - Which user added them?

---

## Database Schema Highlights

### Indexes (Performance)

- `User.email` - Fast login lookups
- `Trip.userId` - Fast trip queries by user
- `Flight.tripId` - Fast flight queries by trip
- `TravelCompanion.email` - Fast companion lookups

### Constraints

- Email must be unique
- Foreign keys enforce referential integrity
- NOT NULL on required fields

### Defaults

- `createdAt`/`updatedAt` - Automatic timestamps
- `id` - AUTO UUID V4
- `canEdit` - Defaults to trip's defaultCompanionEditPermission

---

## Data Volume Expectations

### Typical Usage

- **User:** 100-10,000 (small to medium app)
- **Trips:** 1,000-100,000 (1-10 per active user)
- **Flights:** 3,000-500,000 (3-5 per trip on average)
- **Hotels:** 2,000-300,000 (2-3 per trip)
- **TravelCompanions:** 1,000-50,000 (1-5 per user)

### Growth Rate

- 10-100 new users/month
- 20-500 new trips/month
- 100-5,000 new items/month

---

## Timezone Handling

All dates stored in **UTC (GMT-0)** for consistency.

Local times stored with timezone:

- `originTimezone: "America/New_York"`
- `destinationTimezone: "Europe/London"`

Frontend displays local time based on timezone.

### Example

```
Flight departs from New York:
- UTC: 2025-06-01T08:00:00Z
- Local: 2025-06-01 08:00:00 (EDT: UTC-4)
- Stored with: originTimezone: "America/New_York"

Flight arrives in London:
- UTC: 2025-06-01T12:00:00Z
- Local: 2025-06-01 13:00:00 (BST: UTC+1)
- Stored with: destinationTimezone: "Europe/London"
```

---

## Future Considerations

### Phase 2 (Optional)

- [ ] Migrate to Prisma ORM (from Sequelize)
- [ ] Add soft deletes for audit trail
- [ ] Add change logging/history

### Phase 3 (Optional)

- [ ] Add real-time features (WebSocket)
- [ ] Add collaboration tracking
- [ ] Add activity feed

### Scaling (Future)

- [ ] Database sharding by userId
- [ ] Read replicas for queries
- [ ] Archive old trips

---

## Related Documentation

- **[User Entity](./USER.md)** (coming)
- **[Trip Entity](./TRIP.md)** (coming)
- **[Travel Items](./TRAVEL_ITEMS.md)** (coming)
- **[CRUD Pattern](../../PATTERNS/CRUD_PATTERN.md)** - How operations work
- **[Database Basics](../../LEARNING_RESOURCES/DATABASE_BASICS.md)** - Sequelize info

---

**Last Updated:** 2025-12-17
**Current State:** Sequelize ORM with PostgreSQL
**Database:** PostgreSQL (production-ready)
