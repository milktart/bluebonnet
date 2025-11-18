## Event Delegation Pattern

**Phase 4 - Frontend Modernization**

### Overview

Replaced 145+ inline event handlers (`onclick`, `onchange`, etc.) with a centralized event delegation system using data attributes.

**Benefits:**

- ✅ No global function pollution
- ✅ Better security (CSP-friendly - no inline scripts)
- ✅ Works with dynamically loaded content
- ✅ Easier to maintain and test
- ✅ Cleaner HTML

### How It Works

Instead of inline event handlers:

```html
<!-- OLD WAY - Inline handler -->
<button onclick="deleteItem('123')">Delete</button>
```

Use data attributes:

```html
<!-- NEW WAY - Data attributes -->
<button data-action="deleteItem" data-id="123">Delete</button>
```

The event delegation system:

1. Sets up document-level listeners for click, change, submit, mouseover, mouseout
2. Uses `event.target.closest('[data-action]')` to find the triggered element
3. Looks up the registered handler for that action
4. Calls the handler with the element and event

### File Structure

```
public/js/
├── event-delegation.js      # Core event delegation system
├── common-handlers.js        # Common UI interaction handlers
└── entries/
    └── common.js            # Initializes event delegation
```

### Usage

#### 1. Basic Click Handler

```html
<button data-action="dismissAlert" data-target="alert-id">×</button>
```

```javascript
// Register the handler
import { registerHandler } from './event-delegation.js';

registerHandler('dismissAlert', (element, event) => {
  const targetId = element.getAttribute('data-target');
  document.getElementById(targetId)?.remove();
});
```

#### 2. Data Attributes Available

| Attribute           | Purpose                       | Example                                      |
| ------------------- | ----------------------------- | -------------------------------------------- |
| `data-action`       | Action name for click events  | `data-action="deleteItem"`                   |
| `data-on-change`    | Action name for change events | `data-on-change="filterResults"`             |
| `data-on-submit`    | Action name for form submit   | `data-on-submit="saveForm"`                  |
| `data-on-hover`     | Action name for mouseover     | `data-on-hover="showPreview"`                |
| `data-on-hover-end` | Action name for mouseout      | `data-on-hover-end="hidePreview"`            |
| `data-*`            | Custom data                   | `data-id="123" data-confirm="Are you sure?"` |

#### 3. Helper Attributes

| Attribute               | Purpose                        |
| ----------------------- | ------------------------------ |
| `data-allow-default`    | Don't prevent default behavior |
| `data-stop-propagation` | Stop event bubbling            |

#### 4. Getting Element Data

Use the `getElementData()` helper to extract all data attributes:

```javascript
import { getElementData } from './event-delegation.js';

registerHandler('deleteItem', (element) => {
  const data = getElementData(element);
  // data = { action: 'deleteItem', id: '123', confirm: 'Are you sure?' }

  if (confirm(data.confirm)) {
    deleteItem(data.id);
  }
});
```

### Common Handlers (Already Registered)

These handlers are available immediately:

#### `dismissAlert`

Dismisses an alert/notification with fade animation.

```html
<button data-action="dismissAlert" data-target="alert-id">×</button>
```

#### `toggleVisibility`

Toggles element visibility.

```html
<button data-action="toggleVisibility" data-target="element-id">Toggle</button>
```

#### `navigate`

Navigates to a URL.

```html
<button data-action="navigate" data-url="/path">Go</button>
```

#### `confirmNavigate`

Confirms before navigating.

```html
<button data-action="confirmNavigate" data-url="/delete" data-confirm="Delete this?">Delete</button>
```

#### `copyToClipboard`

Copies text to clipboard.

```html
<button data-action="copyToClipboard" data-text="Text to copy">Copy</button>
```

#### `stopPropagation`

Stops event from bubbling.

```html
<div data-action="stopPropagation">Content</div>
```

### Migration Guide

#### Step 1: Identify Inline Handlers

Find all inline handlers in your file:

```bash
grep -n "onclick\|onchange\|onsubmit" your-file.ejs
```

#### Step 2: Convert to Data Attributes

**Simple function call:**

```html
<!-- Before -->
<button onclick="openModal()">Open</button>

<!-- After -->
<button data-action="openModal">Open</button>
```

**Function with single parameter:**

```html
<!-- Before -->
<button onclick="deleteItem('123')">Delete</button>

<!-- After -->
<button data-action="deleteItem" data-id="123">Delete</button>
```

**Function with multiple parameters:**

```html
<!-- Before -->
<button onclick="updateStatus('123', 'active', true)">Update</button>

<!-- After -->
<button data-action="updateStatus" data-id="123" data-status="active" data-confirm="true">
  Update
</button>
```

**Inline JavaScript:**

```html
<!-- Before -->
<button onclick="document.getElementById('modal').remove()">Close</button>

<!-- After -->
<button data-action="dismissAlert" data-target="modal">Close</button>
```

#### Step 3: Register Handler

Create or update a handler file (e.g., `public/js/trip-handlers.js`):

