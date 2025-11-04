# Travel Companions System - Test Execution Checklist

Use this document to track your testing progress. Check off each test as you complete it.

**Test Date**: ___________
**Tester Name**: ___________
**Build Version**: ___________

---

## Test Suite 1: Companion Request Flow

- [ ] **1.1** Send Companion Request
  - [ ] Companion profile created
  - [ ] Appears in companion selection
  - [ ] Status marked as "Pending"
  - [ ] No console errors

- [ ] **1.2** Accept Companion Request
  - [ ] Request can be accepted
  - [ ] Appears in mutual companions for both users
  - [ ] Permission level saved correctly
  - [ ] Notification appears (if enabled)

- [ ] **1.3** Decline Companion Request
  - [ ] Request can be declined
  - [ ] Status changes to "Declined"
  - [ ] Removed from mutual list
  - [ ] Can resend later

- [ ] **1.4** Resend Companion Request
  - [ ] Declined request can be resent
  - [ ] Status returns to "Pending"
  - [ ] Recipient gets new notification

- [ ] **1.5** Revoke Companion Access
  - [ ] Companion can be revoked
  - [ ] Removed from mutual list
  - [ ] No longer appears on trips
  - [ ] Recipient notified

**Suite 1 Status**: ⬜ Not Started | 🟡 In Progress | ✅ Completed | ❌ Failed

---

## Test Suite 2: Trip Invitation Flow

- [ ] **2.1** Create Trip with Companions
  - [ ] Trip created successfully
  - [ ] Companion added to trip
  - [ ] Permission level saved
  - [ ] TripInvitation record created
  - [ ] Notification sent to companion

- [ ] **2.2** Accept Trip Invitation
  - [ ] Invitation appears in dashboard
  - [ ] Can accept via "Join" button
  - [ ] Trip appears in user's trip list
  - [ ] Status changes to "accepted"
  - [ ] Trip owner notified

- [ ] **2.3** Decline Trip Invitation
  - [ ] Can decline invitation
  - [ ] Trip doesn't appear in user's list
  - [ ] Status changes to "declined"
  - [ ] Trip owner notified of decline

**Suite 2 Status**: ⬜ Not Started | 🟡 In Progress | ✅ Completed | ❌ Failed

---

## Test Suite 3: Item Companion Inheritance

- [ ] **3.1** Auto-cascade Companions to Items
  - [ ] Companion auto-added to item
  - [ ] Marked as "inherited"
  - [ ] Companion count badge shows correctly
  - [ ] Works for flights, hotels, transportation, events, car rentals

- [ ] **3.2** Manually Add Companion to Item
  - [ ] Can add additional companion to item
  - [ ] Marked as "manually added"
  - [ ] Can distinguish between inherited and added
  - [ ] Companion count updates

- [ ] **3.3** Remove Companion from Item
  - [ ] Can remove manually added companion
  - [ ] Companion still on other items (inherited)
  - [ ] Count badge updates correctly
  - [ ] Persists on page refresh

**Suite 3 Status**: ⬜ Not Started | 🟡 In Progress | ✅ Completed | ❌ Failed

---

## Test Suite 4: Permission Enforcement

- [ ] **4.1** View Permission (view_travel)
  - [ ] Companion can view trip
  - [ ] Companion can see all items
  - [ ] Cannot edit trip
  - [ ] Cannot add items (buttons not visible)

- [ ] **4.2** Can Add Items Permission (canEdit)
  - [ ] Permission set correctly in trip
  - [ ] Add item buttons visible to companion
  - [ ] Can create items successfully
  - [ ] Items appear in timeline

- [ ] **4.3** No Add Items Permission
  - [ ] Add item buttons NOT visible
  - [ ] Can still view trip and items
  - [ ] Direct URL access returns 403
  - [ ] No error messages

- [ ] **4.4** Manage Travel Permission
  - [ ] User with manage_travel can create trips
  - [ ] Can edit trip details
  - [ ] Can add/remove items without restriction
  - [ ] Shown with special permission badge

**Suite 4 Status**: ⬜ Not Started | 🟡 In Progress | ✅ Completed | ❌ Failed

---

## Test Suite 5: Notifications

- [ ] **5.1** Companion Request Notification
  - [ ] Notification appears in bell dropdown
  - [ ] Shows requester name
  - [ ] Has "Accept" and "Decline" buttons
  - [ ] Action buttons work inline
  - [ ] Marked as read after action

- [ ] **5.2** Trip Invitation Notification
  - [ ] Notification appears for trip invite
  - [ ] Shows trip name
  - [ ] Shows inviter name
  - [ ] Has "Join" and "Decline" buttons
  - [ ] Page reloads after action

- [ ] **5.3** Notification Polling
  - [ ] New notifications appear within 30 seconds
  - [ ] Badge count updates automatically
  - [ ] No console errors
  - [ ] Polling works without manual refresh

- [ ] **5.4** Mark Notification as Read
  - [ ] Can mark notification as read
  - [ ] Background styling changes
  - [ ] Badge count decreases
  - [ ] Notification persists in list

**Suite 5 Status**: ⬜ Not Started | 🟡 In Progress | ✅ Completed | ❌ Failed

---

## Test Suite 6: Account Linking Flow

- [ ] **6.1** Unlinked Companion Creation
  - [ ] Companion created with email only
  - [ ] Shows in "Unlinked Companions" section
  - [ ] Request can be sent (queued if not user)
  - [ ] Status marked appropriately

