# Backfilling Hotel Timezone Data

This guide explains how to fix existing hotel records that don't have timezone information.

## Problem

Hotels created before the timezone inference fix may not have timezone data saved in the database. This causes the calendar to display hotel bars on incorrect dates when the local time spans across midnight in a different timezone.

For example:
- A Chicago hotel with check-in at 21 Nov 22:00 CST (10 PM local) would be stored as 22 Nov 04:00 UTC
- Without timezone info, the calendar would show the bar starting on 22 Nov instead of 21 Nov

## Solution

Run the backfill script to automatically infer timezones for all hotels without this data:

```bash
node scripts/backfill-hotel-timezones.js
```

## What the Script Does

1. **Finds all hotels** without timezone information (where timezone is null or empty)
2. **Infers timezone** using one of these methods (in order):
   - If the hotel has coordinates (lat/lng), uses reverse geocoding to determine timezone
   - If coordinates aren't available, geocodes the address to get coordinates, then infers timezone
   - Defaults to UTC if timezone cannot be determined
3. **Updates each hotel** with the inferred timezone
4. **Respects rate limiting** with 1.1 second delays between API calls to avoid overwhelming the geocoding service
5. **Reports results** with a summary of how many hotels were updated and if any failed

## Sample Output

```
Starting hotel timezone backfill...
Found 15 hotels without timezone
Processing: W Bangkok (hotel-id-1)
  ✓ Inferred timezone from coordinates: Asia/Bangkok
  ✓ Updated W Bangkok with timezone: Asia/Bangkok
Processing: Hilton Chicago (hotel-id-2)
  ✓ Inferred timezone from address: America/Chicago
  ✓ Updated Hilton Chicago with timezone: America/Chicago
...
===== BACKFILL COMPLETE =====
✓ Updated: 15 hotels
✗ Failed: 0 hotels
Total processed: 15/15
```

## Requirements

- The script uses the existing geocoding service (OpenStreetMap Nominatim API)
- No API key required
- Requires network connectivity
- Will take some time if you have many hotels (1.1 seconds per hotel to respect rate limiting)

## Monitoring

The script logs detailed information about each hotel processed. Watch for:
- ✓ (checkmark) = Successfully inferred and updated timezone
- ⚠ (warning) = Timezone defaulted to UTC (address couldn't be geocoded)
- ✗ (cross) = Hotel skipped due to error

## Rollback

If needed, you can manually update hotel timezones in the database:

```sql
-- For a specific hotel
UPDATE hotels SET timezone = 'America/Chicago' WHERE id = 'hotel-id';

-- For all hotels with UTC (if they were incorrectly defaulted)
UPDATE hotels SET timezone = NULL WHERE timezone = 'UTC' AND address LIKE '%Chicago%';
```

## After Running

After the backfill completes successfully:
1. All hotels will have correct timezone information
2. New hotel bookings will automatically get the correct timezone (thanks to the form fix)
3. Calendar bars will now display on the correct dates for all hotels
4. No changes to existing code are needed - just better data in the database
