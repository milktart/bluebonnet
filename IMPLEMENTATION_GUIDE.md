# Travel Companions System - Implementation Guide

## Overview

This document provides detailed guidance for implementing the remaining frontend views and functionality for the new travel companions system. The backend is fully implemented and tested. This guide covers the views, forms, and UI components that need to be created or updated.

## Completed Backend Work ✅

### Models Created

- `CompanionRelationship` - Bidirectional companion relationships with permission levels
- `TripInvitation` - Trip join requests
- `ItemCompanion` - Item-level companion tracking
- `Notification` - Notification system
- Updated `TripCompanion` with `canAddItems` and `permissionSource`

### Controllers Created/Updated

- `companionRelationshipController` - Full relationship lifecycle
- `notificationController` - Notification management
- `tripInvitationController` - Trip invitations
- `tripController` - Enhanced with new permission system
- All item controllers (Flight, Hotel, Transportation, CarRental, Event) - Auto-add companions to items
- `authController` - Auto-detect account linking

### Routes Created

- `/companion-relationships` - Relationship CRUD
- `/trip-invitations` - Trip invitations
- `/notifications` - Notification management

### Database

- Auto-synced via `db.sequelize.sync({ alter: true })`
- Custom indexes created on startup
- All new tables created automatically

---

## Frontend Implementation Checklist

### 1. Manage Companions Settings View

**File**: `views/partials/companions-manage.ejs` (NEW)
**Location**: Settings > Manage Companions tab

**Display Three Sections:**

#### Section 1: Mutual Companions

```
For each companion where status === 'accepted':
- Display companion name/email
- Show "Their permission to you: [manage_travel|view_travel]"
- Show "Your permission to them: [manage_travel|view_travel]"
- Change permission button (modal for selecting new level)
- Revoke button (DELETE /companion-relationships/:id)
```

#### Section 2: Pending Requests

**Incoming:**

```
For each relationship where companionUserId === current user && status === 'pending':
- Show requester name/email
- Show "Requested permission: [manage_travel|view_travel]"
- Accept button → Show modal with two radio options:
  - "View Travel - they can view my trips"
  - "Manage Travel - they can edit my travel"
  - Accept button → PUT /companion-relationships/:id/accept with permissionLevel
- Decline button → PUT /companion-relationships/:id/decline
```

**Outgoing:**

```
For each relationship where userId === current user && status === 'pending':
- Show recipient name/email
- Show "Requested permission: [manage_travel|view_travel]"
- Status: "Pending..."
- Cancel button → DELETE /companion-relationships/:id
- Resend button → POST /companion-relationships/request (same data)
```

#### Section 3: Unlinked Companions

```
For each TravelCompanion where createdBy === current user && userId === null:
- Display as they currently appear
- Keep existing Edit/Delete functionality
- Note: These will auto-update when they create an account
```

---

### 2. Notification Center

**Location**: Primary sidebar (top)

**Design Pattern:**

- Bell icon with badge showing unread count
- GET /notifications/count/unread on page load
- Click expands notification panel below header
- Poll for new notifications every 30 seconds

**Display:**

```
Unread Notifications:
For each notification where read === false:
- Display notification message
- Show relative time (e.g., "2 hours ago")
- If actionRequired === true:
  - Show action buttons inline

Companion Request Notifications:
- type: 'companion_request_received'
- Show: "{Name} added you as a travel companion"
- Buttons: [Accept] [Decline]
- Action: Click buttons → PUT /companion-relationships/:id/accept or /decline
- Mark as read after action

Trip Invitation Notifications:
- type: 'trip_invitation_received'
- Show: "{Name} invited you to {trip_name} trip"
- Buttons: [Join Trip] [Decline]
- Action: PUT /trip-invitations/:invitationId/respond with response: 'join' or 'decline'
- Mark as read after action

Notification Actions:
- PUT /notifications/:id/read → Mark single as read
- DELETE /notifications/:id → Remove notification
- Click notification → mark as read
```

---

### 3. Trip Create/Edit Forms

