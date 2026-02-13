# Bluebonnet UI Component Library

A unified, token-based design system for the Bluebonnet application. Built on Tailwind palette with CSS custom properties for consistency across all components.

## Quick Start

```svelte
<script>
  import { Button, FormGroup, Input, Card } from '$lib/components/ui';
</script>

<Card padding="md">
  <FormGroup label="Email" id="email">
    <Input id="email" type="email" bind:value={email} />
  </FormGroup>
  <Button type="submit" variant="primary">Submit</Button>
</Card>
```

## File Structure

```
src/lib/components/ui/
├── tokens.css                 # Design tokens (colors, typography, spacing, shadows, radius)
├── index.ts                  # Barrel exports (import { Button } from '$lib/components/ui')
├── MIGRATION_GUIDE.md        # How to migrate existing components
├── README.md                 # This file
│
├── Stack.svelte              # Vertical flex layout
├── Inline.svelte             # Horizontal flex layout
├── GridLayout.svelte         # CSS Grid layout (1-4 columns)
│
├── FormGroup.svelte          # Label + input + error wrapper
├── FormRow.svelte            # Multi-column form row
├── Input.svelte              # Text/email/date/time/number input
├── TextArea.svelte           # Multi-line text input
│
├── Button.svelte             # Consolidated button (primary/secondary/danger/success/ghost)
├── Modal.svelte              # Fixed z-index modal with title & close button
├── Alert.svelte              # Contextual alerts (success/error/warning/info)
├── Card.svelte               # Flexible card container
└── Badge.svelte              # Item type/status badges
```

## Design Tokens

All tokens are CSS custom properties defined in `tokens.css` and available everywhere in the app.

### Colors

**Primary** (Tailwind Blue, NOT Bootstrap)

- `--color-primary: #3b82f6`
- `--color-primary-hover: #2563eb`
- `--color-primary-active: #1d4ed8`
- `--color-primary-light: #dbeafe`
- `--color-primary-bg: #eff6ff`

**Status**

- `--color-success: #10b981` (green)
- `--color-warning: #f59e0b` (amber)
- `--color-error: #ef4444` (red)
- `--color-info: #3b82f6` (blue, alias for primary)

**Text**

- `--color-text-primary: #111827` (dark gray)
- `--color-text-secondary: #6b7280` (medium gray)
- `--color-text-tertiary: #9ca3af` (light gray)

**Background**

- `--color-bg-primary: #ffffff` (white)
- `--color-bg-secondary: #f9fafb` (very light gray)
- `--color-bg-tertiary: #f3f4f6` (light gray)

**Border**

- `--color-border: #d1d5db` (standard border)
- `--color-border-light: #e5e7eb` (light border)
- `--color-border-dark: #9ca3af` (dark border)

### Typography Scale

Consolidated from 20+ sizes to 8 tokens:

- `--text-2xs: 0.625rem` (10px, icon labels)
- `--text-xs: 0.75rem` (12px, form labels)
- `--text-sm: 0.8125rem` (13px, compact text)
- `--text-base: 0.875rem` (14px, body text)
- `--text-md: 1rem` (16px, mobile inputs)
- `--text-lg: 1.125rem` (18px, subheadings)
- `--text-xl: 1.25rem` (20px, section headers)
- `--text-2xl: 1.5rem` (24px, page headings)

### Spacing Scale

Responsive spacing tokens (already defined in responsive.css):

- `--spacing-xs` - Smallest gaps
- `--spacing-sm` - Small gaps
- `--spacing-md` - Medium gaps (default)
- `--spacing-lg` - Large gaps
- `--spacing-xl` - Extra large gaps
- `--spacing-2xl` - Section spacing

### Radius & Shadows

```css
--radius-sm: 0.25rem; /* 4px */
--radius-md: 0.375rem; /* 6px */
--radius-lg: 0.5rem; /* 8px */
--radius-xl: 0.75rem; /* 12px */
--radius-full: 9999px; /* Fully rounded */

--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
```

## Layout Primitives

### Stack (Vertical Layout)

```svelte
<Stack gap="md" align="center">
  <div>Item 1</div>
  <div>Item 2</div>
</Stack>
```

**Props:**

- `gap: 'xs' | 'sm' | 'md' | 'lg' | 'xl'` - Space between items
- `align: 'start' | 'center' | 'end' | 'stretch'` - Alignment

### Inline (Horizontal Layout)

```svelte
<Inline gap="md" align="center" justify="between">
  <div>Left</div>
  <div>Right</div>
</Inline>
```

**Props:**

- `gap: 'xs' | 'sm' | 'md' | 'lg' | 'xl'`
- `align: 'start' | 'center' | 'end' | 'stretch'`
- `justify: 'start' | 'center' | 'end' | 'between' | 'around'`
- `wrap: boolean` - Allow wrapping on smaller screens

### GridLayout (2D Layout)

```svelte
<GridLayout columns={2} gap="md" collapse={true}>
  <div>Col 1</div>
  <div>Col 2</div>
  <div>Col 3</div>
  <div>Col 4</div>
</GridLayout>
```

**Props:**

- `columns: 1 | 2 | 3 | 4` - Number of columns
- `gap: 'xs' | 'sm' | 'md' | 'lg' | 'xl'`
- `collapse: boolean` - Collapse to 1 column on mobile

