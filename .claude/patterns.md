# Bluebonnet Patterns (Current)

Common architectural patterns used throughout the application.

---

## AJAX Form Submission Pattern

Used for all Create/Update/Delete operations without page reload.

### Backend Detection
```javascript
const isAsyncRequest = req.get('X-Async-Request') === 'true';

if (isAsyncRequest) {
  return res.json({ success: true, data: item });
} else {
  res.redirect(`/trips/${tripId}`); // Traditional redirect
}
```

### Frontend Handler (public/js/async-form-handler.js)
```javascript
function setupAsyncFormSubmission(formId) {
  const form = document.getElementById(formId);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Collect form data
    const data = new FormData(form);

    // 2. Combine date/time fields if present
    const body = Object.fromEntries(data);
    if (body.departureDate && body.departureTime) {
      body.departureDateTime = combineDateTime(body.departureDate, body.departureTime);
      delete body.departureDate;
      delete body.departureTime;
    }

    // 3. Send with X-Async-Request header
    const response = await fetch(form.action, {
      method: form.method,
      headers: {
        'X-Async-Request': 'true',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    // 4. On success, refresh UI
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        closeSecondarySidebar();
        refreshTripView(); // or refreshDashboardSidebar()
      }
    }
  });
}
```

### Use in EJS Form
```html
<form id="addFlightForm" action="/api/trips/<%= tripId %>/flights" method="POST">
  <input type="text" name="airline" placeholder="Airline">
  <input type="text" name="flightNumber" placeholder="Flight #">
  <input type="date" name="departureDate">
  <input type="time" name="departureTime">
  <!-- More fields -->
  <button type="submit">Add Flight</button>
</form>

<script>
  setupAsyncFormSubmission('addFlightForm');
</script>
```

---

## CRUD Pattern (All Item Types)

All travel items (Flight, Hotel, Event, CarRental, Transportation) follow identical pattern:

### 1. CREATE
**Backend:** `controllers/{itemType}Controller.js`
```javascript
exports.create = async (req, res) => {
  // 1. Validate trip ownership
  const trip = await Trip.findByPk(req.params.tripId);
  if (!trip || trip.userId !== req.user.id) {
    return res.status(403).json({ success: false });
  }

  // 2. Validate form data
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors });
  }

  // 3. Create item
  const item = await Flight.create({
    ...req.body,
    tripId: req.params.tripId,
    userId: req.user.id
  });

  // 4. Return based on request type
  const isAsyncRequest = req.get('X-Async-Request') === 'true';
  if (isAsyncRequest) {
    return res.json({ success: true, item });
  } else {
    return res.redirect(`/trips/${req.params.tripId}`);
  }
};
```

**Frontend:** Form template + async handler (see AJAX pattern above)

### 2. READ
**Backend:**
```javascript
exports.getAll = async (req, res) => {
  const items = await Flight.findAll({
    where: { tripId: req.params.tripId }
  });
  res.json({ success: true, items });
};

exports.getOne = async (req, res) => {
  const item = await Flight.findByPk(req.params.id);
  if (!item || item.userId !== req.user.id) {
    return res.status(403).json({ success: false });
  }
  res.json({ success: true, item });
};
```

**Frontend:** Display in trip sidebar, item cards with edit/delete buttons

### 3. UPDATE
**Backend:**
```javascript
exports.update = async (req, res) => {
  const item = await Flight.findByPk(req.params.id);
  if (!item || item.userId !== req.user.id) {
    return res.status(403).json({ success: false });
  }

  // Validate
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors });
  }

  // Update and return
  await item.update(req.body);

  const isAsyncRequest = req.get('X-Async-Request') === 'true';
  if (isAsyncRequest) {
    return res.json({ success: true, item });
  } else {
    return res.redirect(`/trips/${item.tripId}`);
  }
};
```

**Frontend:** Edit form (pre-populated) + async handler

### 4. DELETE
**Backend:**
```javascript
exports.delete = async (req, res) => {
  const item = await Flight.findByPk(req.params.id);
  if (!item || item.userId !== req.user.id) {
    return res.status(403).json({ success: false });
  }

  const tripId = item.tripId;
  await item.destroy();

  const isAsyncRequest = req.get('X-Async-Request') === 'true';
  if (isAsyncRequest) {
    return res.json({ success: true });
  } else {
    return res.redirect(`/trips/${tripId}`);
  }
};
```

