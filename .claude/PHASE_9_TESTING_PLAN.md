# Phase 9: End-to-End Testing & Bug Fixes

## Overview

This document outlines the comprehensive testing plan for the Travel Companions refactor. All 9 phases have been implemented:

1. ✅ Database & Models (Phase 1)
2. ✅ Backend Services & Controllers (Phase 2)
3. ✅ Trip & Item Queries (Phase 3)
4. ✅ Authorization & Permissions (Phase 4)
5. ✅ Frontend Trip Management UI (Phase 5)
6. ✅ Frontend Item Management UI (Phase 6)
7. ✅ Settings & Companion Management UI (Phase 7)
8. ✅ Data Migration (Phase 8)
9. 🔄 End-to-End Testing & Bug Fixes (Phase 9) ← YOU ARE HERE

## Testing Strategy

### Test Categories

1. **Unit Tests** - Individual service/controller methods
2. **Integration Tests** - API endpoints with database
3. **Feature Tests** - User workflows (Create trip → Add attendees → Add items)
4. **Permission Tests** - Access control validation
5. **Migration Tests** - Data integrity after migration
6. **UI Tests** - Component rendering and interactions

## 25-Step Verification Checklist

### PART 1: Basic Setup (Steps 1-3)

#### Step 1: Database Sync

```bash
npm run db:sync
```

- [ ] All tables created successfully
- [ ] No migration errors
- [ ] Database connection stable

#### Step 2: Application Startup

```bash
npm run dev
```

- [ ] Backend starts without errors
- [ ] Frontend builds successfully
- [ ] No TypeScript compilation errors

#### Step 3: Migration Verification

```bash
npm run db:verify-migration
```

- [ ] All verification checks pass
- [ ] Trip owners migrated correctly
- [ ] ItemTrip junction table populated
- [ ] No orphaned records

---

### PART 2: Trip Management (Steps 4-9)

#### Step 4: Create New Trip

1. Login to application
2. Click "Create Trip"
3. Fill in: name, start date, end date
4. Save trip

**Verify:**

- [ ] Trip created in database
- [ ] User automatically added as "owner" in TripAttendee
- [ ] Trip appears in dashboard
- [ ] Trip details page loads

#### Step 5: Add Attendees to Trip

1. Open trip detail page
2. Scroll to "Trip Attendees" section
3. Add two attendees:
   - attendee1@example.com (Role: Admin)
   - attendee2@example.com (Role: Attendee)
4. Save

**Verify:**

- [ ] TripAttendee records created
- [ ] Attendee list displays correctly
- [ ] Roles show correctly (Admin vs Attendee)
- [ ] "Current" badge shows on your entry

#### Step 6: Edit Attendee Role

1. In trip attendees section, change "attendee2" role from Attendee to Admin
2. Save

**Verify:**

- [ ] Role change reflected in database
- [ ] UI updates without page refresh
- [ ] Admin attendee can now edit all items

#### Step 7: Remove Non-Owner Attendee

1. In trip attendees section, click remove button next to one attendee
2. Confirm removal

**Verify:**

- [ ] Attendee removed from TripAttendee
- [ ] Removed attendee no longer sees trip
- [ ] Owner cannot be removed (remove button disabled)

#### Step 8: View Trip as Different Attendee

1. In a different browser/incognito, login as one of the attendees
2. Go to dashboard

**Verify:**

- [ ] Attendee sees the trip in their list
- [ ] Trip shows all correct details
- [ ] Attendee list shows correct roles

#### Step 9: Access Control - Non-Attendee

1. In a different browser, login as a user who is NOT invited
2. Try to access trip directly via URL: `/trip/{tripId}`

**Verify:**

- [ ] 403 Forbidden error or redirect to dashboard
- [ ] Non-attendee cannot view trip
- [ ] Proper error message shown

---

### PART 3: Item Management (Steps 10-17)

#### Step 10: Create Flight in Trip

1. Open trip detail page
2. Click "Add Flight"
3. Fill in: airline, flight number, departure, arrival times
4. In "Add to trips" section, confirm current trip is selected
5. Save

**Verify:**

- [ ] Flight created in database
- [ ] ItemTrip record created linking flight to trip
- [ ] Flight appears in trip's item list
- [ ] Item creator shown (your name)

