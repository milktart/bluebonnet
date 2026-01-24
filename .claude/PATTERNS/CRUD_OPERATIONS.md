# 🔄 CRUD Operations Pattern

Standard Create-Read-Update-Delete operations across all trip items.

---

## Pattern Overview

All trip items (Flights, Hotels, Events, CarRentals, Transportation) follow identical CRUD patterns for consistency.

---

## CREATE Operation

### Backend (Controller)

**File:** `controllers/{itemType}Controller.js`

```javascript
async function create(req, res) {
  try {
    const { tripId } = req.params;
    const { userId } = req.user;

    // Validate trip exists and user owns it
    const trip = await Trip.findByPk(tripId);
    if (!trip || trip.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    // Validate form data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Create item
    const item = await Flight.create({
      ...req.body,
      tripId,
      userId,
    });

    // Return based on request type
    const isAsyncRequest = req.get('X-Async-Request') === 'true';
    if (isAsyncRequest) {
      return res.json({ success: true, item });
    } else {
      return res.redirect(`/trips/${tripId}`);
    }
  } catch (error) {
    logger.error('Create error:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
}
```

### Frontend (Form)

**File:** `views/partials/{itemType}-form.ejs`

```html
<form id="add{ItemType}Form" action="/api/trips/<%= tripId %>/{items}" method="POST">
  <!-- Form fields -->
  <button type="submit">Add {ItemType}</button>
</form>

<script>
  setupAsyncFormSubmission('add{ItemType}Form');
</script>
```

### JavaScript Handler

**File:** `public/js/async-form-handler.js`

```javascript
function setupAsyncFormSubmission(formId) {
  const form = document.getElementById(formId);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const body = Object.fromEntries(data);

    // Combine date/time fields
    if (body.departureDate && body.departureTime) {
      body.departureDateTime = combineDateTime(body.departureDate, body.departureTime);
      delete body.departureDate;
      delete body.departureTime;
    }

    const response = await fetch(form.action, {
      method: 'POST',
      headers: {
        'X-Async-Request': 'true',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        refreshTripView();
        closeSecondarySidebar();
      }
    }
  });
}
```

---

## READ Operation

### Backend (Controller)

```javascript
async function getAll(req, res) {
  const { tripId } = req.params;
  const { userId } = req.user;

  const trip = await Trip.findByPk(tripId);
  if (!trip || trip.userId !== userId) {
    return res.status(403).json({ success: false });
  }

  const items = await Flight.findAll({
    where: { tripId },
  });

  return res.json({ success: true, items });
}

async function getOne(req, res) {
  const { id } = req.params;
  const item = await Flight.findByPk(id);

  if (!item || item.userId !== req.user.userId) {
    return res.status(403).json({ success: false });
  }

  return res.json({ success: true, item });
}
```

### Frontend (Display)

```html
<!-- In trip sidebar -->
<div class="items-list">
  <% trips.flights.forEach(flight => { %>
  <div class="item-card">
    <h3><%= flight.airline %> <%= flight.flightNumber %></h3>
    <p><%= flight.origin %> → <%= flight.destination %></p>
    <p><%= formatDate(flight.departureDateTime) %></p>
    <button onclick="editItem('flight', '<%= flight.id %>')">Edit</button>
    <button onclick="deleteItem('flight', '<%= flight.id %>')">Delete</button>
  </div>
  <% }); %>
</div>
```

---

## UPDATE Operation

### Backend (Controller)

```javascript
async function update(req, res) {
  const { id } = req.params;
  const { userId } = req.user;

  const item = await Flight.findByPk(id);
  if (!item || item.userId !== userId) {
    return res.status(403).json({ success: false });
  }

  // Validate
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  // Update
  await item.update(req.body);

  const isAsyncRequest = req.get('X-Async-Request') === 'true';
  if (isAsyncRequest) {
    return res.json({ success: true, item });
  } else {
    return res.redirect(`/trips/${item.tripId}`);
  }
}
```

### Frontend (Edit Form)

```html
<form id="edit{ItemType}Form" action="/api/{items}/<%= item.id %>" method="PUT">
  <!-- Form fields pre-populated with item data -->
  <button type="submit">Update {ItemType}</button>
</form>
```

---

## DELETE Operation

### Backend (Controller)

```javascript
async function delete(req, res) {
  const { id } = req.params;
  const { userId } = req.user;

  const item = await Flight.findByPk(id);
  if (!item || item.userId !== userId) {
    return res.status(403).json({ success: false });
  }

  await item.destroy();

  const isAsyncRequest = req.get('X-Async-Request') === 'true';
  if (isAsyncRequest) {
    return res.json({ success: true });
  } else {
    return res.redirect(`/trips/${item.tripId}`);
  }
}
```

### Frontend (Delete Trigger)

```javascript
// In public/js/async-form-handler.js
async function deleteItem(type, id, itemName) {
  try {
    const response = await fetch(`/api/${type}s/${id}`, {
      method: 'DELETE',
      headers: { 'X-Async-Request': 'true' },
    });

    if (response.ok) {
      closeSecondarySidebar();
      refreshTripView();
    }
  } catch (error) {
    // Silently fail
  }
}
```

---

## Request/Response Flow

### Successful CRUD

```
1. User action (click Add/Edit/Delete)
2. Form loads via AJAX (for edit) or displayed inline (for add)
3. User fills form and submits
4. JavaScript intercepts submit
5. Form data serialized to JSON
6. AJAX POST/PUT/DELETE sent with X-Async-Request header
7. Backend validates, performs operation, returns JSON
8. Frontend receives { success: true, item: {...} }
9. Frontend calls refreshTripView()
10. Sidebar/map updated silently
11. User sees changes reflected
```

### Error Handling

```
If validation fails:
- Backend returns 400 with errors
- Frontend silently handles (no alert)
- Form stays open for retry

If item not found:
- Backend returns 404
- Frontend silently closes form
- Sidebar refreshed anyway

If permission denied:
- Backend returns 403
- Frontend silently fails
- No error shown to user
```

---

## Pattern Consistency

### All Item Types Follow Same Pattern

- `Flight`, `Hotel`, `Event`, `CarRental`, `Transportation`
- Same controller structure
- Same route signatures
- Same form pattern
- Same async handler

### Variations by Type

- Form fields vary by item type
- Validation rules differ
- Display format differs
- But CRUD flow identical

---

## Key Principles

1. **Always validate on backend** - Never trust client data
2. **Check ownership** - Verify user owns trip/item
3. **Support both sync and async** - Check X-Async-Request header
4. **Silent failures** - No alerts on error
5. **Consistent naming** - Same field names across types
6. **Cascade delete** - Deleting trip deletes all items
7. **Timestamps** - Auto-managed by Sequelize

---

## Related Documentation

- **[AJAX Patterns](./AJAX_PATTERNS.md)** - AJAX request patterns
- **[Form Handling](./FORM_HANDLING.md)** - Form submission details
- **[Error Handling](./ERROR_HANDLING.md)** - Error handling strategy

---

**Last Updated:** 2025-12-17
