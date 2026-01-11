# Travel Companions System - End-to-End Testing Plan

## Overview

This document outlines the comprehensive testing plan for the new travel companions implementation with explicit one-way relationship permissions.

## Test Environment Setup

1. **Reset Database:**

   ```bash
   npm run db:sync                      # Create fresh schema
   npm run db:seed-companion-data       # Seed test data
   npm run db:verify-companion-migration # Verify everything is correct
   ```

2. **Test Users Created:**
   - Alice (alice@example.com, password: password123) - Initiator
   - Bob (bob@example.com, password: password123) - Recipient
   - Charlie (charlie@example.com, password: password123) - Admin recipient

3. **Initial Relationships:**
   - Alice → Bob (canShareTrips: true, canManageTrips: false)
   - Alice → Charlie (canShareTrips: true, canManageTrips: true)
   - Bob → Alice (canShareTrips: false, canManageTrips: false)

---

## Test Cases

### Test Group 1: Companion Management (SettingsCompanions.svelte)

#### Test 1.1: View Companions List

- **Precondition:** User is logged in
- **Steps:**
  1. Navigate to Settings > Companions
  2. Observe the companions table
- **Expected Results:**
  - ✓ Four permission columns visible: "Shares", "Manages", "Sharing", "Managing"
  - ✓ Each column header shows tooltip on hover
  - ✓ For Alice: sees Bob with "Sharing" ✓, sees Charlie with "Sharing" ✓ and "Managing" ✓
  - ✓ For Bob: sees Alice with empty permissions initially
  - ✓ Edit and delete action buttons visible

#### Test 1.2: Edit Companion (Change Permissions)

- **Precondition:** Alice is logged in, viewing companions
- **Steps:**
  1. Click Edit button next to Bob
  2. Uncheck "Share my travel" checkbox
  3. Check "Allow this person to manage my travel" checkbox
  4. Click Update
- **Expected Results:**
  - ✓ Form displays with current permission checkboxes
  - ✓ Checkboxes properly reflect current state
  - ✓ Received permissions section shows Bob's permissions (share = false, manage = false)
  - ✓ Form submits successfully
  - ✓ Table updates showing: "Sharing" is now empty, "Managing" now shows ✓

#### Test 1.3: Add New Companion

- **Precondition:** Alice is logged in
- **Steps:**
  1. Click "Add Companion" button
  2. Enter email: bob@example.com (already exists as user)
  3. Enter First Name: Robert
  4. Enter Last Name: S (for "Smith")
  5. Check both checkboxes
  6. Click "Add Companion"
- **Expected Results:**
  - ✓ Form displays with checkboxes checked by default
  - ✓ Email field is required and validated
  - ✓ First/Last name optional but if one is entered, both required
  - ✓ Form submits successfully
  - ✓ Confirmation message appears
  - ✓ New companion appears in table

#### Test 1.4: Delete Companion

- **Precondition:** Companion exists in list
- **Steps:**
  1. Click Delete button on any companion
  2. Confirm deletion in modal
- **Expected Results:**
  - ✓ Companion is removed from table
  - ✓ Success message appears
  - ✓ No companion data remains in database for that relationship

---

### Test Group 2: Permission Consistency (Bidirectional Relationships)

#### Test 2.1: Bidirectional Visibility

- **Precondition:** Alice added Bob (canShareTrips=true)
- **Steps:**
  1. Log in as Alice, verify Bob appears in companions list
  2. Log out, log in as Bob
  3. Check Bob's companions list
- **Expected Results:**
  - ✓ Bob sees Alice in his companions list (reverse companion record created)
  - ✓ Bob's view shows Alice with "Sharing" ✓ (because Alice shares)
  - ✓ Bob can edit his permissions (grant/revoke access to Alice)

#### Test 2.2: Independent Permissions

- **Precondition:** Alice has Bob with (canShareTrips=true, canManageTrips=false)
- **Steps:**
  1. As Alice: Verify table shows "Sharing" ✓, "Managing" empty
  2. Bob grants Alice canShareTrips permission
  3. Refresh as Alice