## Form Primitives

### FormGroup (Label + Input + Error)

```svelte
<FormGroup label="Email" required id="email" error={emailError}>
  <Input id="email" type="email" bind:value={email} />
</FormGroup>
```

**Props:**

- `label: string` - Label text (optional)
- `required: boolean` - Shows red asterisk
- `error: string | null` - Error message (optional)
- `id: string` - Element ID

### FormRow (Multi-Column Layout)

```svelte
<FormRow columns={2}>
  <FormGroup label="From">
    <Input type="date" />
  </FormGroup>
  <FormGroup label="To">
    <Input type="date" />
  </FormGroup>
</FormRow>
```

**Props:**

- `columns: 1 | 2 | 3` - Number of columns
- `ratio: string` - Custom grid ratio (e.g., "2fr 1fr") - overrides columns
- Auto-collapses to 1 column on mobile

### Input

```svelte
<Input type="text" placeholder="Name" bind:value={name} />
```

**Props:**

- `type: 'text' | 'email' | 'password' | 'number' | 'date' | 'time' | 'tel' | 'url'`
- `value: string | number` - Bindable value
- `placeholder: string`
- `disabled: boolean`
- `readonly: boolean`
- `required: boolean`
- `id: string`

**Events:**

- `on:input`, `on:change`, `on:focus`, `on:blur`

**Features:**

- 16px font on mobile (prevents iOS zoom)
- Smaller font on desktop for compact UI
- Token-based colors
- Focus ring with primary color

### TextArea

```svelte
<TextArea rows={5} bind:value={content} />
```

**Props:** Same as Input + `rows: number`

## Interactive Components

### Button

```svelte
<Button type="submit" variant="primary" size="md" loading={false}>
  Submit
</Button>
```

**Props:**

- `type: 'button' | 'submit' | 'reset'`
- `variant: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'`
- `size: 'sm' | 'md' | 'lg'`
- `disabled: boolean`
- `loading: boolean` - Shows spinner
- `fullWidth: boolean` - 100% width

**Events:**

- `on:click`

### Modal

```svelte
<Modal open={showModal} title="Confirm" size="md" onClose={handleClose}>
  Are you sure?
</Modal>
```

**Props:**

- `open: boolean` - Controls visibility
- `title: string` - Header title
- `size: 'sm' | 'md' | 'lg'`
- `onClose: () => void` - Close callback

**Features:**

- Fixed z-index (`--z-modal: 40`, `--z-modal-backdrop: 39`)
- Centered on desktop, full-width on mobile
- Backdrop click closes modal
- Built-in close button

### Alert

```svelte
<Alert variant="success" dismissible title="Success">
  Operation completed!
</Alert>
```

**Props:**

- `variant: 'success' | 'error' | 'warning' | 'info'`
- `dismissible: boolean` - Shows close button
- `title: string` - Optional alert title

**Features:**

- Colored left border + background
- Token-based semantic colors
- Automatically dismisses on button click

### Card

```svelte
<Card padding="md" shadow="sm" interactive={false}>
  Content here
</Card>
```

**Props:**

- `padding: 'sm' | 'md' | 'lg'`
- `shadow: 'sm' | 'md' | 'lg' | 'none'`
- `interactive: boolean` - Adds hover effects

### Badge

```svelte
<Badge variant="flight" size="md">Flight</Badge>
```

**Props:**

- `variant: 'flight' | 'hotel' | 'event' | 'transportation' | 'car_rental' | 'voucher' | 'trip' | 'default'`
- `size: 'sm' | 'md' | 'lg'`

**Features:**

- Pre-defined colors for each item type
- Fully rounded, pill-shaped
- Useful for labels and status indicators

## Responsive Behavior

### 2-Tier Breakpoint System

- **Mobile:** 0-639px (all phones, tablets in portrait)
- **Desktop:** 640px+ (tablets landscape, all desktops)

All form inputs and buttons automatically adjust:

- Mobile: 16px font (prevents iOS zoom), taller hit targets
- Desktop: 14px font, more compact

Grid and flex components auto-collapse on mobile:

- `GridLayout` with `collapse={true}` → 1 column on mobile
- `FormRow` → 1 column on mobile
- Multi-column form layouts become single-column

## Migration from Old Components

See `MIGRATION_GUIDE.md` for detailed before/after examples.

Quick summary:

- Replace `.form-group` divs with `<FormGroup>`
- Replace `.form-row` divs with `<FormRow>`
- Replace `.submit-btn` with `<Button variant="primary">`
- Replace hardcoded `#007bff` with `var(--color-primary)`

## Performance

- CSS custom properties (zero runtime cost)
- No JavaScript logic in most components
- Minimal CSS (one property per variant, no duplication)
- Compiled Svelte components (no runtime overhead)

## Accessibility

- All form inputs have associated labels (or `<FormGroup label="">`)
- Buttons have visible focus states
- Modal has close button and backdrop click
- Alert has dismissible option
- Touch targets meet WCAG AA (44px minimum on mobile)

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS custom properties supported in all modern browsers
- Graceful degradation for older browsers (fallback colors)

---

**Last Updated:** February 13, 2026
**Status:** Phase 1-4 Complete, Phase 5 In Progress
