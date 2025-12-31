# 🎟️ Vouchers & Credits System

Complete guide to the travel vouchers, credits, and upgrade tracking system.

---

## Overview

Vouchers track travel credits, upgrade vouchers, gift cards, and other redeemable credentials across trip items and companions.

**Related:** Trips, Travel Items, Companions, Redemption

---

## Data Model

### Voucher
**File:** `models/Voucher.js`

```javascript
{
  id: UUID,
  tripId: UUID,
  userId: UUID,          // Owner
  type: String,          // credit/upgrade/gift-card/loyalty-points/etc
  description: String,   // e.g., "$100 United airline credit"
  amount: Decimal,       // Value in USD or points
  currency: String,      // USD, points, miles, etc
  status: Enum,          // pending, used, partial, expired
  expiryDate: ISO String,// When voucher expires
  notes: String,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### VoucherAttachment
Assigns voucher to specific item and passenger:

```javascript
{
  id: UUID,
  voucherId: UUID,
  itemType: String,      // 'flight', 'hotel', 'event', 'transportation'
  itemId: UUID,
  passengerId: UUID,     // TravelCompanion.id (optional)
  statusOnItem: String,  // pending, used, partial, refunded
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## API Endpoints

### Create Voucher
```
POST /api/trips/:tripId/vouchers
Body: {
  type, description, amount, currency,
  status, expiryDate, notes
}
Returns: { success: true, voucher: {...} }
```

### Attach Voucher to Item
```
POST /api/vouchers/:voucherId/attach
Body: {
  itemType, itemId, passengerId
}
Returns: { success: true, attachment: {...} }
```

### Update Voucher Status
```
PUT /api/vouchers/:id
Body: { status }
Returns: { success: true, voucher: {...} }
```

### Get Trip Vouchers
```
GET /api/trips/:tripId/vouchers
Returns: { success: true, vouchers: [...] }
```

### Delete Voucher
```
DELETE /api/vouchers/:id
Returns: { success: true }
```

---

## Voucher Types

### Supported Types

- **`credit`** - Travel credit (e.g., "$100 airline credit")
- **`upgrade`** - Upgrade voucher (e.g., "Free upgrade to first class")
- **`gift-card`** - Gift card (e.g., "$50 restaurant gift card")
- **`loyalty-points`** - Loyalty program points (e.g., "5000 United miles")
- **`meal-voucher`** - Meal voucher (e.g., "$30 meal voucher")
- **`other`** - Other redeemable

### Status Values

- **`pending`** - Created but not used
- **`used`** - Fully redeemed
- **`partial`** - Partially used (e.g., $60 of $100 used)
- **`expired`** - Past expiry date, cannot use
- **`refunded`** - Reimbursed or cancelled

---

## Frontend Implementation

### Voucher Management Interface
**File:** `views/partials/vouchers-sidebar.ejs`

Features:
- List all trip vouchers
- Status color-coding
- Value and expiry date display
- Add new voucher button
- Attachment status showing which items use voucher

### Voucher Editor
**File:** `views/partials/voucher-details-*.ejs`

Edit voucher details:
- Type selector
- Amount and currency
- Expiry date picker
- Notes field
- Status updates

### Item Integration
When editing flights/hotels:
- Voucher assignment interface appears
- Select voucher from trip's available vouchers
- Assign to specific passenger
- Update voucher status when item saved

---

## Business Logic

### Voucher Lifecycle

```
1. Create voucher
   ↓
2. Status: 'pending'
   ↓
3. Assign to flight/hotel/event
   ↓
4. Update status to 'used' (or 'partial')
   ↓
5. Track redemption on item
   ↓
6. Mark 'expired' if past expiryDate
```

### Redemption Tracking

Each attachment tracks:
- Which voucher used
- Which item (flight, hotel, etc.)
- Which passenger
- Status on that item (may differ from voucher status)

Example:
- Upgrade voucher created (status: pending)
- Attached to Flight A (statusOnItem: used)
- Attached to Flight B (statusOnItem: used)
- Voucher status becomes: used (exhausted)

### Expiry Handling

Automatic checks:
- Display "expired" badge if `expiryDate < today`
- Cannot create attachment for expired voucher
- Dashboard warning if voucher expiring soon

---

## Display Integration

### Trip View
Shows in trip sidebar:
- Pending vouchers available to use
- Used vouchers on each trip item
- Total value of active vouchers
- Expiry dates and warnings

### Calendar View
Vouchers displayed on calendar:
- Attached to specific item
- Passenger assignment shown
- Status indicated (used/pending/expired)

### Item Details
When viewing flight/hotel/event:
- All attached vouchers listed
- Redemption status shown
- Used value tracked per passenger

---

## Analytics & Reporting

### Tracking
- Total voucher value per trip
- Redemption percentage
- Expiry rate
- Unused voucher value
- Cost savings from voucher redemption

### Reports
Trip summary shows:
- "You used $X in vouchers"
- "You have $Y in unused vouchers"
- "Z vouchers expiring soon"

---

## Phase 1 Migration (Svelte)

### New Components
```
src/lib/components/
├── VoucherForm.svelte         # Create/edit voucher
├── VoucherList.svelte         # List vouchers
├── VoucherSelector.svelte     # Select for item assignment
├── VoucherAttachments.svelte  # Show attachments
└── VoucherStatus.svelte       # Status badge/display
```

### Svelte Implementation
```svelte
<script lang="ts">
  import { tripStore } from '$lib/stores/tripStore';
  import { apiClient } from '$lib/services/apiClient';

  let vouchers = [];
  let selectedVoucher = null;

  async function attachVoucher(voucherId, itemType, itemId) {
    const response = await apiClient.post(
      `/api/vouchers/${voucherId}/attach`,
      { itemType, itemId }
    );

    if (response.success) {
      // Update stores and UI
    }
  }
</script>
```

---

## Integration Examples

### Flight with Upgrade Voucher
1. User creates flight
2. User creates "Free upgrade to business" voucher
3. User edits flight, attaches upgrade voucher
4. Voucher status changes: pending → used
5. Flight display shows upgrade applied

### Hotel with Meal Credits
1. User creates hotel stay
2. User creates "$50 meal credit" voucher
3. During trip, user attaches voucher to hotel
4. Marks as "used"
5. Trip summary: "You redeemed $50 in meal credits"

---

## Validation Rules

- Description not empty
- Amount > 0
- Currency selected
- Type from valid list
- Expiry date > today (recommended)
- Status from valid values
- ItemType and itemId valid when attaching

---

## Related Documentation

- **[Travel Items](./README.md)** - Flights, hotels, events
- **[Companions](./COMPANIONS.md)** - Passenger assignment
- **[Trips](./TRIPS.md)** - Trip management

---

## Debugging

**Common Issues:**

1. **Voucher not showing in selector**
   - Check voucher status (may be expired)
   - Verify voucher tripId matches current trip
   - Check database for voucher record

2. **Attachment not saving**
   - Verify itemType is valid ('flight', 'hotel', etc.)
   - Check itemId exists in database
   - Verify voucherId exists

3. **Status not updating**
   - Refresh page after status change
   - Check browser console for errors
   - Verify update request is sent to server

---

**Last Updated:** 2025-12-17
**Status:** Fully implemented, Phase 1 migration planned
