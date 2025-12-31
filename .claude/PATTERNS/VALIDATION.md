# ✔️ Validation Pattern

Data validation strategies across frontend and backend.

---

## Backend Validation (Server-Side)

### Express Validator Setup
**File:** `middleware/validation.js`

```javascript
const { body, validationResult } = require('express-validator');

// Reusable validators
const flightValidation = [
  body('airline').notEmpty().trim(),
  body('flightNumber').notEmpty().trim(),
  body('origin').isLength({ min: 3, max: 3 }),
  body('destination').isLength({ min: 3, max: 3 }),
  body('departureDateTime').isISO8601(),
  body('arrivalDateTime').isISO8601()
];

module.exports = { flightValidation };
```

### Using Validators in Routes
```javascript
router.post('/flights', flightValidation, flightController.create);
```

### Handling Validation Results
```javascript
async function create(req, res) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    if (req.get('X-Async-Request') === 'true') {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    } else {
      // Flash messages for form submission
      req.flash('error', 'Validation failed');
      return res.redirect('/trips');
    }
  }

  // Proceed with creation
}
```

### Validation Rules by Item Type

**Flights:**
- airline: required, string
- flightNumber: required, string
- origin/destination: required, 3-letter IATA code
- departureDateTime: required, ISO8601, before arrival
- arrivalDateTime: required, ISO8601, after departure

**Hotels:**
- name: required, string
- checkInDate: required, date
- checkOutDate: required, date, after checkIn
- city: required, string
- address: required, string

**Events:**
- title: required, string
- eventDate: required, date, within trip range
- location: required, string

---

## Frontend Validation (Client-Side)

### HTML5 Validation
```html
<input type="date" name="departureDate" required>
<input type="time" name="departureTime" required>
<input type="email" name="email" required>
<input type="number" name="cost" min="0" step="0.01">
```

### JavaScript Validation (Optional)
```javascript
function validateFlightForm(formData) {
  const errors = [];

  if (!formData.airline?.trim()) {
    errors.push('Airline is required');
  }

  if (!formData.origin?.trim()) {
    errors.push('Origin airport is required');
  }

  const departure = new Date(formData.departureDateTime);
  const arrival = new Date(formData.arrivalDateTime);

  if (departure >= arrival) {
    errors.push('Arrival must be after departure');
  }

  return errors;
}
```

### Error Display (No Alerts!)
```javascript
// BAD - Don't use alerts
if (!validateFlightForm(data)) {
  alert('Validation failed'); // ❌ NO!
  return;
}

// GOOD - Silent validation
const errors = validateFlightForm(data);
if (errors.length > 0) {
  // Silently fail or let backend handle
  return;
}
```

---

## Validation Flow

### Complete Flow
```
1. User fills form
2. HTML5 browser validation (optional)
3. User submits
4. JavaScript client validation (optional)
5. AJAX request sent to backend
6. Backend validation (REQUIRED)
7. If valid: process, return success
8. If invalid: return 400 with errors
9. Frontend receives response
10. Frontend handles silently
11. Form stays open for retry (if needed)
```

---

## Phase 1 Svelte Validation

### Reactive Validation
```svelte
<script lang="ts">
  let formData = {
    airline: '',
    flightNumber: '',
    origin: '',
    destination: ''
  };

  let errors = {};

  $: {
    errors = {};
    if (!formData.airline?.trim()) {
      errors.airline = 'Airline required';
    }
    if (!formData.origin?.trim()) {
      errors.origin = 'Origin required';
    }
  }

  async function handleSubmit() {
    const clientErrors = Object.keys(errors);
    if (clientErrors.length > 0) {
      return; // Don't submit
    }

    const response = await apiClient.post('/api/flights', formData);
    if (!response.ok) {
      errors = response.errors;
    }
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  <input bind:value={formData.airline} />
  {#if errors.airline}
    <span class="error">{errors.airline}</span>
  {/if}
</form>
```

---

## Custom Validation Functions

### IATA Code Validation
```javascript
function isValidIATACode(code) {
  return /^[A-Z]{3}$/.test(code);
}
```

### Date Range Validation
```javascript
function isDateWithinTrip(date, tripStart, tripEnd) {
  const d = new Date(date);
  return d >= tripStart && d <= tripEnd;
}
```

### Duration Validation
```javascript
function isValidDuration(departure, arrival) {
  const diff = new Date(arrival) - new Date(departure);
  const hours = diff / (1000 * 60 * 60);
  return hours > 0 && hours < 24; // Max 24 hours
}
```

---

## Best Practices

1. **Always validate on backend** - Never trust client
2. **Use express-validator** - Consistent validation rules
3. **Provide clear errors** - Tell user what's wrong (on backend)
4. **Sanitize input** - Clean/trim all strings
5. **Type checking** - Use TypeScript in Svelte
6. **Silent failures** - No alerts for validation errors
7. **Client-side helpers** - Improve UX without relying on validation

---

## Related Documentation

- **[CRUD Operations](./CRUD_OPERATIONS.md)** - Integration with CRUD
- **[Error Handling](./ERROR_HANDLING.md)** - Error response handling
- **[Form Handling](./FORM_HANDLING.md)** - Form patterns

---

**Last Updated:** 2025-12-17
