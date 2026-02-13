# Design System Migration Guide

This guide shows how to migrate existing components to use the new UI component library.

## Quick Links

- **Design Tokens**: `frontend/src/lib/components/ui/tokens.css`
- **Component Barrel Export**: `frontend/src/lib/components/ui/index.ts`
- **Form Styles (old)**: `frontend/src/lib/styles/form-styles.css`

## Phase 5 Migration Patterns

### Pattern 1: Form Group (Label + Input + Error)

**OLD:**

```svelte
<div class="form-group">
  <label for="name">Name</label>
  <input id="name" type="text" bind:value={formData.name} />
  {#if error}
    <div class="error-text">{error}</div>
  {/if}
</div>
```

**NEW:**

```svelte
<script>
  import { FormGroup, Input } from '$lib/components/ui';
</script>

<FormGroup label="Name" error={error} id="name">
  <Input id="name" type="text" bind:value={formData.name} />
</FormGroup>
```

### Pattern 2: Form Row (Multiple Fields)

**OLD:**

```svelte
<div class="form-row cols-2">
  <div class="form-group">
    <label>From</label>
    <input type="date" bind:value={from} />
  </div>
  <div class="form-group">
    <label>To</label>
    <input type="date" bind:value={to} />
  </div>
</div>
```

**NEW:**

```svelte
<script>
  import { FormRow, FormGroup, Input } from '$lib/components/ui';
</script>

<FormRow columns={2}>
  <FormGroup label="From" id="from">
    <Input id="from" type="date" bind:value={from} />
  </FormGroup>
  <FormGroup label="To" id="to">
    <Input id="to" type="date" bind:value={to} />
  </FormGroup>
</FormRow>
```

### Pattern 3: Buttons

**OLD:**

```svelte
<button type="submit" class="submit-btn">Save</button>
<button type="button" on:click={onClose} class="cancel-btn">Cancel</button>
<button type="button" on:click={handleDelete} class="delete-btn">Delete</button>
```

**NEW:**

```svelte
<script>
  import { Button } from '$lib/components/ui';
</script>

<Button type="submit" variant="primary">Save</Button>
<Button type="button" variant="secondary" on:click={onClose}>Cancel</Button>
<Button type="button" variant="danger" on:click={handleDelete}>Delete</Button>
```

### Pattern 4: Card

**OLD:**

```svelte
<div class="card">
  <h3>{title}</h3>
  <p>{content}</p>
</div>
```

**NEW:**

```svelte
<script>
  import { Card } from '$lib/components/ui';
</script>

<Card padding="md" shadow="sm">
  <h3>{title}</h3>
  <p>{content}</p>
</Card>
```

### Pattern 5: Modal

**OLD:**

```svelte
{#if showModal}
  <div class="modal-overlay">
    <div class="modal-content">
      <h2>Title</h2>
      <!-- content -->
    </div>
  </div>
{/if}
```

**NEW:**

```svelte
<script>
  import { Modal } from '$lib/components/ui';
</script>

<Modal open={showModal} title="Title" size="md" onClose={() => showModal = false}>
  <!-- content -->
</Modal>
```

### Pattern 6: Alert

**OLD:**

```svelte
<div class="alert alert-success">
  <p>Success message</p>
</div>
```

**NEW:**

```svelte
<script>
  import { Alert } from '$lib/components/ui';
</script>

<Alert variant="success" dismissible>
  <div slot="content">Success message</div>
</Alert>
```

## Color Token Usage

All hardcoded colors should be replaced with CSS custom properties:

### Before (hardcoded colors):

```css
.my-component {
  background-color: #007bff; /* Bootstrap blue - remove */
  color: #111827; /* Black text */
  border-color: #d1d5db; /* Gray border */
}
```

### After (using tokens):

```css
.my-component {
  background-color: var(--color-primary); /* Uses #3b82f6 */
  color: var(--color-text-primary); /* Uses #111827 */
  border-color: var(--color-border); /* Uses #d1d5db */
}
```

## Component-Specific Migration

### ItemEditForm.svelte (HIGH PRIORITY)

This is the most-used form component. Migration steps:

1. Add imports at top:

   ```ts
   import { FormGroup, FormRow, Input, Button } from '$lib/components/ui';
   ```

2. Replace div-based form structure:
   - `<div class="form-row cols-N">` → `<FormRow columns={N}>`
   - `<div class="form-group">` → `<FormGroup>`
   - `<input>` → `<Input>`

3. Replace button styles:
   - `.submit-btn` → `variant="primary"`
   - `.cancel-btn` → `variant="secondary"`
   - `.delete-btn` → `variant="danger"`

### Example: Flight Form Section

**OLD:**

```svelte
<div class="form-row cols-2">
  <div class="form-group">
    <label for="departureDate">Departure Date</label>
    <input id="departureDate" type="date" bind:value={formData.departureDate} />
  </div>
  <div class="form-group">
    <label for="departureTime">Departure Time</label>
    <input id="departureTime" type="time" bind:value={formData.departureTime} />
  </div>
</div>
```

**NEW:**

```svelte
<FormRow columns={2}>
  <FormGroup label="Departure Date" id="departureDate">
    <Input id="departureDate" type="date" bind:value={formData.departureDate} />
  </FormGroup>
  <FormGroup label="Departure Time" id="departureTime">
    <Input id="departureTime" type="time" bind:value={formData.departureTime} />
  </FormGroup>
</FormRow>
```

## CSS Cleanup

After migration, remove deprecated styles from `form-styles.css`:

- `.submit-btn` - Use `<Button variant="primary">` instead
- `.cancel-btn` - Use `<Button variant="secondary">` instead
- `.delete-btn` - Use `<Button variant="danger">` instead
- `.form-group` - Use `<FormGroup>` component instead
- `.form-row` - Use `<FormRow>` component instead

## Gradual Rollout

Don't migrate everything at once. Follow this order:

1. **Phase 5A (HIGH)**: ItemEditForm.svelte - most-used form
2. **Phase 5B (HIGH)**: ItemCard.svelte - used on dashboard
3. **Phase 5C (MEDIUM)**: Sidebar.svelte, Loading.svelte - replace hardcoded colors
4. **Phase 5D (MEDIUM)**: Remaining form components (CompanionForm, VoucherForm, etc.)
5. **Phase 5E (LOW)**: Settings pages and other UI components

## Testing Checklist

After migrating each component:

- [ ] Component renders without errors
- [ ] All form fields are editable
- [ ] Form validation still works
- [ ] Buttons are clickable and styled correctly
- [ ] Mobile responsiveness is maintained (375px, 640px viewports)
- [ ] Desktop layout is correct (1024px+)
- [ ] Colors match Tailwind palette (no Bootstrap #007bff)

## Deprecation Timeline

**Old top-level components:**

- `Button.svelte` → Use `ui/Button.svelte`
- `Alert.svelte` → Use `ui/Alert.svelte`
- `Modal.svelte` → Use `ui/Modal.svelte`
- `Card.svelte` → Use `ui/Card.svelte`
- `Grid.svelte` → Use `ui/GridLayout.svelte`
- `Select.svelte` → Use `ui/Input` + native `<select>`
- `Checkbox.svelte` → Use `ui/Input` + native `<input type="checkbox">`

These will be marked `@deprecated` but remain functional during migration.

## Questions?

Refer to:

- `tokens.css` for available design tokens
- `index.ts` for component exports
- Individual component files for props and slots
