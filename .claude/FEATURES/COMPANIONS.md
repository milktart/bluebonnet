# 👥 Travel Companions Feature

Complete guide to the travel companions system in Bluebonnet.

---

## Overview

Travel companions allow users to collaborate on trips, share planning responsibilities, and track who's attending which travel items.

**Related:** Trips, Permissions, Vouchers, Notifications

---

## Data Model

### TravelCompanion

**File:** `models/TravelCompanion.js`

```javascript
{
  id: UUID,
  userId: UUID,           // Optional: linked user account
  name: String,           // Companion name
  email: String,          // Email address
  phone: String,          // Phone number (optional)
  createdAt: Timestamp,   // When profile created
  updatedAt: Timestamp
}
```

### TripCompanion (Junction)

**File:** `models/TripCompanion.js`

Links companions to trips with permissions:

```javascript
{
  id: UUID,
  tripId: UUID,
  companionId: UUID,
  canEdit: Boolean,       // Can edit trip details
  addedBy: UUID,          // Which user added them
  createdAt: Timestamp
}
```

---

## API Endpoints

### Create Companion

```
POST /api/companions
Body: { name, email, phone }
Returns: { success: true, companion: {...} }
```

### Add Companion to Trip

```
POST /api/trips/:tripId/companions
Body: { companionId, canEdit }
Returns: { success: true, tripCompanion: {...} }
```

### Remove Companion from Trip

```
DELETE /api/trips/:tripId/companions/:companionId
Returns: { success: true }
```

### Update Companion Permissions

```
PUT /api/trips/:tripId/companions/:companionId
Body: { canEdit }
Returns: { success: true, tripCompanion: {...} }
```

### Get Trip Companions

```
GET /api/trips/:tripId/companions
Returns: { success: true, companions: [...] }
```

---

## Frontend Implementation

### Companion Selector

**File:** `public/js/companions.js`

Used in forms for:

- Assigning flights to companions
- Assigning hotels/rooms to companions
- Voucher redemption assignments
- Event attendance

### Companion Management

**File:** `views/partials/companions-manage.ejs`

Features:

- View trip companions list
- Add new companion (or existing profile)
- Edit companion permissions
- Remove companion from trip
- View companion assignments across items

### Form Integration

When creating flights, hotels, events:

- Dropdown/checkboxes for selecting companion participants
- Displayed during trip item add/edit
- Stored with voucher attachments

---

## Business Logic

### Permission Levels

**Owner (Trip Creator)**

- Create, edit, delete any trip item
- Add/remove companions
- Change companion permissions
- Delete trip

**Editor Companion (canEdit: true)**

- Create, edit, delete trip items
- Add/remove companions from trip items
- Cannot delete trip or remove other companions

**Viewer Companion (canEdit: false)**

- View trip and all items
- Cannot make any changes
- Can be assigned as passenger/guest on items

### Default Permissions

Trips have `defaultCompanionEditPermission`:

- When new companion added, inherits this permission
- Owner can override per-companion
- Can be changed trip-wide

### Companion Lifecycle

1. **Create Profile** - User creates companion profile with name/email/phone
2. **Add to Trip** - User invites companion to trip
3. **Assign to Items** - Companion assigned to flights/hotels/events
4. **Manage** - Owner can change permissions or remove
5. **Archive** - Companion marked inactive if removed

---

## Voucher Assignment

Vouchers can be assigned to specific companions:

```javascript
VoucherAttachment {
  id: UUID,
  voucherId: UUID,
  itemType: String,       // 'flight', 'hotel', 'event'
  itemId: UUID,
  passengerId: UUID,      // TravelCompanion ID
  createdAt: Timestamp
}
```

Example: Upgrade voucher assigned to companion on specific flight

---

## Collaboration Features

### Simultaneous Editing

Currently: Last-write-wins (no conflict resolution)
Future: Real-time sync via WebSocket (Phase 3)

### Activity Tracking

Optional: Track who created/edited which items

- Stored in item `createdBy` and `updatedBy` fields
- Future: Activity log/feed

---

## Notifications (Future)

Optional feature to notify companions:

- When they're added to trip
- When new items added to trip
- When trip starts/ends
- When permissions changed

---

## Privacy & Security

### Email vs Account Link

Companion profiles can exist without account:

- `userId: null` - Standalone companion profile
- Email used for notifications/invitations
- No login capability unless user creates account

When companion creates account:

- Email matched to existing profile
- `userId` populated
- Can login and view own trips

### Permissions Enforcement

- Backend validates `canEdit` permission on all mutations
- Controllers check: `ensureCompanionCanEdit(tripId, userId)`
- Error if viewer tries to create/edit items

---

## Phase 1 Migration (Svelte)

### New Components

```
src/lib/components/
├── CompanionSelector.svelte    # Add/select companions
├── CompanionPermissions.svelte # Edit permissions
├── CompanionList.svelte        # Trip companion list
└── CompanionForm.svelte        # Create/edit profile
```

### Svelte Implementation

```svelte
<script lang="ts">
  import { tripStore } from '$lib/stores/tripStore';
  import { apiClient } from '$lib/services/apiClient';

  let companions = [];
  let selectedCompanion = null;

  async function handleAddCompanion(companion, canEdit) {
    const response = await apiClient.post(
      `/api/trips/${$tripStore.currentTrip.id}/companions`,
      { companionId: companion.id, canEdit }
    );

    if (response.success) {
      $tripStore.companions = [...$tripStore.companions, response.tripCompanion];
    }
  }
</script>
```

---

## Validation Rules

- Email must be valid
- Name not empty
- Phone format valid (if provided)
- Cannot add same companion twice to trip
- Can edit permission is boolean

---

## Related Documentation

- **[Trips](./TRIPS.md)** - Trip management
- **[Vouchers](./VOUCHERS.md)** - Passenger assignment
- **[Permissions](../ARCHITECTURE/SECURITY.md)** - Authorization patterns
- **[Notifications](./NOTIFICATIONS.md)** - Future feature

---

## Debugging

**Common Issues:**

1. **Companion dropdown empty in forms**
   - Check `loadCompanions()` is called
   - Verify `window.tripId` is set
   - Check browser console for fetch errors

2. **Permission not updating**
   - Verify `canEdit` is sent in request
   - Check server is validating permission on mutations
   - Verify companion has edit permission before allowing form submission

3. **Companion not appearing in list**
   - Check companion was added with `canEdit: true` (if needed)
   - Verify trip ID is correct
   - Check database TripCompanion record exists

---

**Last Updated:** 2025-12-17
**Status:** Fully implemented, Phase 1 migration planned
