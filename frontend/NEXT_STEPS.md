# Next Steps - Design System Adoption

## ✅ Completed (February 13, 2026)

The unified design system has been successfully implemented. All core components are ready for use.

---

## 🚀 Ready to Use Now

Import components from the new ui/ library in any Svelte component:

```svelte
<script>
  import { Button, FormGroup, Input, Card, Stack, Alert } from '$lib/components/ui';
</script>

<Card padding="lg">
  <Stack gap="md">
    <FormGroup label="Email" id="email">
      <Input id="email" type="email" bind:value={email} />
    </FormGroup>
    <Button variant="primary" type="submit">Save</Button>
  </Stack>
</Card>
```

---

## 🔄 Gradual Migration (As Components Are Touched)

When working on existing components, migrate them to use the new ui/ library:

### Priority 1: High-Traffic Forms (When Touched)

These are used frequently and would benefit most from consistency:

- [ ] `CompanionForm.svelte` - Replace form markup with FormGroup/FormRow
- [ ] `VoucherForm.svelte` - Replace form markup with FormGroup/FormRow
- [ ] `UserForm.svelte` - Replace form markup with FormGroup/FormRow
- [ ] `AirportForm.svelte` - Replace form markup with FormGroup/FormRow

**Pattern to follow**: See `ItemEditForm.svelte` which already imports `{ Button }` from ui

### Priority 2: Settings Pages (When Touched)

15 files with hardcoded colors (`#f0f0f0`, `#333`, `#666`):

- [ ] `SettingsProfile.svelte` - Replace hardcoded grays with tokens
- [ ] `SettingsUsers.svelte` - Replace hardcoded grays with tokens
- [ ] `SettingsCompanions.svelte` - Replace hardcoded grays with tokens
- [ ] `SettingsVouchers.svelte` - Replace hardcoded grays with tokens
- [ ] `SettingsAirports.svelte` - Replace hardcoded grays with tokens
- [ ] `SettingsSecurity.svelte` - Replace hardcoded grays with tokens
- [ ] `SettingsBackup.svelte` - Replace hardcoded grays with tokens

**Pattern**: Replace `color: #333` with `color: var(--color-text-primary)`

### Priority 3: Display Components (When Touched)

- [ ] `ItemCard.svelte` - Replace Card wrapper with ui/Card
- [ ] `TripCard.svelte` - Replace Card wrapper with ui/Card
- [ ] `DashboardCalendar.svelte` - Replace colors with tokens
- [ ] `MapLayout.svelte` - Replace colors with tokens

---

## 🎨 Design Token Usage

All components should use tokens instead of hardcoded values:

### Colors

```css
/* ❌ OLD - Hardcoded */
color: #007bff;
background: #eff6ff;
border: 1px solid #d1d5db;

/* ✅ NEW - Tokens */
color: var(--color-primary);
background: var(--color-primary-bg);
border: 1px solid var(--color-border);
```

### Typography

```css
/* ❌ OLD - Random sizes */
font-size: 0.95rem;
font-size: 14px;
font-size: 0.8125rem;

/* ✅ NEW - Semantic tokens */
font-size: var(--text-base); /* 14px body */
font-size: var(--text-xs); /* 12px labels */
font-size: var(--text-xl); /* 20px headers */
```

### Spacing

```css
/* ❌ OLD - Hardcoded or inconsistent clamp */
gap: 0.75rem;
gap: clamp(0.5rem, 1.5vw, 0.75rem);
padding: 1rem;

/* ✅ NEW - Spacing tokens */
gap: var(--spacing-md);
padding: var(--spacing-lg);
```

---

## 🐛 Minor Fixes Needed

These are warnings from `npm run check` (non-critical):

1. **TextArea.svelte:11** - Self-closing textarea tag

   ```svelte
   <!-- Change from -->
   <textarea ... />

   <!-- To -->
   <textarea ...></textarea>
   ```

2. **Button.svelte:23** - Self-closing span tag

   ```svelte
   <!-- Change from -->
   <span class="spinner" />

   <!-- To -->
   <span class="spinner"></span>
   ```

---

## 📋 Migration Checklist (Per Component)

When migrating a component to use the design system:

1. **Import from ui/**

   ```svelte
   import { Button, FormGroup, Input } from '$lib/components/ui';
   ```

2. **Replace form markup**

   ```svelte
   <!-- OLD -->
   <div class="form-group">
     <label for="name">Name</label>
     <input id="name" type="text" bind:value={name} />
   </div>

   <!-- NEW -->
   <FormGroup label="Name" id="name">
     <Input id="name" type="text" bind:value={name} />
   </FormGroup>
   ```

3. **Replace buttons**

   ```svelte
   <!-- OLD -->
   <button type="submit" class="submit-btn">Save</button>
   <button type="button" class="cancel-btn" on:click={cancel}>Cancel</button>

   <!-- NEW -->
   <Button type="submit" variant="primary">Save</Button>
   <Button type="button" variant="secondary" on:click={cancel}>Cancel</Button>
   ```

4. **Replace colors with tokens**

   ```svelte
   <style>
     /* OLD */
     .title {
       color: #333;
       border-bottom: 1px solid #f0f0f0;
     }

     /* NEW */
     .title {
       color: var(--color-text-primary);
       border-bottom: 1px solid var(--color-border-light);
     }
   </style>
   ```

5. **Test responsive behavior**
   - Check at 375px (mobile)
   - Check at 640px (breakpoint)
   - Check at 1024px+ (desktop)

---

## 🎯 Don't Break Existing Code

**Important**: The old components still work! Migration is optional and gradual.

- Legacy `Button.svelte`, `Card.svelte`, `Modal.svelte`, etc. still function
- Old CSS classes like `.form-group`, `.form-row` still work via form-styles.css
- Only migrate components when actively working on them
- No rush - this can happen over weeks/months

---

## 📚 Reference Documentation

- **Component Library**: `/frontend/src/lib/components/ui/README.md`
- **Migration Guide**: `/frontend/src/lib/components/ui/MIGRATION_GUIDE.md`
- **Implementation Summary**: `/frontend/DESIGN_SYSTEM_IMPLEMENTATION.md`
- **Design Tokens**: `/frontend/src/lib/components/ui/tokens.css`

---

## 🧪 Testing After Migration

After migrating a component:

1. **Visual Check**
   - Ensure styling looks correct
   - Verify responsive behavior (mobile, desktop)
   - Check hover/focus states

2. **Functional Check**
   - Test form submission
   - Verify validation/error messages
   - Ensure all interactions work

3. **Accessibility Check**
   - Tab through form fields
   - Check focus indicators
   - Test with screen reader if possible

---

## ❓ Questions?

- See component examples in `ui/README.md`
- Check migration patterns in `ui/MIGRATION_GUIDE.md`
- Review tokens in `ui/tokens.css`

The design system is ready to use! Start with small components and gradually adopt across the codebase.
