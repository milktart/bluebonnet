# Data Migration Guide - Travel Companions Refactor

## Overview

This document describes the migration from the old 4-table companion model to the new simplified 3-table model.

### Old Model (4 Tables)

- **TravelCompanion** - Global companion profiles
- **TripCompanion** - Trip-specific companion assignments
- **ItemCompanion** - Item-level companion tracking
- **CompanionRelationship** - User-to-user relationship negotiation

### New Model (3 Tables)

- **TripAttendee** - Who's attending each trip with role (owner/admin/attendee)
- **ItemTrip** - Many-to-many junction table linking items to multiple trips
- **CompanionPermission** - Full-access trust permissions between users

## Migration Steps

### Step 1: Create New Tables

All new tables are created via migrations:

```bash
npm run db:sync
```

This runs:

- `20260110-create-trip-attendee-table.js` - Creates TripAttendee table
- `20260110-create-item-trip-junction-table.js` - Creates ItemTrip table
- `20260110-create-companion-permission-table.js` - Creates CompanionPermission table

### Step 2: Migrate Trip Attendee Data

Migration: `20260110-migrate-trip-companions-to-attendees.js`

**What happens:**

1. For each trip, creates an "owner" TripAttendee entry for the trip creator
2. Converts TripCompanion records to TripAttendee records:
   - `canEdit=true` → role='admin'
   - `canEdit=false` → role='attendee'
3. Preserves email, name, and timestamps

**Key details:**

- Trip owners cannot be removed or have role changed
- Email-based companions (TravelCompanion records) are referenced
- When a companion creates an account, their userId is automatically populated

### Step 3: Migrate Item-Trip Relationships

Migration: `20260110-migrate-item-trip-relationships.js`

**What happens:**

1. For each item (flight, hotel, event, transportation, car rental):
   - Creates ItemTrip record linking item to its primary trip
   - Records: itemId, itemType, tripId
2. Removes tripId foreign key from item tables
3. Items can now belong to multiple trips via ItemTrip junction table

**Key details:**

- Original tripId column is preserved during migration for safety
- Can be rolled back if needed
- ItemTrip table uses unique constraint (itemId, itemType, tripId)

### Step 4: Verify Migration

```bash
node scripts/verify-migration.js
```

This checks:

- All trips have owner entries
- TripAttendee records match expected count
- ItemTrip table properly populated
- No orphaned records
- Table structure is correct

## Data Mapping Examples

### Example 1: Trip with Attendees

**Before (Old Model):**

```
Trip: "Ski Weekend"
  - TravelCompanion: John (email: john@example.com)
  - TravelCompanion: Jane (email: jane@example.com)
  - TripCompanion: John (canEdit=true)
  - TripCompanion: Jane (canEdit=false)
```

**After (New Model):**

```
Trip: "Ski Weekend"
  - TripAttendee: You (userId=your-id, role='owner')
  - TripAttendee: John (email=john@example.com, role='admin')
  - TripAttendee: Jane (email=jane@example.com, role='attendee')
```

### Example 2: Item in Multiple Trips

**Before (Old Model):**

```
Flight UA123:
  - tripId = "ski-weekend-id"
  - ItemCompanion: John, Jane, You
```

**After (New Model):**

```
Flight UA123:
  - createdBy = "your-id"
  - ItemTrip:
    - trip: "ski-weekend-id"
    - trip: "holiday-trip-id"  (if you add it to another trip)
```

Visibility:

- All attendees of "ski-weekend" see this flight
- All attendees of "holiday-trip" see this flight
- Item creator (you) implicitly "on" all instances

## Rollback Procedure

If issues occur during or after migration:

```bash
# Rollback to pre-migration state
npm run db:rollback
```

This will:

1. Restore tripId columns to item tables
2. Restore data from ItemTrip back to tripId
3. Clear TripAttendee records created from TripCompanion
4. Preserve TravelCompanion and TripCompanion tables

**Note:** Only use if issues are detected within a reasonable window after migration. Extended use of rollback may cause data inconsistency if new trips/items were created.

## Testing Checklist

After migration, test these scenarios:

### Trip Management

- [ ] Create new trip → automatically added as owner
- [ ] View trip → see all attendees
- [ ] Add attendee → updates TripAttendee table
- [ ] Change attendee role → admin can manage
- [ ] Remove attendee → delete from TripAttendee (except owner)

### Item Management

- [ ] Create item in trip → appears in ItemTrip
- [ ] Edit item → changes reflected in all trips it's in
- [ ] Add existing item to new trip → ItemTrip record created
- [ ] Remove item from trip → only that ItemTrip deleted, not item
- [ ] Delete item entirely → all ItemTrip records removed

### Permissions

- [ ] Grant full-access to companion → CompanionPermission created
- [ ] View trips they can manage → shows all trips via permission
- [ ] Update permission level → canManageAllTrips/canViewAllTrips toggles
- [ ] Revoke access → CompanionPermission deleted

### Access Control

- [ ] Non-attendee cannot view trip
- [ ] Attendee can view, but not edit (unless admin)
- [ ] Admin can edit all items in trip
- [ ] Owner can manage attendee list
- [ ] Full-access companion can do owner actions

## Data Cleanup (Optional)

After verifying migration success, you can archive old tables:

```sql
-- Archive old companion tables (optional)
DROP TABLE item_companions CASCADE;
DROP TABLE companion_relationships CASCADE;
DROP TABLE trip_companions CASCADE;
-- Keep TravelCompanion for now (referenced by TripAttendee)
```

**⚠️ WARNING:** Only drop tables after:

1. Migration verified successfully
2. All tests pass
3. Old system confirmed not needed
4. Full backup created

## Troubleshooting

### Issue: "Trips without owners found"

**Cause:** Migration script didn't run properly or trips were created before owner migration.

**Fix:**

```sql
-- Manually create owner entries
INSERT INTO trip_attendees (id, "tripId", "userId", email, "firstName", "lastName", name, role, "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  t.id,
  t."userId",
  u.email,
  u."firstName",
  u."lastName",
  COALESCE(u."firstName" || ' ' || u."lastName", u.email),
  'owner',
  NOW(),
  NOW()
FROM trips t
JOIN users u ON t."userId" = u.id
WHERE NOT EXISTS (
  SELECT 1 FROM trip_attendees ta
  WHERE ta."tripId" = t.id AND ta.role = 'owner'
);
```

### Issue: "Orphaned ItemTrip records found"

**Cause:** ItemTrip records referencing trips that no longer exist.

**Fix:**

```sql
-- Delete orphaned records
DELETE FROM item_trips
WHERE "tripId" NOT IN (SELECT id FROM trips);
```

### Issue: Items not showing in trips

**Cause:** ItemTrip table not properly populated or queries not updated.

**Fix:**

1. Verify ItemTrip table has records:
   ```sql
   SELECT COUNT(*) FROM item_trips;
   ```
2. Check that item controllers use itemTripService
3. Restart application to clear any cached data

## Success Criteria

Migration is complete when:

✓ All verification checks pass
✓ All test scenarios work
✓ No errors in application logs
✓ UI correctly shows:

- Trip attendee list with roles
- Multi-trip item associations
- Trip access controls working
- Trusted companion permissions functional

## Support

If issues arise during migration:

1. Check logs: `npm run dev` with `LOG_LEVEL=debug`
2. Run verification: `node scripts/verify-migration.js`
3. Refer to rollback procedure if needed
4. Review troubleshooting section above