**File**: `views/trips/edit.ejs` (UPDATE)

**Update Companion Selection Section:**

```html
<!-- Replace existing companion selection with -->
<div class="companions-section">
  <h3>Travel Companions</h3>

  <!-- Companion selector (existing, keep as is) -->
  <div class="companion-selector-wrapper">
    <!-- Keep existing companion selector -->
  </div>

  <!-- NEW: Per-Companion Permissions -->
  <div class="companion-permissions" id="companionPermissions">
    <!-- For each selected companion, display: -->
    <div class="companion-permission-row" data-companion-id="{companionId}">
      <label>
        <strong>{companionName}</strong>
        <span class="permission-source" data-source="{permissionSource}">
          <!-- Show based on permissionSource:
               - 'manage_travel': "Has manage_travel permission"
               - 'explicit': "Trip companion"
               - 'owner': "Trip owner"
          -->
        </span>
      </label>

      <div class="permission-controls">
        <!-- Only show checkbox if NOT 'manage_travel' source -->
        <!-- If manage_travel, show: "Can edit items" (no checkbox) -->
        <label if="permissionSource !== 'manage_travel'">
          <input
            type="checkbox"
            class="companion-can-edit"
            data-companion-id="{companionId}"
            checked="{canEdit}"
            disabled="permissionSource === 'manage_travel'"
          />
          Can add and edit items
        </label>
      </div>
    </div>
  </div>

  <!-- Hidden field for permission updates -->
  <input type="hidden" name="companionPermissions" id="companionPermissionsJson" value="{}" />
</div>

<script>
  // On checkbox change, update hidden JSON field with:
  // { companionId: boolean, companionId: boolean, ... }
  document.querySelectorAll('.companion-can-edit').forEach((checkbox) => {
    checkbox.addEventListener('change', function () {
      const permissions = {};
      document.querySelectorAll('.companion-can-edit:not(:disabled)').forEach((cb) => {
        permissions[cb.dataset.companionId] = cb.checked;
      });
      document.getElementById('companionPermissionsJson').value = JSON.stringify(permissions);
    });
  });
</script>
```

**Form Submission:**

- Trip form submits `companions` array (existing)
- Also submits `companionPermissions` JSON object
- Server processes both in tripController.updateTrip()

---

### 4. Trip View Sidebar - Pending Trip Invitations

**File**: `views/partials/trip-sidebar-content.ejs` (UPDATE)

**Add Section for Pending Invitations:**

```html
<!-- For trips where user has TripInvitation with status === 'pending' -->
<div class="pending-trip-card">
  <h4>{trip.name}</h4>
  <p>{trip.destination} • {trip.startDate} to {trip.endDate}</p>
  <p class="invitation-from">Invited by {trip.owner.firstName} {trip.owner.lastName}</p>

  <div class="trip-actions">
    <button class="btn btn-primary" onclick="joinTrip('{trip.id}')">Join Trip</button>
    <button class="btn btn-secondary" onclick="declineTrip('{trip.id}')">Leave</button>
  </div>
</div>

<script>
  async function joinTrip(tripId) {
    const invitationId = await getInvitationId(tripId); // GET /trip-invitations/pending
    const response = await fetch(`/trip-invitations/${invitationId}/respond`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response: 'join' }),
    });
    if (response.ok) {
      location.reload(); // Refresh to show trip as joined
    }
  }

  async function declineTrip(tripId) {
    const invitationId = await getInvitationId(tripId);
    const response = await fetch(`/trip-invitations/${invitationId}/respond`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response: 'decline' }),
    });
    if (response.ok) {
      location.reload();
    }
  }
</script>
```

---

### 5. Item Form Travel Companions Section

**Files**: All item forms (flight-form.ejs, hotel-form.ejs, etc.) (UPDATE)

**Add New Section in Each Form:**

