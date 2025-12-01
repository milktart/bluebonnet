# Database Schema Fix Required

The models have been updated to allow `tripId` to be nullable in the `hotels` and `car_rentals` tables (to support standalone items). However, the database schema still has the NOT NULL constraint.

## Solution

You need to run the database schema update command inside your Docker container.

### Option 1: Using npm (Recommended)

```bash
docker-compose exec development_travel_planner_app npm run db:sync
```

This will automatically update the database schema to match the Sequelize models.

### Option 2: Using the fix script directly

```bash
docker-compose exec development_travel_planner_app node scripts/fix-tripid-nullable.js
```

### Option 3: Direct SQL (Manual)

If the above doesn't work, you can connect to the PostgreSQL database directly and run these SQL commands:

```sql
ALTER TABLE hotels ALTER COLUMN "tripId" DROP NOT NULL;
ALTER TABLE car_rentals ALTER COLUMN "tripId" DROP NOT NULL;
```

To connect to the database:
```bash
docker-compose exec postgres psql -U postgres -d travel_planner
```

Then paste the SQL commands above.

## After Running

Once the schema is updated, you'll be able to create standalone hotels and car rentals without errors. Try adding a hotel again - it should work now.

## Verification

To verify the schema was updated correctly, you can run this in psql:

```sql
\d hotels
\d car_rentals
```

Look for the `tripId` column - it should show `NULL` in the constraint column (or no `NOT NULL`).