**Frontend:**
```javascript
async function deleteItem(type, id, itemName) {
  try {
    const response = await fetch(`/api/${type}s/${id}`, {
      method: 'DELETE',
      headers: { 'X-Async-Request': 'true' }
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

### CRUD Pattern Summary
- **Always validate ownership** - `trip.userId !== req.user.id` OR `item.userId !== req.user.id`
- **Always check async header** - Different response types
- **Silent failures** - No confirm/alert dialogs
- **Cascade delete** - Deleting trip deletes all items

---

## Sidebar Navigation Pattern

**Three sidebars:** Primary (fixed), Secondary (on-demand), Tertiary (on-demand)

### Loading Content
```javascript
function loadSidebarContent(url, options = {}) {
  // 1. Fetch HTML from server
  const response = await fetch(url);
  const html = await response.text();

  // 2. Insert into secondary sidebar
  document.querySelector('.sidebar-content').innerHTML = html;

  // 3. Execute any scripts in loaded content
  const scripts = document.querySelectorAll('.sidebar-content script');
  scripts.forEach(script => eval(script.textContent));

  // 4. Track in history for back navigation
  sidebarHistory.push(url);
}
```

### Sidebar HTML Structure
```html
<div class="layout">
  <!-- Primary Sidebar (always visible) -->
  <div class="sidebar-primary">
    <!-- Trip list, nav items -->
  </div>

  <!-- Secondary Sidebar (on-demand) -->
  <div class="sidebar-secondary" id="secondarySidebar">
    <div class="sidebar-content">
      <!-- Dynamically loaded content -->
    </div>
  </div>

  <!-- Tertiary Sidebar (on-demand) -->
  <div class="sidebar-tertiary" id="tertiarySidebar">
    <!-- Maps, details, etc. -->
  </div>

  <!-- Main content -->
  <div class="main-content">
    <!-- Page content -->
  </div>
</div>
```

### Usage Pattern
```javascript
// Click "Edit Flight"
function editItem(type, id) {
  loadSidebarContent(`/api/trips/${tripId}/${type}s/${id}/edit`);
}

// Click "Add Flight"
function showAddForm(type) {
  loadSidebarContent(`/api/trips/${tripId}/${type}s/new`);
}

// Click "Back"
function goBackInSidebar() {
  sidebarHistory.pop();
  const previous = sidebarHistory[sidebarHistory.length - 1];
  loadSidebarContent(previous);
}

// Click outside sidebar
document.addEventListener('click', (e) => {
  if (!e.target.closest('.sidebar-secondary')) {
    closeSecondarySidebar();
  }
});
```

---

## Sidebar Refresh Pattern

After form submission, refresh sidebars with new data.

### Trip View Refresh
```javascript
async function refreshTripView() {
  // 1. Fetch updated data
  const response = await fetch(`/trips/${tripId}/api`);
  const data = await response.json();
  window.tripData = data;

  // 2. Fetch updated HTML
  const htmlResponse = await fetch(`/trips/${tripId}/sidebar`);
  const html = await htmlResponse.text();

  // 3. Update sidebar
  document.querySelector('.sidebar-content').innerHTML = html;

  // 4. Update map if present
  if (window.mapInstance) {
    updateMapMarkers(data);
  }
}
```

### Dashboard Refresh
```javascript
async function refreshDashboardSidebar() {
  // 1. Determine active tab
  const activeTab = document.querySelector('[data-active-tab]').dataset.activeTab;

  // 2. Fetch new HTML
  const htmlResponse = await fetch(`/dashboard/primary-sidebar?activeTab=${activeTab}`);
  const html = await htmlResponse.text();
  document.querySelector('.sidebar-content').innerHTML = html;

  // 3. Fetch data
  const dataResponse = await fetch(`/dashboard/api?activeTab=${activeTab}`);
  window.tripData = await dataResponse.json();

  // 4. Update map
  if (window.mapInstance) {
    updateMapMarkers(window.tripData);
  }
}
```

---

## No Confirmation Pattern

**Important UX Decision:**
- No `confirm()` dialogs
- No `alert()` messages
- Operations execute immediately
- UI updates silently

### Wrong Way ❌
```javascript
async function deleteItem(id) {
  if (!confirm('Delete this item?')) return;  // NO!
  await fetch(`/item/${id}`, { method: 'DELETE' });
  alert('Item deleted!');  // NO!
}
```

### Right Way ✅
```javascript
async function deleteItem(id) {
  try {
    const response = await fetch(`/item/${id}`, { method: 'DELETE' });
    if (response.ok) {
      refreshTripView(); // Silent update
    }
  } catch (error) {
    // Silent failure
  }
}
```

---

## Date/Time Handling Pattern

### Backend (Database)
- All dates stored as ISO strings in **UTC (GMT-0)**
- Timezone info stored separately in `originTimezone`, `destinationTimezone`
- Example: `2025-06-01T08:00:00Z` (UTC) + `originTimezone: "America/New_York"`

### Frontend (Display)
- Use `datetime-formatter.js` for timezone-aware display
- Display format: **"DD MMM YYYY"** (e.g., "15 Oct 2025")
- Time format: **"HH:MM"** 24-hour (e.g., "14:30")
- Never use AM/PM or seconds

### Form Submission
```javascript
// Form has separate date/time inputs
<input type="date" name="departureDate">
<input type="time" name="departureTime">

