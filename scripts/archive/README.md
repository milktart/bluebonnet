# Archived Migration Scripts

This directory contains one-time migration scripts that have already been executed and are kept for historical reference.

## migrate-user-ids.js

**Status:** Archived (already executed)

**Purpose:** This migration script was used to backfill the `userId` field on existing Flight, Transportation, and Event records when the schema was updated to include direct user associations.

**What it does:**
- Finds all Flight, Transportation, and Event records where `userId` is null
- Populates the `userId` field by looking up the associated Trip's `userId`
- Uses a database transaction to ensure atomicity
- Rolls back all changes if any error occurs

**When it was used:**
This script was run once during the transition from having resources only associated with trips to having them also directly associated with users for faster authorization queries.

**Why it's archived:**
- The migration has been completed
- All existing records now have proper userId values
- New records automatically get userId on creation (handled by controllers)
- The script should NOT be run again as it would be redundant

**Schema context:**
Before this migration, resources were only connected to users through trips:
```
User -> Trip -> Flight/Transportation/Event
```

After this migration, resources have both direct and indirect user associations:
```
User -> Trip -> Flight/Transportation/Event
User -> Flight/Transportation/Event (direct)
```

This dual association improves query performance and simplifies authorization checks.

---

**Note:** If you need to run a similar migration in the future, use this script as a template. Always test migrations on a backup database first and ensure proper transaction handling.