- [ ] **6.2** Auto-Link Companion on Registration
  - [ ] New user with invited email registers
  - [ ] Auto-linked to companion profile
  - [ ] Pending request notification appears
  - [ ] Can accept relationship

- [ ] **6.3** Auto-Notification on Account Link
  - [ ] Notification appears when account linked
  - [ ] Original requestor sees status change
  - [ ] Can interact with newly-linked user
  - [ ] Unlinked status cleared

**Suite 6 Status**: ⬜ Not Started | 🟡 In Progress | ✅ Completed | ❌ Failed

---

## Test Suite 7: Edge Cases & Error Handling

- [ ] **7.1** Duplicate Companion Request
  - [ ] Error message appears for duplicate
  - [ ] No duplicate record created
  - [ ] User directed to existing request

- [ ] **7.2** Self-Request Prevention
  - [ ] Cannot add own email as companion
  - [ ] Validation error shown
  - [ ] No record created

- [ ] **7.3** Invalid Permission Levels
  - [ ] Invalid permissions rejected with 400
  - [ ] Error message clear
  - [ ] Database state not corrupted

- [ ] **7.4** Orphaned Invitations
  - [ ] Trip deletion cancels pending invitations
  - [ ] No foreign key errors
  - [ ] Invitation removed from pending list

**Suite 7 Status**: ⬜ Not Started | 🟡 In Progress | ✅ Completed | ❌ Failed

---

## Test Suite 8: Companion Permission Management

- [ ] **8.1** Change Permission Level
  - [ ] Permission can be updated
  - [ ] Modal shows available options
  - [ ] Change persists in database
  - [ ] UI reflects new permission

- [ ] **8.2** Permission Persistence Across Sessions
  - [ ] After logout/login, permission still shows
  - [ ] No reversion to defaults
  - [ ] Consistent across users

**Suite 8 Status**: ⬜ Not Started | 🟡 In Progress | ✅ Completed | ❌ Failed

---

## Test Suite 9: Trip Item Companion Interaction

- [ ] **9.1** Trip Item Display Shows Companions
  - [ ] Item details show companion names
  - [ ] Email addresses visible
  - [ ] Count badge accurate
  - [ ] Status information shown

- [ ] **9.2** Companion Can Edit Own Attendance
  - [ ] Can mark attendance status
  - [ ] Status persists on refresh
  - [ ] Trip owner can see status
  - [ ] Works for all item types

**Suite 9 Status**: ⬜ Not Started | 🟡 In Progress | ✅ Completed | ❌ Failed

---

## Performance & Load Testing

- [ ] **9.3** Large Companion List Performance
  - [ ] Page loads within 2 seconds with 20+ companions
  - [ ] No UI freezing or lag
  - [ ] Scrolling smooth
  - [ ] No memory leaks in console
  - [ ] Works with 10+ companions on trip

**Performance Status**: ⬜ Not Started | 🟡 In Progress | ✅ Completed | ❌ Failed

---

## Browser Compatibility Testing

**Chrome/Chromium**:
- [ ] All tests pass
- [ ] No console errors
- [ ] Responsive design working
- [ ] Date pickers functional

**Firefox**:
- [ ] All tests pass
- [ ] No console errors
- [ ] Responsive design working
- [ ] Date pickers functional

**Safari** (if available):
- [ ] All tests pass
- [ ] No console errors
- [ ] Responsive design working
- [ ] Date pickers functional

---

## Database Integrity Checks

After all tests complete, verify:

- [ ] No orphaned records in CompanionRelationship table
- [ ] No orphaned records in TripInvitation table
- [ ] No orphaned records in ItemCompanion table
- [ ] No orphaned records in Notification table
- [ ] Foreign key relationships intact
- [ ] Cascade deletes work correctly when trip deleted

**Database Check Command**:
```sql
-- Check for orphaned relationships
SELECT * FROM "CompanionRelationship" WHERE "userId" NOT IN (SELECT id FROM "User");
SELECT * FROM "CompanionRelationship" WHERE "companionUserId" NOT IN (SELECT id FROM "User");

-- Check for orphaned trip invitations
SELECT * FROM "TripInvitation" WHERE "tripId" NOT IN (SELECT id FROM "Trip");

-- Check for orphaned item companions
SELECT * FROM "ItemCompanion" WHERE "itemId" NOT IN (SELECT id FROM "Flight") AND "itemType" = 'flight';
```

---

## Issues & Bugs Found

| ID | Test | Description | Severity | Status |
|----|------|-------------|----------|--------|
| BUG-001 | [Test #] | [Description] | [P1/P2/P3] | ⬜ Open |
| | | | | |
| | | | | |

---

## Sign-Off

**All Tests Passed**: ⬜ Yes | ⬜ No

**Ready for Production**: ⬜ Yes | ⬜ No | ⬜ With Known Issues

**Tester Signature**: ___________________

**Date**: ___________________

**Notes/Comments**:
```
[Add any additional notes, observations, or recommendations here]




```

---

## Test Metrics Summary

- **Total Tests**: 36+
- **Tests Passed**: _____ / 36+
- **Tests Failed**: _____ / 36+
- **Pass Rate**: ______%
- **Duration**: _____ hours
- **Issues Found**: _____
  - Critical: _____
  - High: _____
  - Medium: _____
  - Low: _____