// Handler combines them
body.departureDate = "2025-06-01"
body.departureTime = "08:00"
↓
body.departureDateTime = "2025-06-01T08:00:00Z"  // ISO string
```

---

## Authorization Pattern

Always verify ownership before operations.

### Trip Ownership
```javascript
const trip = await Trip.findByPk(tripId);
if (!trip || trip.userId !== req.user.id) {
  return res.status(403).json({ success: false, error: 'Forbidden' });
}
```

### Item Ownership
```javascript
const item = await Flight.findByPk(id);
if (!item || item.userId !== req.user.id) {
  return res.status(403).json({ success: false, error: 'Forbidden' });
}
```

### Companion Permissions
```javascript
const companion = await TripCompanion.findOne({
  where: { tripId, companionId }
});

if (companion.canEdit) {
  // Allow edit
} else {
  // Deny edit
}
```

---

## Global Window Functions (Frontend)

Exposed for use in inline onclick handlers and event listeners:

**Sidebar Control:**
- `loadSidebarContent(url, options)` - Load content into sidebar
- `closeSecondarySidebar()` / `openSecondarySidebar()`
- `closeTertiarySidebar()` / `openTertiarySidebar()`
- `goBackInSidebar()`

**Item CRUD:**
- `editItem(type, id)` - Load edit form
- `showAddForm(type, isStandalone)` - Load add form
- `deleteItem(type, id, itemName)` - Delete item

**Refresh:**
- `refreshTripView()` - Refresh trip sidebar + map
- `refreshDashboardSidebar()` - Refresh dashboard + map

---

## Response Format Pattern

### Success Response (AJAX)
```javascript
res.json({
  success: true,
  item: { id, airline, flightNumber, ... },
  message: "optional message" // rarely used
})
```

### Error Response (AJAX)
```javascript
res.status(400).json({
  success: false,
  error: "Validation failed",
  errors: [{ field: "airline", message: "Required" }]  // optional
})
```

### Unauthorized Response
```javascript
res.status(403).json({
  success: false,
  error: "Unauthorized"
})
```

### Server Error Response
```javascript
res.status(500).json({
  success: false,
  error: "Server error"
})
```

---

## Related Docs

- **Context:** See `context.md` for stack/architecture
- **Features:** See `features.md` for feature matrix
- **Development:** See `development-quick-ref.md` for commands
- **Detailed:** See `.claude/ARCHITECTURE/BACKEND/README.md` or `FRONTEND/README.md`

---

**Last Updated:** 2025-12-18
**Version:** 1.0 (Consolidated from CRUD_OPERATIONS.md + ARCHITECTURE/FRONTEND/README.md)
**Size:** ~3.5 KB (vs 15+ KB original)
