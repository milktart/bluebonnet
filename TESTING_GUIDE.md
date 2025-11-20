# Travel Companions System - Testing Guide

This document provides comprehensive manual testing procedures for the travel companions feature. These tests validate all aspects of the system including companion requests, trip invitations, permissions, and notifications.

## Prerequisites

- Application running on `http://localhost:3000` or `http://localhost:3500`
- PostgreSQL database accessible and synced
- Two test user accounts with different email addresses

### Test User Setup

Create two test accounts:

1. **User A** (Trip Owner/Creator)
   - Email: `testuser1@example.com`
   - Password: `TestPass123`

2. **User B** (Companion/Invited User)
   - Email: `testuser2@example.com`
   - Password: `TestPass123`

3. **User C** (Additional testing - optional)
   - Email: `testuser3@example.com`
   - Password: `TestPass123`

---

## Test Suite 1: Companion Request Flow

### Test 1.1: Send Companion Request

**Objective**: Verify users can create companion profiles and send requests

**Steps**:

1. Login as User A
2. Navigate to Dashboard
3. Click "Settings" tab → "Travel Companions" button
4. In "Manage Travel Companions" section, locate the companion creation area
5. Create a new companion profile:
   - Name: "Test Companion B"
   - Email: `testuser2@example.com`
   - Phone: `555-0001`
6. Click "Add Companion" button
7. Verify companion appears in companion selection UI

**Expected Results**:

- ✓ Companion profile created successfully
- ✓ Companion appears in "Mutual Companions" section (if User B has reciprocal request)
- ✓ Status shows as "Pending" for unaccepted requests
- ✓ No errors in browser console

**Cleanup**: Save the companion ID for Test 1.2

---

### Test 1.2: Accept Companion Request

**Objective**: Verify companion requests can be accepted

**Prerequisites**: Test 1.1 completed, User B account exists

**Steps**:

1. **Check Notifications (User A)**:
   - Verify notification center shows pending request (optional - if system sends notifications)

2. **User B - Accept Request**:
   - Login as User B
   - Navigate to Dashboard → Settings → Travel Companions
   - Look for "Pending Requests" section (incoming)
   - Find request from User A
   - Click "Accept" button
   - Modal may appear asking to set permission level
   - Keep default permission "View Travel" or select appropriate level
   - Confirm acceptance

3. **Verify in User B's Account**:
   - User A should now appear in "Mutual Companions" section
   - Permission level should be visible

4. **Verify in User A's Account** (sign back in):
   - Refresh the Companions page
   - User B should appear in "Mutual Companions" section

**Expected Results**:

- ✓ Request moved from "Pending" to "Accepted" status
- ✓ Both users see each other as mutual companions
- ✓ Permission level correctly recorded
- ✓ No database errors in logs

---

### Test 1.3: Decline Companion Request

**Objective**: Verify companion requests can be declined

**Prerequisites**: Create a new pending request (similar to Test 1.1)

**Steps**:

1. Create companion profile from User A to test user (different email)
2. Login as recipient user
3. Navigate to Travel Companions section
4. Find the pending request
5. Click "Decline" button
6. Confirm in modal

**Expected Results**:

- ✓ Request status changes to "Declined"
- ✓ Companion removed from mutual list
- ✓ Can re-send request later if desired
- ✓ Notification dismissed or marked as read

---

### Test 1.4: Resend Companion Request

**Objective**: Verify users can resend declined or expired requests

**Prerequisites**: Test 1.3 completed (declined request exists)

**Steps**:

1. As original requestor (User A)
2. Navigate to Travel Companions
3. Look for "Pending Requests" (outgoing)
4. Find the declined request
5. Click "Resend Request" button
6. Verify status returns to "Pending"

**Expected Results**:

- ✓ Request status changes back to "Pending"
- ✓ Recipient receives notification of resent request
- ✓ Previous decline is overridden

---

### Test 1.5: Revoke Companion Access

**Objective**: Verify trip owners can revoke companion access

**Prerequisites**: Test 1.2 completed (mutual companion exists)

**Steps**:

1. As User A (companion creator)
2. Navigate to Travel Companions
3. Find User B in "Mutual Companions"
4. Click "Revoke Access" or similar button
5. Confirm in modal

**Expected Results**:

- ✓ Companion relationship deleted
- ✓ User B removed from mutual companions list
- ✓ User B receives notification of revocation
- ✓ User B cannot see User A's trips anymore

---

## Test Suite 2: Trip Invitation Flow

### Test 2.1: Create Trip with Companions

**Objective**: Verify trips can be created with companions invited

**Prerequisites**: Test 1.2 completed (mutual companions exist)

**Steps**:

1. Login as User A
2. Click "Create Trip" button
3. Fill in trip details:
   - Name: "Test Trip to Europe"
   - Departure Date: (future date)
   - Return Date: (future date, after departure)
   - Purpose: "Pleasure"
4. Scroll to "Companion Permissions" section
5. Select User B as a companion
6. Check "Can add items" checkbox for User B
7. Click "Create Trip" button

**Expected Results**:

- ✓ Trip created successfully
- ✓ Companion added to trip with correct permissions
- ✓ TripInvitation record created in database
- ✓ Notification sent to User B (check notification center when logged in)
- ✓ Trip appears in User A's upcoming trips list

---

### Test 2.2: Accept Trip Invitation

**Objective**: Verify companions can accept trip invitations

**Prerequisites**: Test 2.1 completed (User B has pending invitation)

**Steps**:

1. Login as User B
2. Navigate to Dashboard → Upcoming trips
3. Look for "Pending Trip Invitations" section at top
4. Find the "Test Trip to Europe"
5. Click "Join" button
6. Verify success message
7. Refresh page

**Expected Results**:

- ✓ Invitation status changes to "accepted"
- ✓ Trip moves to User B's "Upcoming Trips" list
- ✓ Pending invitation card disappears
- ✓ User B can now see all trip details
- ✓ User A receives notification of acceptance

---

### Test 2.3: Decline Trip Invitation

**Objective**: Verify companions can decline trip invitations

**Prerequisites**: Create a new trip invitation (similar to Test 2.1)

**Steps**:

1. Login as recipient user
2. Navigate to Dashboard → Upcoming trips
3. Find pending invitation in "Pending Trip Invitations" section
4. Click "Decline" button
5. Verify success message

**Expected Results**:

- ✓ Invitation status changes to "declined"
- ✓ Trip does NOT appear in recipient's trip list
- ✓ Pending invitation card disappears
- ✓ Trip owner receives notification of decline

---

## Test Suite 3: Item Companion Inheritance

### Test 3.1: Auto-cascade Companions to Items

**Objective**: Verify companions are automatically added to all trip items

**Prerequisites**: Test 2.2 completed (User B accepted trip invitation)

**Steps**:

1. Login as User A (trip owner)
2. Navigate to the trip
3. Add a flight to the trip:
   - Click "Add Flight"
   - Fill in flight details (departure city, arrival city, date, time)
   - **Check "Travel Companions" section** at bottom
   - Verify User B appears in the companion list as "Inherited"
   - Click "Save Flight"

4. Verify in item timeline:
   - Flight should show companion count badge
   - Badge should indicate "1 companion"

**Expected Results**:

- ✓ Flight created successfully
- ✓ User B automatically added as companion
- ✓ Badge shows correct count
- ✓ Companion marked as "inherited" not "manually added"

---

### Test 3.2: Manually Add Companion to Item

**Objective**: Verify companions can be manually added to items

**Prerequisites**: Trip exists with at least one companion added

**Steps**:

1. Create second companion profile for same trip
2. Add a hotel to the trip:
   - Click "Add Hotel"
   - Fill in hotel details
   - In "Travel Companions" section, find the second companion
   - Click to add them to this hotel only
   - Click "Save Hotel"

3. Verify:
   - First companion shows as "Inherited"
   - Second companion shows as "Added"

**Expected Results**:

- ✓ Hotel created with mixed companions (inherited + manually added)
- ✓ Companion status labels show correctly
- ✓ Companion count badge reflects actual count

---

### Test 3.3: Remove Companion from Item

**Objective**: Verify companions can be removed from individual items