```javascript
import { registerHandlers, getElementData } from './event-delegation.js';

function deleteItem(element) {
  const { id } = getElementData(element);

  if (confirm('Delete this item?')) {
    fetch(`/api/items/${id}`, { method: 'DELETE' }).then(() => location.reload());
  }
}

function updateStatus(element) {
  const { id, status, confirm } = getElementData(element);

  if (confirm === 'true' && !window.confirm('Update status?')) {
    return;
  }

  fetch(`/api/items/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  }).then(() => location.reload());
}

// Register all handlers at once
registerHandlers({
  deleteItem,
  updateStatus,
  openModal,
});
```

#### Step 4: Import in Bundle

Add to the appropriate entry point:

```javascript
// public/js/entries/trip-view.js
import '../trip-handlers.js'; // Registers handlers
```

### Examples

#### Example 1: Flash Messages (Completed)

**Before:**

```html
<button onclick="document.getElementById('success-alert').remove()">×</button>
```

**After:**

```html
<button data-action="dismissAlert" data-target="success-alert">×</button>
```

Handler already registered in `common-handlers.js`.

#### Example 2: Trip Companion Management

**Before:**

```html
<button onclick="removeCompanionFromTrip('123', this)">Remove</button>
```

**After:**

```html
<button data-action="removeCompanion" data-id="123">Remove</button>
```

**Handler:**

```javascript
function removeCompanion(element) {
  const { id } = getElementData(element);

  if (confirm('Remove this companion?')) {
    // Remove logic here
    element.closest('.companion-item').remove();
  }
}

registerHandler('removeCompanion', removeCompanion);
```

#### Example 3: Form Select Change

**Before:**

```html
<select onchange="filterVouchers()">
  <option value="all">All</option>
  <option value="active">Active</option>
</select>
```

**After:**

```html
<select data-on-change="filterVouchers">
  <option value="all">All</option>
  <option value="active">Active</option>
</select>
```

**Handler:**

```javascript
function filterVouchers(element) {
  const status = element.value;
  // Filter logic here
}

registerHandler('filterVouchers', filterVouchers);
```

#### Example 4: Hover Effects

**Before:**

```html
<div onmouseover="highlightMapMarker('123')" onmouseout="unhighlightMapMarker('123')">
  Flight 123
</div>
```

**After:**

```html
<div
  data-on-hover="highlightMapMarker"
  data-on-hover-end="unhighlightMapMarker"
  data-marker-id="123"
>
  Flight 123
</div>
```

**Handlers:**

```javascript
function highlightMapMarker(element) {
  const { markerId } = getElementData(element);
  // Highlight logic
}

function unhighlightMapMarker(element) {
  const { markerId } = getElementData(element);
  // Unhighlight logic
}

registerHandlers({
  highlightMapMarker,
  unhighlightMapMarker,
});
```

### Testing

After converting handlers:

1. **Rebuild bundles:**

   ```bash
   npm run build-js
   ```

2. **Test in browser:**
   - Click converted buttons/links
   - Check browser console for errors
   - Verify `✅ Event delegation initialized` appears
   - Verify `✅ Common event handlers registered` appears

3. **Check for issues:**
   - Look for `No handler registered for action: X` warnings
   - Ensure data attributes are correct
   - Verify handlers are imported in the bundle

### Progress Tracking

Files converted: 1/145

- ✅ `views/partials/flash.ejs` (3 handlers)

Files remaining:

- ⏳ `views/trips/dashboard.ejs` (26 handlers)
- ⏳ `views/account/vouchers.ejs` (17 handlers)
- ⏳ `views/trips/trip.ejs` (16 handlers)
- ⏳ And 30+ more files...

### API Reference

#### `registerHandler(action, handler)`

Register a single event handler.

```javascript
registerHandler('myAction', (element, event) => {
  // Handler logic
});
```

#### `registerHandlers(handlers)`

Register multiple handlers at once.

```javascript
registerHandlers({
  action1: handler1,
  action2: handler2,
});
```

#### `getElementData(element)`

Extract all data attributes from an element.

```javascript
const data = getElementData(element);
// Returns: { action: 'delete', id: '123', ... }
```

#### `initializeEventDelegation()`

Initialize the delegation system (called automatically in common.js).

### Troubleshooting

**Handler not firing:**

- Check that event delegation is initialized (`✅ Event delegation initialized`)
- Verify handler is registered before DOM interaction
- Check data-action attribute is spelled correctly

**Data not available:**

- Use `getElementData()` to extract data attributes
- Ensure data attributes use kebab-case (`data-user-id` not `data-userId`)
- Check browser DevTools → Elements to verify attributes

**Console warnings:**

- `No handler registered for action: X` - Handler not registered or typo
- Ensure handler file is imported in the bundle entry point

### Best Practices

1. **Use semantic action names**: `deleteItem` not `click1`
2. **Keep handlers pure**: Don't rely on global state
3. **Use data attributes for parameters**: Avoid hardcoding values
4. **Confirm destructive actions**: Use `data-confirm` attribute
5. **Group related handlers**: One file per feature (e.g., `trip-handlers.js`)

### Next Steps

1. Convert remaining files (prioritize high-traffic pages)
2. Remove unused global functions after conversion
3. Add CSP headers to prevent inline scripts
4. Consider adding TypeScript for better type safety

### References

- [MDN: Event Delegation](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#event_delegation)
- [MDN: Data Attributes](https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes)
