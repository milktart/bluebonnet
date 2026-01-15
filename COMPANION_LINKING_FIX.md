# Travel Companion Linking Fix

## Problem Summary

When a user is added as a travel companion and then invited as an attendee to a trip or item, and **that companion later registers an account**, they do not see:
1. The trips they were added to
2. The items they were added to
3. Themselves in the travel companions table in settings

## Root Cause Analysis

The system uses a `TravelCompanion` model to track people in trips. When Alice creates a companion record for Bob (before Bob registers):

```
TravelCompanion {
  id: "abc-123",
  email: "bob@example.com",
  userId: null,              // ← NULL because Bob hasn't registered yet
  createdBy: "alice-user-id"
}

TripCompanion {
  tripId: "trip-1",
  companionId: "abc-123"  // ← Points to Alice's companion record for Bob
}
```

When Bob registers:
```
User {
  id: "bob-user-id",
  email: "bob@example.com"
}

TravelCompanion {
  id: "def-456",           // ← NEW ID!
  email: "bob@example.com",
  userId: "bob-user-id",
  createdBy: "bob-user-id"
}
```

The issue: **TripCompanion still points to the OLD companion ID ("abc-123"), not the new one ("def-456")**

When the system queries for Bob's trips, it looks for:
```javascript
TravelCompanion.findOne({ where: { userId: "bob-user-id" } })
// Finds: "def-456" (Bob's own companion record)

TripCompanion.findAll({ where: { companionId: "def-456" } })
// Returns: NOTHING! (because it points to "abc-123")
```

## Solution

### 1. **Registration Enhancement** (`authController.js`)

When a user registers, create a companion record for them so others can add them:

```javascript
// Create a companion record for this new user
await TravelCompanion.create({
  firstName: newUser.firstName,
  lastName: newUser.lastName,
  name: `${newUser.firstName || ''} ${newUser.lastName || ''}`.trim() || newUser.email,
  email: newUser.email,
  userId: newUser.id,
  createdBy: newUser.id,  // User creates their own companion record
});
```

**Why:** This ensures the new user has a proper companion record that can be referenced in future trips.

### 2. **Companion Lookup Enhancement** (`tripService.js`)

Update all queries to search for companions by **BOTH userId AND email**:

#### In `getUserTrips()`:
```javascript
const userCompanionRecords = await TravelCompanion.findAll({
  where: {
    [Op.or]: [
      { userId },                    // User's own companion record(s)
      { email: currentUser.email },  // Companions with this email (pre-registration)
    ],
  },
});
```

#### In `getStandaloneItems()`:
```javascript
const userCompanionRecords = await TravelCompanion.findAll({
  where: {
    [Op.or]: [
      { userId },
      { email: currentUser.email },
    ],
  },
});
```

#### In `getTripWithDetails()`:
```javascript
// Check if user is a companion - both by userId AND email
let isCompanion = trip.tripCompanions?.some((tc) => tc.companion?.userId === userId);

if (!isCompanion && currentUser) {
  isCompanion = trip.tripCompanions?.some((tc) => tc.companion?.email === currentUser.email);
}
```

**Why:** This bridges the gap between old companion records (with email-based links) and new user accounts, allowing proper access verification.

## How It Works After the Fix

### Scenario: Alice shares a trip with Bob before Bob registers

**Step 1: Alice creates Bob as a companion**
```
TravelCompanion("bob@example.com", userId=null, createdBy=Alice)
TripCompanion(tripId=trip-1, companionId=this-record)
```

**Step 2: Bob registers**
```
// During registration:
// 1. Link the old companion record to Bob's new user account
TravelCompanion("bob@example.com", userId=bob-user-id, createdBy=Alice).update()

// 2. Create a new companion record for Bob (for future references)
TravelCompanion("bob@example.com", userId=bob-user-id, createdBy=Bob)
```

**Step 3: Bob logs in and loads dashboard**
```javascript
// Search finds BOTH companion records:
// 1. Alice's companion record (now linked to Bob)
// 2. Bob's own companion record

// Search for trips:
TripCompanion.findAll({ companionId: { [Op.in]: [alice-companion-id, bob-companion-id] }})
// Returns: trip-1 ✓

// Search by email also works:
TravelCompanion.findAll({ email: "bob@example.com" })
// Returns both records ✓
```

## Files Modified

1. **`controllers/authController.js`**
   - Added companion record creation for new users
   - Existing companion linking still works

2. **`services/tripService.js`**
   - `getUserTrips()`: Enhanced to search by email + userId
   - `getStandaloneItems()`: Enhanced to search by email + userId
   - `getTripWithDetails()`: Enhanced access check with email matching

## Testing Checklist

- [ ] Create a companion for a user with email "bob@example.com"
- [ ] Add that companion to a trip
- [ ] Have Bob register with the same email
- [ ] Login as Bob
- [ ] Verify the trip appears on Bob's dashboard
- [ ] Verify Bob sees the items in that trip
- [ ] Verify Bob appears in the travel companions table (when Alice added Bob)
- [ ] Verify Bob's companion record appears (Bob's own record)

## Edge Cases Handled

1. **Multiple companion records with same email**
   - Query returns all matches, so both pre-registration and post-registration records work

2. **User registered before being added as companion**
   - Email-based search finds their existing TravelCompanion record

3. **Companion record already exists**
   - Creation is wrapped in try-catch, logs warning if it fails, doesn't break registration

## Performance Considerations

- Added one additional `User.findByPk()` call per trip/item loading (minimal impact)
- Queries now search by email in addition to userId (uses indexed field)
- Email index already exists: `TravelCompanion` has unique constraint on email
- No N+1 queries introduced

## Backward Compatibility

All changes are backward compatible:
- Existing companion relationships continue to work
- Email-based lookup is additive (doesn't break userId-based lookup)
- Works with both pre-registered and post-registered companions