**Prerequisites**: Test 3.2 completed (item with manually added companion exists)

**Steps**:

1. Click on the hotel created in Test 3.2
2. In "Travel Companions" section, find the manually added companion
3. Click the "Remove" button next to their name
4. Confirm removal
5. Verify in timeline that companion count decreased

**Expected Results**:

- ✓ Companion removed from item only
- ✓ Companion still appears on other trip items (inherited)
- ✓ Companion count badge updates correctly
- ✓ Update persists on page refresh

---

## Test Suite 4: Permission Enforcement

### Test 4.1: View Permission (view_travel)

**Objective**: Verify companions with view_travel permission can see trip

**Prerequisites**: Test 2.2 completed (User B accepted with default permissions)

**Steps**:

1. Login as User B (accepted companion)
2. Navigate to Dashboard
3. Find the trip User A invited them to
4. Click on trip to open it

**Expected Results**:

- ✓ User B can view trip details
- ✓ User B can see all items (flights, hotels, etc.)
- ✓ User B can see other companions on the trip
- ✓ User B **cannot** edit trip (no edit buttons visible)
- ✓ User B **cannot** add items (no add buttons visible)

---

### Test 4.2: Can Add Items Permission (canEdit)

**Objective**: Verify companions with canEdit can add items to trip

**Prerequisites**:

- Test 2.1 completed with "Can add items" checkbox CHECKED for companion
- User B accepted trip invitation

**Steps**:

1. Login as User B
2. Navigate to the trip
3. Look for "Add Flight" or "Add Hotel" buttons
4. Click to add an item
5. Fill in details and save

**Expected Results**:

- ✓ Add item buttons are visible
- ✓ Item can be created successfully
- ✓ Item appears in trip timeline
- ✓ User A receives notification (optional)

---

### Test 4.3: No Add Items Permission

**Objective**: Verify companions without canEdit cannot add items

**Prerequisites**:

- Create trip with companion
- In trip edit form, do NOT check "Can add items" for companion
- Companion accepts invitation

**Steps**:

1. Login as companion user
2. Navigate to the trip
3. Look for "Add Flight" or "Add Hotel" buttons

**Expected Results**:

- ✓ Add item buttons are **not visible**
- ✓ No error messages on page
- ✓ Companion can still view all trip items
- ✓ Trying to access add item URLs directly returns 403 Forbidden

---

### Test 4.4: Manage Travel Permission

**Objective**: Verify users with manage_travel permission can create trips for companions

**Prerequisites**:

- Two users with established companion relationship
- Verify relationship has `permissionLevel: 'manage_travel'`

**Steps**:

1. Login as User A (has manage_travel permission from User B)
2. Click "Create Trip" button
3. In trip creation form, notice that User B might be auto-selected or have special indication
4. Create trip and verify User B is added as owner-level companion

**Expected Results**:

- ✓ Trip created successfully
- ✓ User B appears with "manage_travel" permission badge
- ✓ User B can edit the trip (not just view)
- ✓ User B can add/remove items without restrictions

---

## Test Suite 5: Notifications

### Test 5.1: Companion Request Notification

**Objective**: Verify notifications appear for companion requests

**Prerequisites**: Create new companion request (Test 1.1)

**Steps**:

1. Login as recipient user
2. Look at navigation bar for notification bell icon
3. Click bell icon to open notification panel
4. Verify companion request notification appears with:
   - Name of requester
   - "Accept" and "Decline" buttons
   - Relative time ("just now", "5m ago", etc.)

**Expected Results**:

- ✓ Notification appears in panel
- ✓ Badge count increases
- ✓ Inline action buttons work (accept/decline)
- ✓ Notification marked as read after action

---

### Test 5.2: Trip Invitation Notification

**Objective**: Verify notifications appear for trip invitations

**Prerequisites**: Create new trip with companion invite (Test 2.1)

**Steps**:

1. Login as invited companion
2. Click notification bell
3. Look for trip invitation notification
4. Verify it shows:
   - Trip name
   - Inviter name
   - "Join" and "Decline" buttons

**Expected Results**:

- ✓ Notification appears immediately
- ✓ Action buttons work correctly
- ✓ Notification updates after action
- ✓ Page reloads after accepting/declining

---

### Test 5.3: Notification Polling

**Objective**: Verify notifications update automatically

**Prerequisites**: Two browser windows/tabs with different users logged in

**Steps**:

1. Open User B's account in one window, dashboard in view
2. Open User A's account in another window
3. As User A, create a companion request to User B
4. Watch User B's notification panel (open bell in first window)
5. Wait up to 30 seconds or manually refresh

**Expected Results**:

- ✓ Notification appears within 30 seconds without manual refresh
- ✓ Badge count updates automatically
- ✓ No console errors related to polling

---

### Test 5.4: Mark Notification as Read

**Objective**: Verify notifications can be marked as read

**Prerequisites**: Unread notification exists

**Steps**:

1. Open notification panel
2. Click on a notification to mark it as read
3. Verify notification background changes (no longer highlighted)
4. Check unread count decreases

**Expected Results**:

- ✓ Notification marked as read
- ✓ Background styling updates
- ✓ Badge count decreases
- ✓ Notification persists in list (unless deleted)

---

## Test Suite 6: Account Linking Flow

### Test 6.1: Unlinked Companion Creation

**Objective**: Verify companions can be created with email only (unlinked)

**Steps**:

1. Login as User A
2. Create companion with email of non-existent user: `newuser@example.com`
3. Send request to that email
4. Verify companion appears in "Unlinked Companions" section

**Expected Results**:

- ✓ Companion created successfully
- ✓ Status shows as "Unlinked" or "Awaiting Account"
- ✓ Request can be sent (email may be queued)
- ✓ Companion can later be linked when they create account

---

### Test 6.2: Auto-Link Companion on Registration

**Objective**: Verify new user registering with invited email gets auto-linked

**Prerequisites**: Test 6.1 completed (unlinked companion with `newuser@example.com`)

**Steps**:

1. Register new account with email `newuser@example.com`
2. Complete registration
3. Check notifications on first login
4. Look for pending companion request from User A
5. Accept the request

**Expected Results**:

- ✓ Account created successfully
- ✓ Companion profile auto-linked to user account
- ✓ Notification for companion request appears
- ✓ Can accept companion relationship
- ✓ After acceptance, appears as mutual companion to User A

---

### Test 6.3: Auto-Notification on Account Link

**Objective**: Verify notifications sent when unlinked companion creates account

**Prerequisites**: Test 6.2 partially complete (unlinked companion account being created)

**Steps**:

1. As User A, watch for notification when User C creates account
2. Notification should indicate account was linked to existing companion profile

**Expected Results**:

- ✓ Notification appears for account linking
- ✓ Unlinked companion status updates
- ✓ Can now interact with newly-linked user

---

## Test Suite 7: Edge Cases & Error Handling

### Test 7.1: Duplicate Companion Request

**Objective**: Verify system prevents duplicate companion requests

**Steps**:

1. Create companion profile and send request
2. Try to send another request to same user/email
3. Observe error handling

**Expected Results**:

- ✓ Error message appears: "Companion request already exists"
- ✓ No duplicate record created
- ✓ User guided to existing request status

---

### Test 7.2: Self-Request Prevention

**Objective**: Verify users cannot send companion requests to themselves

**Steps**:

1. Try to create companion with own email
2. Attempt to send request

**Expected Results**:

- ✓ Validation error appears
- ✓ Message: "Cannot add yourself as companion"
- ✓ No record created

---

### Test 7.3: Invalid Permission Levels

**Objective**: Verify invalid permission levels are rejected

**Steps**:

1. Manually craft API request with invalid permission level
2. Send POST/PUT request with invalid permission enum

**Expected Results**:

- ✓ Request rejected with 400 Bad Request
- ✓ Error message describes valid options
- ✓ No database state corrupted

---

### Test 7.4: Orphaned Invitations

**Objective**: Verify behavior when trip is deleted while invitation pending

**Prerequisites**: Trip with pending companion invitation

**Steps**:

1. As trip owner, delete the trip
2. As invited companion, check for invitation

**Expected Results**:

- ✓ Invitation marked as cancelled/invalid
- ✓ Invitation removed from pending list
- ✓ No database foreign key errors

---

## Test Suite 8: Companion Permission Management

### Test 8.1: Change Permission Level

**Objective**: Verify permission levels can be updated after acceptance

**Prerequisites**: Accepted companion relationship exists

**Steps**:

1. Login as User A (relationship creator)
2. Navigate to Travel Companions → Manage Companions
3. Find User B in mutual companions
4. Click "Change Permission" or similar button
5. Modal appears with permission options
6. Change from "View Travel" to "Manage Travel"
7. Confirm change

**Expected Results**:

- ✓ Permission updated in database
- ✓ Modal closes
- ✓ UI reflects new permission level
- ✓ User B receives notification of permission change (optional)

---

### Test 8.2: Permission Persistence Across Sessions

**Objective**: Verify permissions persist after logout/login

**Prerequisites**: Test 8.1 completed (permission changed)

**Steps**:

1. Logout as User A
2. Login again as User A
3. Navigate to Travel Companions
4. Find User B

**Expected Results**:

- ✓ Permission level still shows as updated value
- ✓ No reversion to default

---

## Test Suite 9: Trip Item Companion Interaction

### Test 9.1: Trip Item Display Shows Companions

**Objective**: Verify item views display companion information correctly

**Prerequisites**: Trip with companions and items exists

**Steps**:

1. Navigate to trip
2. Open item details (flight, hotel, etc.)
3. Look for "Travel Companions" section in item detail view

**Expected Results**:

- ✓ Companion names displayed
- ✓ Attendance status shown (if implemented)
- ✓ Email addresses visible for reference
- ✓ Count badge on timeline accurate

---

### Test 9.2: Companion Can Edit Own Attendance

**Objective**: Verify companions can mark attendance status

**Prerequisites**:

- Companion added to trip item
- Item details page loads

**Steps**:

1. Login as companion user
2. Open trip
3. Open item details
4. Look for attendance toggle or "Mark as Not Attending" button
5. Toggle attendance status

**Expected Results**:

- ✓ UI shows current attendance status
- ✓ Status can be changed
- ✓ Change persists on page refresh
- ✓ Trip owner can see status changes

---

## Performance & Load Testing

### Test 9.3: Large Companion List Performance

**Objective**: Verify UI performs with many companions

**Prerequisites**: Create 20+ companion relationships

**Steps**:

1. Open Travel Companions page
2. Scroll through mutual companions list
3. Open trip with 10+ companions
4. Check notification panel with 20+ notifications

**Expected Results**:

- ✓ Pages load within 2 seconds
- ✓ No UI freezing or lag
- ✓ Scrolling is smooth
- ✓ No memory leaks in browser console

---

## Summary & Sign-Off

After completing all test suites, document results:

- [ ] All Test Suite 1 tests passed (Companion Requests)
- [ ] All Test Suite 2 tests passed (Trip Invitations)
- [ ] All Test Suite 3 tests passed (Item Inheritance)
- [ ] All Test Suite 4 tests passed (Permissions)
- [ ] All Test Suite 5 tests passed (Notifications)
- [ ] All Test Suite 6 tests passed (Account Linking)
- [ ] All Test Suite 7 tests passed (Edge Cases)
- [ ] All Test Suite 8 tests passed (Permission Management)
- [ ] All Test Suite 9 tests passed (Trip Item Interaction)
- [ ] Performance testing completed

**Date**: \***\*\_\_\_\*\***
**Tester**: \***\*\_\_\_\*\***
**Build Version**: \***\*\_\_\_\*\***
**Issues Found**: \***\*\_\_\_\*\***

---

## Known Limitations & Future Enhancements

1. **Notification Persistence**: Notifications currently use polling. Consider implementing WebSockets for real-time updates in future versions.

2. **Bulk Operations**: Future enhancement to invite multiple companions at once.

3. **Permission Inheritance**: Currently permissions are per companion per trip. Future versions could include global permission templates.

4. **Audit Trail**: Track who made permission changes and when for security auditing.

5. **Invitation Expiry**: Implement time-limited invitations that expire after N days.