#### Step 11: Create Hotel and Link to Current Trip

1. Click "Add Hotel"
2. Fill in: name, check-in/out dates, address
3. Add to current trip
4. Save

**Verify:**

- [ ] Hotel created
- [ ] ItemTrip record created
- [ ] Hotel shows in trip items

#### Step 12: Edit Item - Reflects in All Trips

1. Edit the flight (change flight number)
2. Open trip as attendee user
3. Check if attendee sees updated flight details

**Verify:**

- [ ] Flight edit saved
- [ ] Attendee sees updated details
- [ ] Change reflected across all trips item is in

#### Step 13: Create Standalone Item (No Trip)

1. Click "Add Flight"
2. Fill in: airline, flight number, etc.
3. **DO NOT add to any trip**
4. Save

**Verify:**

- [ ] Flight created
- [ ] No ItemTrip records created
- [ ] Flight does NOT appear in any trip
- [ ] Flight accessible from "Standalone Items" section

#### Step 14: Add Standalone Item to Multiple Trips

1. Open the standalone flight from step 13
2. Open "Trips" section in item detail
3. Check boxes for 2-3 trips
4. Save trip selection

**Verify:**

- [ ] ItemTrip records created for each selected trip
- [ ] Flight now appears in all selected trips
- [ ] Each trip's attendees see the flight

#### Step 15: Remove Item from One Trip (Keep in Others)

1. Open the multi-trip flight
2. In "Trips" section, uncheck one trip
3. Save

**Verify:**

- [ ] ItemTrip deleted only for that trip
- [ ] Flight still in other trips
- [ ] Removed trip's attendees no longer see flight
- [ ] Other trips' attendees still see flight

#### Step 16: Delete Item Entirely

1. Delete the standalone flight from step 13
2. Confirm deletion

**Verify:**

- [ ] Flight deleted from database
- [ ] All ItemTrip records deleted
- [ ] No longer appears in any trip

#### Step 17: Attendee Creates Item in Trip

1. Login as attendee user
2. Open shared trip
3. Click "Add Event"
4. Create event in current trip
5. Save

**Verify:**

- [ ] Event created with attendee as createdBy
- [ ] Event visible to all trip attendees
- [ ] Event shows attendee as creator
- [ ] Trip admin can edit attendee's event

---

### PART 4: Permissions & Access Control (Steps 18-22)

#### Step 18: Admin Cannot Edit Items (Only Their Own)

1. Login as regular attendee
2. Try to edit event created by another attendee
3. Try to edit your own event

**Verify:**

- [ ] Cannot edit other attendee's items (read-only or error)
- [ ] Can edit your own items
- [ ] Edit button disabled/missing for others' items

#### Step 19: Admin Can Edit All Items

1. Promote another attendee to Admin role
2. Login as that admin
3. Try to edit an item created by different attendee

**Verify:**

- [ ] Admin can edit any item in trip
- [ ] Changes saved and visible to all attendees
- [ ] No restrictions on admin

#### Step 20: Owner Only - Change Attendee Roles

1. Try as admin to change another attendee's role
2. Try as owner to change another attendee's role

**Verify:**

- [ ] Admin cannot change roles (button disabled)
- [ ] Owner can change roles
- [ ] Role changes take effect immediately

#### Step 21: Full Access Permissions

1. Go to Settings → Trusted Companions
2. Search for another user by email
3. Grant "Full Access" (canManageAllTrips)
4. Have that user login in separate browser

**Verify:**

- [ ] CompanionPermission record created
- [ ] User sees all your trips
- [ ] User can create items in your trips
- [ ] User can manage attendees in your trips
- [ ] User has same privileges as owner

#### Step 22: Revoke Full Access

1. Go to Settings → Trusted Companions
2. Click remove button next to the trusted user
3. Have that user refresh their browser

**Verify:**

- [ ] CompanionPermission deleted
- [ ] User no longer sees your trips
- [ ] User loses access to edit items
- [ ] "No trips" message or redirect shown

---

### PART 5: Edge Cases & Error Handling (Steps 23-25)

#### Step 23: Concurrent Edits

1. Open same item in two browser windows
2. Edit same field in both windows
3. Save first, then second

