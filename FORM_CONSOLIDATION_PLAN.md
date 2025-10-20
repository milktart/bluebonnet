# Form Consolidation - Implementation Plan

## Current Status

### ✅ Completed
1. Created 5 unified form partials for modal context:
   - `/views/partials/flight-form.ejs` - Fully updated for both modal and sidebar
   - `/views/partials/hotel-form.ejs` - Created (modal only)
   - `/views/partials/transportation-form.ejs` - Created (modal only)
   - `/views/partials/car-rental-form.ejs` - Created (modal only)
   - `/views/partials/event-form.ejs` - Created (modal only)

2. Updated modal container files:
   - `/views/partials/trip-modals.ejs` - Now uses form partial includes (106 lines, down from ~490)
   - `/views/partials/trip-edit-modals.ejs` - Now uses form partial includes (106 lines, down from ~410)

3. Fixed map hover error:
   - `/public/js/trip-view-map.js` - Added defensive checks and error handling

### ⏳ Remaining Work

## Phase 1: Update Remaining Form Partials (4 files)

### Files to Modify:
1. `views/partials/hotel-form.ejs`
2. `views/partials/transportation-form.ejs`
3. `views/partials/car-rental-form.ejs`
4. `views/partials/event-form.ejs`

### For Each File, Apply These Changes:

**Step 1: Add isModal parameter**
```ejs
<%
  const isAddMode = !isEditing;
  const isModalContext = isModal !== false; // Add this line
  // ... rest of variables
%>
```

**Step 2: Conditionally wrap modal markup**
```ejs
<% if (isModalContext) { %>
<div class="modal fade" id="<%= modalId %>" tabindex="-1">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <!-- modal header content -->
      </div>
<% } else { %>
<div class="sidebar-form-container">
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center">
      <button onclick="closeSecondarySidebar()" class="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors mr-3">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      <h2 class="text-lg font-bold text-gray-900"><!-- title here --></h2>
    </div>
  </div>
<% } %>
```

**Step 3: Update form class**
```ejs
<form id="<%= formId %>" method="<%= formMethod %>" action="<%= formAction %>" class="<%= isModalContext ? '' : 'space-y-4' %>">
```

**Step 4: Conditionally wrap body and footer**
```ejs
<div class="<%= isModalContext ? 'modal-body' : '' %>">
  <!-- form fields -->
</div>

<div class="<%= isModalContext ? 'modal-footer' : 'flex space-x-3 pt-4 border-t border-gray-200' %>">
  <% if (isModalContext) { %>
    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
    <button type="submit" class="btn btn-primary"><!-- text --></button>
  <% } else { %>
    <button type="submit" class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm font-medium"><!-- text --></button>
    <button type="button" onclick="closeSecondarySidebar()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-sm font-medium">Cancel</button>
  <% } %>
</div>
```

**Step 5: Close divs conditionally**
```ejs
<% if (isModalContext) { %>
    </div>
  </div>
</div>
<% } else { %>
</div>
<% } %>
```

---

## Phase 2: Add Backend Form Endpoints (5 files)

### Files to Modify:
1. `controllers/flightController.js`
2. `controllers/hotelController.js`
3. `controllers/transportationController.js`
4. `controllers/carRentalController.js`
5. `controllers/eventController.js`

### For Each Controller, Add Two Methods:

**Example for flightController.js:**

```javascript
// Add this after deleteFlight method:

exports.getAddForm = async (req, res) => {
  try {
    const { tripId } = req.params;

    // Verify trip ownership
    const trip = await Trip.findByPk(tripId);
    if (!trip || trip.userId !== req.user.id) {
      return res.status(403).send('Unauthorized');
    }

    // Render form partial for sidebar (not modal)
    res.render('partials/flight-form', {
      tripId: tripId,
      isEditing: false,
      data: null,
      isModal: false  // This is the key - tells partial to render for sidebar
    });
  } catch (error) {
    console.error('Error fetching add form:', error);
    res.status(500).send('Error loading form');
  }
};

exports.getEditForm = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the flight
    const flight = await Flight.findByPk(id, {
      include: [{ model: Trip, as: 'trip', required: false }]
    });

    // Verify ownership
    if (!flight || flight.userId !== req.user.id) {
      return res.status(403).send('Unauthorized');
    }

    // Format dates for input fields
    const formatDateForInput = (date) => {
      if (!date) return '';
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const formatTimeForInput = (date) => {
      if (!date) return '';
      const d = new Date(date);
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    const departureDate = formatDateForInput(flight.departureDateTime);
    const departureTime = formatTimeForInput(flight.departureDateTime);
    const arrivalDate = formatDateForInput(flight.arrivalDateTime);
    const arrivalTime = formatTimeForInput(flight.arrivalDateTime);

    // Render form partial for sidebar (not modal)
    res.render('partials/flight-form', {
      tripId: flight.tripId,
      isEditing: true,
      data: {
        ...flight.toJSON(),
        departureDate,
        departureTime,
        arrivalDate,
        arrivalTime
      },
      isModal: false  // This is the key - tells partial to render for sidebar
    });
  } catch (error) {
    console.error('Error fetching edit form:', error);
    res.status(500).send('Error loading form');
  }
};
```

**Repeat for:** hotelController.js, transportationController.js, carRentalController.js, eventController.js
- Same pattern but adjust field names based on resource type
- Use appropriate model (Hotel, Transportation, CarRental, Event)
- Format date/time fields appropriately for each resource type

