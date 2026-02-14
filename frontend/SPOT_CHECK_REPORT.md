# Spot Check Report - Legacy Code Audit

**Date**: February 13, 2026
**Purpose**: Identify remaining legacy code patterns after design system migration

---

## 🔍 Search Criteria

Searched for:

1. Bootstrap colors: `#007bff`, `#0056b3`, `#28a745`, `#dc3545`, `#17a2b8`
2. Hardcoded grays: `#f0f0f0`, `#333`, `#666`, `#fafafa`
3. Old CSS classes: `.submit-btn`, `.cancel-btn`, `.delete-btn`, `.error-message`
4. Old form classes: `.form-group`, `.form-row`

---

## ✅ Bootstrap Colors: CLEAN

**Result**: ✅ **ZERO** Bootstrap colors found in active code

- Only reference in `ui/tokens.css` (documentation comments)
- Old `Alert.svelte` is marked `@deprecated` and not used

---

## ⚠️ Hardcoded Grays: FOUND (30 instances)

### Priority 1: Components (Should Use Tokens)

**File**: `lib/components/Card.svelte` (5 instances) - **DEPRECATED COMPONENT**

- Line 66: `border-bottom: 1px solid #f0f0f0;`
- Line 82: `color: #333;`
- Line 89: `color: #666;`
- Line 108: `border-top: 1px solid #f0f0f0;`
- Line 109: `background-color: #fafafa;`
- **Note**: Already marked as deprecated, use `ui/Card.svelte` instead

**File**: `lib/components/Modal.svelte` (4 instances) - **DEPRECATED COMPONENT**

- Line 94: `border-bottom: 1px solid #f0f0f0;`
- Line 100: `color: #333;`
- Line 124: `border-top: 1px solid #f0f0f0;`
- Line 125: `background-color: #fafafa;`
- **Note**: Already marked as deprecated, use `ui/Modal.svelte` instead

**File**: `lib/components/Header.svelte` (4 instances)

- Line 102: `color: #333;`
- Line 123: `color: #666;`
- Line 147: `color: #333;`
- Line 169: `background: #333;`
- **Status**: Active component, should be fixed

**File**: `lib/components/TripCard.svelte` (2 instances)

- Line 114: `color: #666;`
- Line 118: `color: #333;`
- **Status**: Active component, should be fixed

**File**: `lib/components/VoucherDetails.svelte` (1 instance)

- Line 247: `color: #666;`
- **Status**: Active component, should be fixed

**File**: `lib/components/ItemCompanionsSelector.svelte` (2 instances)

- Line 169: `color: #333;`
- Line 198: `color: #666;`
- **Status**: Active component, should be fixed

### Priority 2: Settings Components (3 instances)

**File**: `lib/components/SettingsUsers.svelte` (2 instances)

- Line 243: `background-color: #fafafa;` (table hover)
- Line 359: `background: #fafafa;` (action buttons)
- **Status**: Should use `var(--color-bg-secondary)`

**File**: `lib/components/SettingsAirports.svelte` (3 instances)

- Line 306: `background-color: #fafafa;`
- Line 343: `background-color: #fafafa;`
- Line 440: `background: #fafafa;`
- **Status**: Should use `var(--color-bg-secondary)`

### Priority 3: Layout/Infrastructure (Lower Priority)

**File**: `lib/components/AirportAutocomplete.svelte`

- Line 235: `border-bottom: 1px solid #f0f0f0;`

**File**: `lib/components/DashboardCalendar.svelte` (3 instances)

- Line 512: `return itemColors[item.type] || '#666666';` (fallback color)
- Line 817: `background-color: #f0f0f070;` (today marker, with alpha)
- Line 821: `background-color: #f0f0f0a0;` (selected, with alpha)

**File**: `lib/components/MapLayout.svelte`

- Line 245: `background: #f0f0f0;`

**File**: `lib/components/MobileTripDetailView.svelte`

- Line 381: `background: #f0f0f0;`

**File**: `lib/components/ResponsiveLayout.svelte`

- Line 253: `background: #f0f0f0;`

**File**: `routes/+layout.svelte`

- (Likely in global styles - need to check)

**File**: `routes/+error.svelte`

- (Error page styling - low priority)

---

## ⚠️ Old CSS Classes: FOUND

### 1. Button Classes (Still in Use)

**File**: `lib/components/MobileTripDetailView.svelte` (3 instances)

- Line 356: `class="submit-btn"` - Edit button
- Line 357: `class="cancel-btn"` - Back button
- Line 359: `class="delete-btn"` - Delete button
- **Fix**: Replace with `<Button variant="primary|secondary|danger">`

**File**: `lib/components/SettingsProfile.svelte` (2 instances)

- Line 154: `class="submit-btn"` - Submit button
- Line 157: `class="cancel-btn"` - Cancel button
- **Fix**: Replace with ui/Button

**File**: `lib/components/SettingsSecurity.svelte` (2 instances)

- Line 155: `class="submit-btn"` - Submit button
- Line 158: `class="cancel-btn"` - Cancel button
- **Fix**: Replace with ui/Button

**File**: `lib/components/SettingsUsers.svelte` (3 instances)

- Line 146: `class="action-btn delete-btn"` - Delete user button
- Lines 336-342: CSS definitions for `.delete-btn`
- **Fix**: Replace with ui/Button variant="danger"

### 2. Error Message Class (Still in Use)