```html
<!-- Travel Companions Section (new) -->
<div class="form-section travel-companions-section">
  <h3>Travel Companions</h3>
  <p class="help-text">
    Trip-level companions are automatically included. You can remove them from this item or add
    additional companions.
  </p>

  <div id="itemCompanions" class="companions-list">
    <!-- Auto-populate with companions -->
  </div>

  <!-- Hidden field for companion IDs -->
  <input type="hidden" name="companions" id="itemCompanionsJson" value="[]" />
</div>

<script>
  // On form load:
  // 1. GET /item-companions/{itemType}/{itemId} if editing
  // 2. Or auto-populate from trip companions if creating
  // 3. Display as removable badges with indicator:
  //    - "(inherited)" for trip-level companions
  //    - "(added)" for explicitly added companions

  async function loadCompanions(itemType, itemId, tripId) {
    if (itemId) {
      // Editing - fetch existing companions
      const response = await fetch(`/items/${itemType}/${itemId}/companions`);
      const data = await response.json();
      displayCompanions(data.companions);
    } else if (tripId) {
      // Creating - get trip-level companions
      const response = await fetch(`/trips/${tripId}`);
      const trip = await response.json();
      // Display trip.tripCompanions as inherited
      displayCompanions(
        trip.tripCompanions.map((tc) => ({
          ...tc,
          inherited: true,
        }))
      );
    }
  }

  function displayCompanions(companions) {
    const container = document.getElementById('itemCompanions');
    const ids = [];

    companions.forEach((c) => {
      const badge = document.createElement('div');
      badge.className = 'companion-badge';
      badge.dataset.companionId = c.id;
      badge.innerHTML = `
      <span>${c.name || c.email}</span>
      <span class="badge-label">${c.inherited ? '(inherited)' : '(added)'}</span>
      <button type="button" class="remove-btn" onclick="removeCompanion('${c.id}')">×</button>
    `;
      container.appendChild(badge);
      ids.push(c.id);
    });

    document.getElementById('itemCompanionsJson').value = JSON.stringify(ids);
  }

  function removeCompanion(companionId) {
    document.querySelector(`[data-companion-id="${companionId}"]`).remove();
    updateCompanionIds();
  }

  function updateCompanionIds() {
    const ids = Array.from(document.querySelectorAll('.companion-badge')).map(
      (b) => b.dataset.companionId
    );
    document.getElementById('itemCompanionsJson').value = JSON.stringify(ids);
  }

  // Option to add more companions:
  // Show autocomplete input to add additional companions not on trip
  // Similar to existing companion selector
</script>
```

---

### 6. Item Views - Companion Attendance Display

**Files**: All item detail views (flight details, hotel details, etc.)

**Add Companions Section:**

```html
<div class="item-companions-section">
  <h3>Travelers</h3>

  <div class="companions-list">
    <!-- For each companion on this item -->
    <div class="companion-item">
      <span class="companion-name">{companion.name}</span>

      <!-- If companion.status === 'not_attending': -->
      <span class="badge badge-secondary">Not Attending</span>

      <!-- If companion.inheritedFromTrip === true: -->
      <span class="badge badge-info">Trip Companion</span>
    </div>
  </div>
</div>
```

---

### 7. Dashboard Sidebar - Individual Items

**File**: `views/trips/dashboard.ejs` (UPDATE)

**Show Individual Items Not in Trips:**

```html
<!-- Existing trips section -->

<!-- NEW: Individual Items Section -->
<div class="individual-items-section">
  <h3>Individual Items</h3>

  <!-- Flights -->
  <div id="individualFlights">
    <!-- For each flight where tripId === null -->
    <div class="item-card flight-card">
      <h4>{airline} {flightNumber}</h4>
      <p>{origin} → {destination}</p>
      <p>{departureTime} • {departureDate}</p>
      <a href="/flights/{flightId}">View Details</a>
    </div>
  </div>

  <!-- Hotels, Transportation, Events similar pattern -->
</div>

<!-- NEW: Pending Trip Invitations Section -->
<div class="pending-invitations-section">
  <h3>Pending Trip Invitations</h3>

  <!-- Load via GET /trip-invitations/pending -->
  <!-- Display as trip cards with Join/Decline buttons -->
</div>
```

**JavaScript to Load:**