---

## Phase 3: Add Routes (5 files)

### Files to Modify:
1. `routes/flights.js`
2. `routes/hotels.js`
3. `routes/transportation.js`
4. `routes/car-rentals.js`
5. `routes/events.js`

### For Each Route File, Add Two Lines:

**Example for routes/flights.js:**
```javascript
// Add these two lines (typically near the top with other GET routes):
router.get('/trips/:tripId/form', flightController.getAddForm);
router.get('/:id/form', flightController.getEditForm);
```

**For each file:**
- flights.js: `/flights/trips/:tripId/form` and `/flights/:id/form`
- hotels.js: `/hotels/trips/:tripId/form` and `/hotels/:id/form`
- transportation.js: `/transportation/trips/:tripId/form` and `/transportation/:id/form`
- car-rentals.js: `/car-rentals/trips/:tripId/form` and `/car-rentals/:id/form`
- events.js: `/events/trips/:tripId/form` and `/events/:id/form`

---

## Phase 4: Replace Form Generation in trip.ejs

### File to Modify:
`views/trips/trip.ejs`

### What to Do:

**Find and Replace:** Functions `createFlightEditForm()`, `createHotelEditForm()`, `createTransportationEditForm()`, `createCarRentalEditForm()`, `createEventEditForm()` (lines ~498-941)

**Replace with:** A single async wrapper function that fetches the appropriate form

**Find and Replace:** Functions `createFlightAddForm()`, `createHotelAddForm()`, `createTransportationAddForm()`, `createCarRentalAddForm()`, `createEventAddForm()` (lines ~945-1393)

**Replace with:** Updated `showAddForm()` function that fetches forms via AJAX

---

## Phase 5: Update JavaScript Sidebar Logic

### File to Modify:
`public/js/trip-view-sidebar.js`

### Changes Needed:

**Update `editItem()` function** (currently lines 33-77):
```javascript
function editItem(type, id) {
  openEditSidebar();

  const formContainer = document.getElementById('secondary-sidebar-content');
  if (!formContainer) return;

  // Instead of generating form, fetch it
  fetch(`/${type}s/${id}/form`)  // or appropriate endpoint
    .then(response => response.text())
    .then(html => {
      formContainer.innerHTML = html;
      // Re-initialize handlers
      initFlightDateTimePickers();
      if (type === 'flight' || type === 'transportation') {
        initAirportSearch();
      }
    })
    .catch(error => console.error('Error loading form:', error));
}
```

**Update `showAddForm()` function** (currently lines 79-111):
```javascript
function showAddForm(type) {
  const formContainer = document.getElementById('secondary-sidebar-content');
  if (!formContainer) return;

  closeEditSidebar();
  openEditSidebar();

  // Instead of generating form, fetch it
  const endpoint = `/${pluralize(type)}/trips/${tripId}/form`;
  fetch(endpoint)
    .then(response => response.text())
    .then(html => {
      formContainer.innerHTML = html;
      // Re-initialize handlers
      initFlightDateTimePickers();
      if (type === 'flight' || type === 'transportation') {
        initAirportSearch();
      }
    })
    .catch(error => console.error('Error loading form:', error));
}
```

---

## Phase 6: Testing Checklist

After all changes are complete, test:

**Modal Flows:**
- [ ] Add Flight modal opens and submits correctly
- [ ] Edit Flight modal opens with pre-populated data
- [ ] Add Hotel modal opens and submits correctly
- [ ] Edit Hotel modal opens with pre-populated data
- [ ] Add Transportation modal opens and submits correctly
- [ ] Edit Transportation modal opens with pre-populated data
- [ ] Add Car Rental modal opens and submits correctly
- [ ] Edit Car Rental modal opens with pre-populated data
- [ ] Add Event modal opens and submits correctly
- [ ] Edit Event modal opens with pre-populated data
- [ ] Delete Flight modal works
- [ ] Delete Event modal works

**Sidebar Flows (Secondary Sidebar):**
- [ ] Click edit on timeline item → sidebar loads edit form
- [ ] Edit form submits correctly
- [ ] Cancel button closes sidebar
- [ ] Click add items menu → add forms available
- [ ] Add form submits correctly
- [ ] Form-specific features work:
  - [ ] Flight: Airport search autocomplete
  - [ ] Hotel: Date validation
  - [ ] Transportation: Airport search autocomplete
  - [ ] Event: All-day toggle

**General:**
- [ ] No console errors when hovering over timeline items
- [ ] Map refreshes correctly after adding/editing items
- [ ] Form field IDs work correctly with date pickers
- [ ] Validation works on both add and edit forms

---

## Code Reduction Summary

| File | Before | After | Reduction |
|------|--------|-------|-----------|
| trip-modals.ejs | ~490 lines | 106 lines | 78% |
| trip-edit-modals.ejs | ~410 lines | 106 lines | 74% |
| trip.ejs | ~1400 lines (forms) | ~500 lines | 64% |
| **Total** | **~2300 lines** | **~612 lines** | **73%** |

---

## Notes

- All changes maintain backward compatibility with existing functionality
- No database migrations needed
- All existing validation and business logic remains the same
- Forms will work in both modal and sidebar contexts
- Date formatting and timezone handling preserved
- Airport search and autocomplete features preserved
- Delete functionality for flights and events preserved
