# 🎨 Frontend Architecture

Client-side code handling UI, interactions, and communication with backend.

---

## Quick Links

- **[JavaScript Modules](./JAVASCRIPT_MODULES.md)** - Module organization (coming)
- **[Form Handling](./FORM_HANDLING.md)** - Form patterns (coming)
- **[AJAX Patterns](./AJAX_PATTERNS.md)** - API communication (coming)
- **[Sidebar System](./SIDEBAR_SYSTEM.md)** - Three-sidebar layout (coming)
- **[Event Bus](./EVENT_BUS.md)** - Event patterns (coming)
- **[Date/Timezone](./DATE_TIMEZONE.md)** - Date handling (coming)

---

## Current State (Phase 1 Start)

**Technology:**

- **Templates:** EJS
- **JavaScript:** Vanilla JS
- **Styling:** Tailwind CSS
- **Build:** esbuild
- **State:** Global variables + jQuery-style DOM manipulation

### Current Frontend Files

```
public/
├── js/
│   ├── main.js                    # Global utilities
│   ├── maps.js                    # Map functionality (consolidated)
│   ├── companions.js              # Companion management (consolidated)
│   ├── sidebar-loader.js          # Sidebar AJAX loading
│   ├── async-form-handler.js      # Form submission
│   ├── trip-view-sidebar.js       # Trip-specific sidebar
│   ├── datetime-formatter.js      # Date/time formatting
│   ├── airport-autocomplete.js    # Flight form autocomplete
│   ├── calendar.js                # Calendar widget
│   ├── voucher-sidebar-manager.js # Voucher management
│   ├── trips-list.js              # Trip list utilities
│   └── ...
├── css/
│   ├── input.css                  # Tailwind input
│   └── style.css                  # Compiled output
└── dist/
    └── ...                        # Built/bundled files

views/
├── dashboard.ejs                  # Main dashboard
├── trips/
│   ├── trip-view.ejs              # Trip detail page
│   └── ...
└── partials/
    ├── flight-form.ejs            # Flight form component
    ├── hotel-form.ejs             # Hotel form component
    ├── event-form.ejs             # Event form component
    ├── sidebar-loader.ejs         # Sidebar wrapper
    └── ...
```

---

## Architecture

### Page Lifecycle

```
1. Server renders EJS template
   ↓
2. HTML sent to browser
   ↓
3. Browser parses HTML
   ↓
4. JavaScript files loaded
   ↓
5. Global functions initialized (window.*)
   ↓
6. Event listeners attached
   ↓
7. User interacts
   ↓
8. AJAX requests sent
   ↓
9. Response triggers DOM update
   ↓
10. Page updated without reload
```

### Request Flow (Forms)

```
User clicks "Save"
    ↓
setupAsyncFormSubmission() intercepts
    ↓
Collect form data
    ↓
Send POST with X-Async-Request header
    ↓
Backend processes
    ↓
Response { success: true }
    ↓
refreshTripView() updates sidebar
    ↓
UI reflects changes
```

---

## Global Functions (Window Exports)

### Sidebar Control

```javascript
loadSidebarContent(url, options);
closeSecondarySidebar();
openSecondarySidebar();
closeTertiarySidebar();
openTertiarySidebar();
goBackInSidebar();
```

### Item CRUD

```javascript
editItem(type, id);
showAddForm(type, isStandalone);
deleteItem(type, id, itemName);
showAddFormWithLayoverDates(type, arrivalDT, departureDT, tz);
```

### Form Handling

```javascript
setupAsyncFormSubmission(formId);
refreshTripView();
refreshDashboardSidebar();
```

### Maps

```javascript
initializeMap(tripData);
highlightMapMarker(id);
unhighlightMapMarker(id);
```

---

## Key Modules

### async-form-handler.js

Handles form submission without page reload.

```javascript
// 1. Intercept form submit
form.addEventListener('submit', handleFormSubmit);

// 2. Collect data
const data = new FormData(form);

// 3. Send AJAX
const response = await fetch(url, {
  method: 'POST',
  headers: { 'X-Async-Request': 'true' },
  body: JSON.stringify(Object.fromEntries(data)),
});

// 4. Update UI
if (response.ok) {
  refreshTripView();
}
```

### sidebar-loader.js

Loads content dynamically into sidebars.

```javascript
function loadSidebarContent(url, options = {}) {
  // 1. Fetch HTML
  const html = await fetch(url);

  // 2. Insert into sidebar
  document.querySelector('.sidebar-content').innerHTML = html;

  // 3. Execute scripts in loaded content
  executeLoadedScripts();
}
```