```javascript
// Load pending invitations
async function loadPendingInvitations() {
  const response = await fetch('/trip-invitations/pending');
  const data = await response.json();
  // Display in pending-invitations-section
}

// Load individual items
async function loadIndividualItems() {
  const response = await fetch('/trips/dashboard?standaloneLOnly=true');
  const data = await response.json();
  // Display standalone flights, hotels, etc.
}

// Load on dashboard page load
document.addEventListener('DOMContentLoaded', () => {
  loadPendingInvitations();
  loadIndividualItems();
});
```

---

## API Endpoints Reference

### Companion Relationships

```
POST   /companion-relationships/request          - Send request
GET    /companion-relationships/pending          - Get pending requests
GET    /companion-relationships/mutual           - Get accepted relationships
PUT    /companion-relationships/:id/accept       - Accept request
PUT    /companion-relationships/:id/decline      - Decline request
PUT    /companion-relationships/:id/permission   - Change permission level
DELETE /companion-relationships/:id              - Revoke relationship
```

### Trip Invitations

```
POST   /trip-invitations/trips/:tripId/invite    - Invite companion to trip
GET    /trip-invitations/pending                 - Get pending invitations
PUT    /trip-invitations/:id/respond             - Accept/decline invitation
POST   /trip-invitations/trips/:tripId/leave     - Leave a trip
```

### Notifications

```
GET    /notifications                             - Get all notifications
GET    /notifications/count/unread               - Get unread count
GET    /notifications/companions                 - Get companion notifications
GET    /notifications/trips                      - Get trip notifications
PUT    /notifications/:id/read                   - Mark as read
PUT    /notifications/read-all                   - Mark all as read
DELETE /notifications/:id                        - Delete notification
```

---

## Permission System Overview

### Permission Hierarchy

1. **Trip Owner** - Full control (implicit)
2. **Manage Travel (from relationship)** - Auto-edit rights on trips/items
3. **Explicit Permission** - Custom permission set at trip level
4. **Default Permission** - Fallback if no explicit permission

### Permission Levels

- **manage_travel**: Can create, edit, delete items; full control
- **view_travel**: Can view trips/items; cannot edit without explicit acceptance
- **trip-specific**: Can edit items only within specific trip (after accepting invitation)

### Item-Level Permissions

- Inherited from trip (marked with "inherited" badge)
- Can be explicitly removed (changes to "not_attending")
- Can be explicitly added (even if not on trip)

---

## Testing Checklist

- [ ] Companion request flow (send → pending → accept/decline)
- [ ] Mutual companion creation after acceptance
- [ ] Permission changes on relationships
- [ ] Unlinked companion account linking flow
- [ ] Manage travel permission granting edit rights
- [ ] View travel permission requiring trip acceptance
- [ ] Trip-level companion auto-add to items
- [ ] Item-level companion removal
- [ ] Notification generation and display
- [ ] Trip invitation acceptance flow
- [ ] Individual item display on dashboard
- [ ] Permission enforcement on edit operations

---

## Database Verification

After starting the server, verify these tables exist:

```sql
SELECT * FROM companion_relationships;
SELECT * FROM trip_invitations;
SELECT * FROM item_companions;
SELECT * FROM notifications;

-- Verify TripCompanion updates
SELECT * FROM trip_companions LIMIT 1;
-- Should have: canAddItems (BOOLEAN), permissionSource (ENUM)
```

---

## Important Notes

1. **Auto-sync**: Database tables are created automatically on server startup
2. **Indexes**: Custom indexes created in server.js after sync
3. **Timestamps**: All tables have createdAt/updatedAt timestamps
4. **Cascading**: Deleting users/trips cascades appropriately
5. **Transactions**: Multi-table operations use transactions for consistency
6. **Validation**: All server-side validation already implemented in controllers

---

## Next Steps

1. Create/update view files according to specifications
2. Test each API endpoint with Postman or curl
3. Verify database schema matches models
4. Implement notification polling in primary sidebar
5. Test complete user flows end-to-end
6. Load test with multiple concurrent users