**Verify:**

- [ ] Last edit wins (or conflict dialog shown)
- [ ] No data corruption
- [ ] UI remains stable

#### Step 24: Delete Trip with Items

1. Create trip with 5+ items
2. Delete the trip
3. Check ItemTrip table

**Verify:**

- [ ] Trip deleted
- [ ] TripAttendee records deleted
- [ ] ItemTrip records deleted
- [ ] Items still exist (orphaned but recoverable)
- [ ] No database errors

#### Step 25: Migrate Existing Data Stability

1. Create several trips/items/attendees/permissions
2. Run: `npm run db:verify-migration`
3. Review verification output

**Verify:**

- [ ] All verification checks still pass
- [ ] No new orphaned records
- [ ] All relationships intact
- [ ] No data loss

---

## Bug Fix Tracking

### Format for Recording Bugs:

```
## Bug: [Title]
**Severity:** Critical/High/Medium/Low
**Step Triggered:** [Which step above]
**Expected:** [What should happen]
**Actual:** [What actually happened]
**Root Cause:** [If identified]
**Fix:** [Solution applied]
**Status:** Fixed/In Progress/Blocked
```

### Known Potential Issues (Check These!)

1. **Item Creation Dialog**
   - [ ] "Add to trips" selector displays all trips
   - [ ] Multi-select works correctly
   - [ ] Deselecting all trips creates standalone item
   - [ ] Selected trips show checkmarks

2. **ItemTripsSelector Component**
   - [ ] Loads available trips on mount
   - [ ] Shows correct trip dates
   - [ ] Current trip marked with badge
   - [ ] Save button disabled when loading
   - [ ] Error messages display correctly

3. **TripAttendeesForm Component**
   - [ ] Search displays companion list
   - [ ] Quick-add buttons work
   - [ ] Role dropdown shows all options
   - [ ] Remove buttons properly disabled
   - [ ] Success/error messages show

4. **Authorization Middleware**
   - [ ] Owner checks working
   - [ ] Admin checks working
   - [ ] Full-access permissions working
   - [ ] 403 errors returned correctly

5. **Database Migrations**
   - [ ] All migrations run without errors
   - [ ] Data properly transformed
   - [ ] Foreign keys properly set
   - [ ] Unique constraints enforced

## Performance Testing

- [ ] Trip with 100+ items loads in <2s
- [ ] Adding attendee does not timeout
- [ ] Multi-trip assignment with 50+ trips responsive
- [ ] Search endpoint returns results in <500ms
- [ ] No N+1 query problems

## Browser Compatibility

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile (iOS Safari, Chrome Android)

## Accessibility Checks

- [ ] Forms have proper labels
- [ ] Error messages clear and actionable
- [ ] Buttons have hover states
- [ ] Keyboard navigation works
- [ ] Screen reader compatible (basic test)

## Code Quality

```bash
# Run all quality checks
npm run lint
npm run format:check
npm run type-check
npm test
```

- [ ] No ESLint errors
- [ ] Code formatted consistently
- [ ] TypeScript type checks pass
- [ ] Unit tests pass (100% of modified code)

## Documentation Updates

- [ ] README updated with new features
- [ ] API documentation updated
- [ ] Database schema documented
- [ ] Migration guide complete
- [ ] Troubleshooting guide complete

## Final Sign-Off

| Item                      | Status | Notes |
| ------------------------- | ------ | ----- |
| All 25 verification steps | ⏳     |       |
| Bug tracking complete     | ⏳     |       |
| Performance acceptable    | ⏳     |       |
| Code quality checks pass  | ⏳     |       |
| Documentation updated     | ⏳     |       |
| **READY FOR PRODUCTION**  | ⏳     |       |

## Rollback Plan

If critical issues found:

1. Stop application
2. Run: `npm run db:rollback`
3. Verify: `npm run db:verify-migration`
4. Restart application
5. Document issue for resolution

## Success Criteria

Phase 9 complete when:

✅ All 25 verification steps pass
✅ No critical bugs remain
✅ Performance acceptable
✅ Code quality checks pass
✅ Documentation updated
✅ Team sign-off obtained

---

**Last Updated:** January 10, 2026
**Testing Phase:** In Progress
**Status:** Active Testing