- **Expected Results:**
  - ✓ Alice's permissions remain unchanged (Sharing ✓, Managing empty)
  - ✓ Bob's row shows "Shares" ✓ (Bob now shares with Alice)
  - ✓ Permissions are truly independent

---

### Test Group 3: Trip Visibility with Shared Companions

#### Test 3.1: Trip Visibility when Sharing

- **Precondition:** Alice has trip "Summer Vacation", shared with Bob (canShareTrips=true)
- **Steps:**
  1. As Alice: Create trip "Summer Vacation"
  2. Log out, log in as Bob
  3. Check Bob's trip list
- **Expected Results:**
  - ✓ Bob sees "Summer Vacation" trip in his list
  - ✓ Trip is labeled as "Shared" or shows source (Alice's trip)
  - ✓ Bob can view trip details but cannot edit (view-only)
  - ✓ Bob can add items to trip (as attendee)

#### Test 3.2: Trip Visibility without Sharing

- **Precondition:** Bob has not granted canShareTrips to Alice
- **Steps:**
  1. As Bob: Create trip "Bob's Trip"
  2. Log out, log in as Alice
  3. Check Alice's trip list
- **Expected Results:**
  - ✓ Alice does NOT see "Bob's Trip"
  - ✓ Only Alice's own trips visible

#### Test 3.3: Trip Management with canManageTrips

- **Precondition:** Alice has canManageTrips=true for Charlie
- **Steps:**
  1. As Alice: Create new trip "Partner Trip"
  2. Log out, log in as Charlie
  3. Navigate to Settings > Companions
  4. Check if Charlie sees trip from Alice
- **Expected Results:**
  - ✓ Charlie sees "Partner Trip" in trip list (via manage access)
  - ✓ Charlie can create/edit items in trip
  - ✓ Charlie can manage attendees (if admin)

---

### Test Group 4: Trip Attendees (TripAttendee Model)

#### Test 4.1: Add Attendee to Trip

- **Precondition:** Alice owns "Summer Vacation" trip
- **Steps:**
  1. Click "Manage Attendees" in trip detail
  2. Search for "Bob" in companion list
  3. Select role: "attendee"
  4. Click "Add"
- **Expected Results:**
  - ✓ Bob appears in attendees list with "attendee" role
  - ✓ Bob receives notification/email (if configured)
  - ✓ Bob can log in and see trip

#### Test 4.2: Change Attendee Role

- **Precondition:** Bob is attendee on Alice's trip
- **Steps:**
  1. Click attendee list
  2. Click edit on Bob's attendee row
  3. Change role to "admin"
  4. Save
- **Expected Results:**
  - ✓ Bob's role changes to "admin"
  - ✓ Bob can now edit all items in trip
  - ✓ Bob can manage attendee list

#### Test 4.3: Attendee Permissions

- **Precondition:** Bob is regular attendee, Charlie is admin
- **Steps:**
  1. As Bob: Try to create item in trip (should work)
  2. Try to edit another attendee's item (should fail)
  3. As Charlie: Edit Bob's item (should work)
  4. Edit attendee list (should work)
- **Expected Results:**
  - ✓ Attendee can create/edit own items only
  - ✓ Admin can edit all items and manage attendees
  - ✓ Owner can do everything

---

### Test Group 5: Authorization & Access Control

#### Test 5.1: Unauthorized Trip Access

- **Precondition:** Alice owns trip, Bob has no relationship
- **Steps:**
  1. Manually navigate to trip URL as Bob
  2. Try to fetch trip via API
- **Expected Results:**
  - ✓ Access denied (403)
  - ✓ Error message: "Access denied"

#### Test 5.2: Limited Edit Access

- **Precondition:** Charlie is attendee (not admin) on Alice's trip
- **Steps:**
  1. Try to delete trip as Charlie (should fail)
  2. Try to remove another attendee as Charlie (should fail)
  3. Try to create item as Charlie (should succeed)
- **Expected Results:**
  - ✓ Cannot delete or manage attendee list
  - ✓ Can create items
  - ✓ Appropriate error messages

#### Test 5.3: Full Access via canManageTrips

- **Precondition:** Alice granted canManageTrips to Charlie
- **Steps:**
  1. Check authorization service: hasFullAccessTo(charlie, alice, 'manage')
  2. Try to create trip in Alice's account as Charlie
  3. Verify authorization checks pass
- **Expected Results:**
  - ✓ Authorization service returns true
  - ✓ Charlie can access all Alice's trips
  - ✓ Charlie can edit items in Alice's trips

---

### Test Group 6: Data Integrity

#### Test 6.1: Permission Records

- **Steps:**
  1. Create companion relationship
  2. Query database: SELECT \* FROM companion_permissions
  3. Run verification: npm run db:verify-companion-migration
- **Expected Results:**
  - ✓ CompanionPermission records have: companionId, grantedBy, canShareTrips, canManageTrips
  - ✓ No duplicate (companionId, grantedBy) pairs
  - ✓ All foreign keys valid
  - ✓ Verification script reports "PASSED"

#### Test 6.2: Companion Records

- **Steps:**
  1. Query: SELECT \* FROM travel_companions WHERE userId IS NOT NULL
  2. Verify: createdBy, userId, email fields populated
- **Expected Results:**
  - ✓ All companions have createdBy (who created it)
  - ✓ If user exists, userId is populated
  - ✓ Email matches the companion's email

#### Test 6.3: Cascade Delete

- **Steps:**
  1. Delete a companion
  2. Check database: SELECT \* FROM companion_permissions WHERE companionId = ?
  3. Verify related records cleaned up
- **Expected Results:**
  - ✓ CompanionPermission records deleted
  - ✓ No orphaned records remain

---

### Test Group 7: Edge Cases

#### Test 7.1: Self-Companionship Prevention

- **Steps:**
  1. Try to add yourself as a companion
- **Expected Results:**
  - ✓ Form validation prevents self-add
  - ✓ Error message shown

#### Test 7.2: Duplicate Companion Prevention

- **Steps:**
  1. Add Bob as companion
  2. Try to add Bob again with different name
- **Expected Results:**
  - ✓ Duplicate prevention by email per creator
  - ✓ Error message shown or form ignores duplicate

#### Test 7.3: Permission State Transitions

- **Steps:**
  1. Start with (canShareTrips=true, canManageTrips=false)
  2. Change to (false, false)
  3. Then change to (false, true)
  4. Then change to (true, true)
- **Expected Results:**
  - ✓ All transitions work correctly
  - ✓ Database state matches form state
  - ✓ Trip visibility changes reflect new permissions

#### Test 7.4: Email Case Insensitivity

- **Steps:**
  1. Add companion with email "bob@example.com"
  2. Try to add "BOB@EXAMPLE.COM"
- **Expected Results:**
  - ✓ Email treated as case-insensitive
  - ✓ Duplicate prevention works correctly

---

### Test Group 8: API Endpoints

#### Test 8.1: GET /api/v1/companions

- **Steps:**
  1. Call as authenticated user
  2. Verify response data structure
- **Expected Results:**
  - ✓ Status 200
  - ✓ Returns array of companions with permission data
  - ✓ Each companion has: id, email, firstName, lastName, canShareTrips, canManageTrips, theyShareTrips, theyManageTrips

#### Test 8.2: POST /api/v1/companions

- **Steps:**
  1. POST new companion data
  2. Verify companion and reverse companion created
- **Expected Results:**
  - ✓ Status 201
  - ✓ Returns created companion
  - ✓ Reverse companion created in other user's list

#### Test 8.3: PUT /api/v1/companions/:id/permissions

- **Steps:**
  1. PUT with new permission values
  2. Query database to verify
- **Expected Results:**
  - ✓ Status 200
  - ✓ CompanionPermission record updated
  - ✓ Response returns updated permission object

---

## Test Execution Log

| Test ID | Status | Notes   | Date |
| ------- | ------ | ------- | ---- |
| 1.1     | ⏳     | Pending |      |
| 1.2     | ⏳     | Pending |      |
| 1.3     | ⏳     | Pending |      |
| 1.4     | ⏳     | Pending |      |
| 2.1     | ⏳     | Pending |      |
| 2.2     | ⏳     | Pending |      |
| 3.1     | ⏳     | Pending |      |
| 3.2     | ⏳     | Pending |      |
| 3.3     | ⏳     | Pending |      |
| 4.1     | ⏳     | Pending |      |
| 4.2     | ⏳     | Pending |      |
| 4.3     | ⏳     | Pending |      |
| 5.1     | ⏳     | Pending |      |
| 5.2     | ⏳     | Pending |      |
| 5.3     | ⏳     | Pending |      |
| 6.1     | ⏳     | Pending |      |
| 6.2     | ⏳     | Pending |      |
| 6.3     | ⏳     | Pending |      |
| 7.1     | ⏳     | Pending |      |
| 7.2     | ⏳     | Pending |      |
| 7.3     | ⏳     | Pending |      |
| 7.4     | ⏳     | Pending |      |
| 8.1     | ⏳     | Pending |      |
| 8.2     | ⏳     | Pending |      |
| 8.3     | ⏳     | Pending |      |

---

## Known Issues & Fixes

### Issue 1: ESLint pre-commit hook failures

- **Status:** ✅ FIXED
- **Description:** "no-lonely-if" violations in companions.js
- **Fix:** Refactored redundant if/else blocks to use else-if pattern

### Issue 2: Companion permission schema change

- **Status:** ✅ COMPLETE
- **Description:** Changed from (ownerId, trustedUserId) to (companionId, grantedBy)
- **Migration:** 20260111-alter-companion-permissions-schema.js

### Issue 3: Bidirectional reverse companion creation

- **Status:** ✅ IMPLEMENTED
- **Description:** When Alice adds Bob, Bob should see Alice in their list
- **Solution:** Auto-create reverse companion record with (canShareTrips=false, canManageTrips=false)

### Issue 4: Migration fails when running db:sync on existing databases

- **Status:** ✅ FIXED
- **Description:** "column companionId contains null values" error during Docker build
- **Root Cause:** db:sync tries to alter table before migration runs, causing NOT NULL constraint violation
- **Fix:** Updated migration to detect schema state and handle gracefully:
  - New databases: Create fresh table
  - Existing old schema: Migrate data
  - Mixed/new schema: Skip (already migrated)
- **Migration:** 20260111-alter-companion-permissions-schema.js

---

## Regression Testing

After making any changes to companion system, verify:

1. **Database Schema:**

   ```bash
   npm run db:verify-companion-migration
   ```

2. **API Responses:**
   - GET /api/v1/companions returns all companions with permission data
   - Permissions match database state

3. **UI State:**
   - SettingsCompanions displays 4-column table correctly
   - CompanionForm displays 2 independent checkboxes
   - Permission changes persist and sync correctly

4. **Authorization:**
   - Trip visibility respects companion permissions
   - canManageTrips grants full trip access
   - canShareTrips grants view-only access

---

## Performance Considerations

1. **Companion List Queries:**
   - Include relationships to avoid N+1 queries
   - Cache companion permissions when possible

2. **Trip Visibility:**
   - Join with TravelCompanion and CompanionPermission tables
   - Limit to actual accessible trips

3. **Database Indexes:**
   - Unique index on (companionId, grantedBy)
   - Index on userId for quick lookups

---

## Success Criteria

✅ All 25 test cases pass
✅ No data integrity issues
✅ Authorization working correctly
✅ API endpoints return correct data
✅ UI displays permissions accurately
✅ Bidirectional relationships work
✅ Permission changes reflect immediately
✅ No ESLint or Prettier violations

---

**Test Plan Version:** 1.0
**Last Updated:** 2026-01-11
**Status:** Ready for Testing