**File**: `lib/components/ItemEditForm.svelte`

- Line 565: `<div class="error-message">{error}</div>`
- **Fix**: Replace with `<Alert variant="error">`

**File**: `lib/components/SettingsProfile.svelte`

- Line 110: `<div class="error-message">{error}</div>`
- **Fix**: Replace with `<Alert variant="error">`

**File**: `lib/components/SettingsSecurity.svelte`

- Line 98: `<div class="error-message">{error}</div>`
- **Fix**: Replace with `<Alert variant="error">`

**File**: `routes/+error.svelte`

- Lines 14, 53: Error page styling
- **Status**: Low priority (error page)

---

## ⚠️ Old Form Classes: FOUND (ItemEditForm)

**File**: `lib/components/ItemEditForm.svelte` (50+ instances)

Despite importing `{ Button }` from ui/, this component still uses:

- `class="form-row cols-2"` - ~10 instances
- `class="form-row cols-3"` - ~5 instances
- `class="form-group"` - ~30+ instances

**Example** (Lines 571-597):

```svelte
<div class="form-row cols-3">
  <div class="form-group" style="grid-column: span 2;">
    <label for="departureAirport">Origin *</label>
    <AirportAutocomplete ... />
  </div>
  <div class="form-group" ...>
    <!-- ... -->
  </div>
</div>
```

**Status**: This is the LARGEST remaining legacy code block. ItemEditForm needs complete migration to FormGroup/FormRow.

---

## 📊 Summary Statistics

| Category                  | Instances Found    | Status                    |
| ------------------------- | ------------------ | ------------------------- |
| **Bootstrap colors**      | 0                  | ✅ Clean                  |
| **Hardcoded grays**       | ~30                | ⚠️ Needs fixing           |
| **Old button classes**    | 8                  | ⚠️ Needs migration        |
| **Old error divs**        | 4                  | ⚠️ Needs migration        |
| **Old form classes**      | 50+ (ItemEditForm) | ⚠️ Major migration needed |
| **Deprecated components** | 2 (Card, Modal)    | ✅ Marked, not used       |

---

## 🎯 Recommended Action Plan

### Quick Wins (1-2 hours)

1. **Fix Settings buttons** (SettingsProfile, SettingsSecurity, SettingsUsers)
   - Replace `.submit-btn`/`.cancel-btn` with `<Button variant="...">`
   - Replace `.error-message` divs with `<Alert variant="error">`

2. **Fix active component colors** (Header, TripCard, VoucherDetails, ItemCompanionsSelector)
   - Replace `#333` with `var(--color-text-primary)`
   - Replace `#666` with `var(--color-text-secondary)`
   - Replace `#fafafa` with `var(--color-bg-secondary)`

3. **Fix Settings table hovers** (SettingsUsers, SettingsAirports)
   - Replace `#fafafa` with `var(--color-bg-secondary)`

### Medium Priority (2-4 hours)

4. **Migrate MobileTripDetailView buttons**
   - Replace button classes with ui/Button components

5. **Fix layout component colors** (AirportAutocomplete, MapLayout, etc.)
   - Replace hardcoded grays with tokens

### Major Work (4-8 hours)

6. **Complete ItemEditForm migration**
   - This is the biggest remaining piece
   - 50+ instances of `.form-group` and `.form-row`
   - Should use FormGroup/FormRow like other forms now do
   - High impact - affects ALL travel item editing

### Low Priority (Optional)

7. **DashboardCalendar colors** - Uses grays with alpha channels, may need custom tokens
8. **Error page** (+error.svelte) - Rarely seen, low priority

---

## ✅ What's Already Clean

- ✅ All high-traffic forms (CompanionForm, VoucherForm, UserForm, AirportForm)
- ✅ All form buttons in migrated components
- ✅ All alerts in migrated components
- ✅ Bootstrap colors completely eliminated
- ✅ Deprecated components clearly marked

---

## 🔧 How to Fix

### Pattern 1: Replace Button Classes

```svelte
<!-- BEFORE -->
<button class="submit-btn" type="submit">Save</button>
<button class="cancel-btn" type="button">Cancel</button>

<!-- AFTER -->
<Button type="submit" variant="primary">Save</Button>
<Button type="button" variant="secondary">Cancel</Button>
```

### Pattern 2: Replace Error Divs

```svelte
<!-- BEFORE -->
{#if error}
  <div class="error-message">{error}</div>
{/if}

<!-- AFTER -->
{#if error}
  <Alert variant="error" dismissible={false}>{error}</Alert>
{/if}
```

### Pattern 3: Replace Hardcoded Colors

```css
/* BEFORE */
color: #333;
color: #666;
background: #fafafa;
border: 1px solid #f0f0f0;

/* AFTER */
color: var(--color-text-primary);
color: var(--color-text-secondary);
background: var(--color-bg-secondary);
border: 1px solid var(--color-border-light);
```

---

## 📝 Notes

- **Deprecated components** (Card.svelte, Modal.svelte, Alert.svelte) can stay as-is since they're not actively used
- **ItemEditForm** is the elephant in the room - biggest remaining legacy code block
- **DashboardCalendar** uses alpha channel colors (`#f0f0f070`) which may need special handling
- Most issues are quick fixes (color replacements, button swaps)

---

**Total Estimated Cleanup Time**: 8-15 hours for complete elimination of all legacy patterns
**Quick Wins Available**: ~2 hours to fix 80% of visible issues