### datetime-formatter.js

Formats dates for display.

```javascript
// Display: "15 Oct 2025"
formatDate(date);

// Display: "14:30"
formatTime(date);

// Display: "15 Oct 2025, 14:30"
formatDateTime(date);
```

---

## Three-Sidebar Layout

### Visual

```
┌──────────────────────────────────────────┐
│  Primary     Secondary        Tertiary    │
│  (fixed)     (on-demand)      (on-demand) │
│  ┌────┐      ┌──────┐         ┌───────────┐
│  │    │      │      │         │           │
│  │    │      │      │         │           │
│  └────┘      └──────┘         └───────────┘
└──────────────────────────────────────────┘
```

### Behavior

- **Primary:** Always visible, fixed width
- **Secondary:** Opens on-demand, fixed width
- **Tertiary:** Opens on-demand, consumes remaining space
- **Closing:** Click outside closes both secondary and tertiary

### State Management

```javascript
// Global state
window.sidebarState = {
  secondaryOpen: false,
  tertiaryOpen: false,
  history: [], // For back navigation
};
```

---

## No Confirmation Pattern

**Important UX Decision:**

- No `alert()` or `confirm()` dialogs
- No success messages
- Operations execute immediately
- UI updates silently

```javascript
// ❌ WRONG
async function deleteItem(id) {
  if (!confirm('Delete?')) return; // No confirms!
  await fetch(`/item/${id}`, { method: 'DELETE' });
  alert('Deleted!'); // No alerts!
}

// ✅ RIGHT
async function deleteItem(id) {
  try {
    await fetch(`/item/${id}`, { method: 'DELETE' });
    refreshTripView(); // Silent update
  } catch (error) {
    // Silently fail
  }
}
```

---

## CSS Standards

### Tailwind

```html
<!-- Use utility classes -->
<div class="flex gap-4 p-2 bg-white rounded shadow">Content</div>
```

### Component Styles

```css
/* Use scoped styles in components -->
<style>
  .form-input {
    /* component-specific */
  }
</style>
```

### Color Scheme

- Primary: Bootstrap blue (#007bff)
- Danger: Bootstrap red (#dc3545)
- Success: Bootstrap green (#28a745)

---

## Phase 1 Migration (Svelte)

### What Changes

```
Before (EJS + Vanilla JS):
users/
├── dashboard.ejs
├── trip-form.ejs
└── async-form-handler.js

After (Svelte):
src/
├── routes/
│   ├── dashboard/
│   │   └── +page.svelte
│   └── trips/
│       ├── [id]/
│       │   └── +page.svelte
│       └── new/
│           └── +page.svelte
└── lib/
    └── components/
        ├── TripForm.svelte
        ├── FlightForm.svelte
        └── ...
```

### What Stays the Same

- API endpoints (Express backend unchanged)
- Database models
- Authentication
- CSS (Tailwind)

---

## Development Tips

### Debugging Frontend

**Step 1:** Open browser DevTools (F12)

- Console tab: JavaScript errors
- Network tab: API requests
- Application tab: Storage, cookies

**Step 2:** Check for errors

```javascript
// In console
window.tripId; // Check current context
window.tripData; // Check loaded data
typeof editItem; // Verify function exists
```

**Step 3:** Add logging

```javascript
console.log('Debug:', variable);
debugger; // Pauses execution
```

---

## Performance Considerations

### Bundle Size

- Minimize JavaScript
- Tree-shake unused code
- Lazy load on demand
- Compress images

### Page Load

- Cache static assets
- Optimize critical path
- Minimize HTTP requests
- Prefetch API data

### Runtime

- Debounce frequent events
- Cache API responses
- Use CSS animations (faster)
- Avoid layout thrashing

---

## Related Documentation

- **[AJAX Patterns](./AJAX_PATTERNS.md)** - API communication (coming)
- **[Form Handling](./FORM_HANDLING.md)** - Form patterns (coming)
- **[Sidebar System](./SIDEBAR_SYSTEM.md)** - Layout details (coming)
- **[Phase 1 Svelte Setup](../../MODERNIZATION/PHASE_1_SVELTE_SETUP.md)** - Migration details
- **[Components](../../COMPONENTS/README.md)** - Component library

---

**Last Updated:** 2025-12-17
**Current State:** EJS + Vanilla JS
**Phase 1 Target:** Svelte + SvelteKit
**Migration Start:** 2025-12-21 (estimated)
