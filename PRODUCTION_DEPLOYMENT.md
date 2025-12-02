# Production Deployment Guide

## Database Migrations Required

When deploying the code changes from this session to production, you need to run the following database migrations in order:

### Migration 1: Make tripId Nullable
**File:** `migrations/20251201-make-tripId-nullable.js`

This migration makes the `tripId` column nullable in two tables:
- `hotels` table
- `car_rentals` table

**Why:** This allows users to create standalone hotels and car rentals that aren't associated with a trip.

**SQL Equivalent:**
```sql
ALTER TABLE hotels ALTER COLUMN "tripId" DROP NOT NULL;
ALTER TABLE car_rentals ALTER COLUMN "tripId" DROP NOT NULL;
```

### Migration 2: Add userId Columns
**File:** `migrations/20251201-add-userid-to-hotels-and-carrentals.js`

This migration adds a `userId` column to two tables:
- `hotels` table
- `car_rentals` table

**Why:** Standalone items need to track which user owns them (for ownership verification).

**What it does:**
1. Adds nullable `userId` UUID column to both tables
2. Populates `userId` from the associated trip's owner for existing items
3. Leaves `userId` NULL for items that don't have a trip association

**SQL Equivalent:**
```sql
ALTER TABLE hotels ADD COLUMN "userId" UUID REFERENCES users(id);
ALTER TABLE car_rentals ADD COLUMN "userId" UUID REFERENCES users(id);

UPDATE hotels
SET "userId" = trips."userId"
FROM trips
WHERE hotels."tripId" = trips.id
AND hotels."userId" IS NULL;

UPDATE car_rentals
SET "userId" = trips."userId"
FROM trips
WHERE car_rentals."tripId" = trips.id
AND car_rentals."userId" IS NULL;
```

## Model Changes Required

The following model changes are already in the codebase and do NOT require migrations:

### Hotel Model
- `timezone` field (STRING, nullable) - already defined in model
- `userId` field (UUID, nullable) - will be created by migration 2

### Transportation Model
- `originTimezone` field (STRING, nullable) - already defined
- `destinationTimezone` field (STRING, nullable) - already defined

### CarRental Model
- `userId` field (UUID, nullable) - will be created by migration 2

## Deployment Steps

### Step 1: Pull Code Changes
```bash
git pull origin main
```

### Step 2: Run Migrations in Order
```bash
# Run migrations (Sequelize will apply them in order)
npm run db:migrate
```

Or if you need to run migrations manually:
```sql
-- In your PostgreSQL database, these migrations will be applied automatically
-- by Sequelize when the app starts if using automatic sync, or manually via CLI
```

### Step 3: Verify Database Changes
After migrations, verify the tables have the correct structure:

```sql
-- Check hotels table
\d hotels

-- Check car_rentals table
\d car_rentals

-- Verify userId was populated for items with trips
SELECT id, "tripId", "userId" FROM hotels LIMIT 5;
SELECT id, "tripId", "userId" FROM car_rentals LIMIT 5;
```

### Step 4: Restart Application
```bash
npm start
```

## Important Notes

1. **Data Consistency:**
   - Standalone items (without tripId) will have NULL userId
   - Items created before these changes will have userId populated from their trip owner
   - Any data inconsistencies should be fixed manually if needed

2. **Backward Compatibility:**
   - Existing trip-associated items will continue to work
   - New standalone item feature is fully backward compatible
   - No breaking changes to existing functionality

3. **Rollback Plan:**
   - Each migration has a `down` function to revert changes
   - If needed, run: `npm run db:migrate:undo:all` (use with caution!)
   - Or run specific down migrations manually

## Code Features Enabled by These Changes

These database changes enable the following new features:

1. **Standalone Items:** Users can now create hotels and car rentals without associating them with a trip
2. **Timezone Support:** Hotels and transportation now store and use timezone information for proper time display
3. **Ownership Tracking:** Standalone items track their owner via userId for proper authorization

## Testing in Production

After deployment, test these features:

1. Create a standalone hotel (without a trip)
2. Edit the hotel and verify timezone is correctly inferred from the address
3. Check that times are displayed in the correct local timezone in the sidebar
4. Verify trip-associated items still work as before

## Troubleshooting

### Migration Fails
- Check PostgreSQL is running and accessible
- Verify database has proper UUID type support
- Check for table lock issues: `SELECT * FROM pg_stat_activity;`

### Timezone Not Working
- Verify geocoding service is accessible
- Check server logs for timezone inference errors
- Manually update hotel timezone: `UPDATE hotels SET timezone = 'America/Chicago' WHERE id = '...'`

### Data Discrepancies
- Check logs for details on which items couldn't be updated
- Items with orphaned references may need manual cleanup
- Use the migration down function to rollback if needed
