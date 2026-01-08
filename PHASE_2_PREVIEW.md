# Phase 2 Preview: Core Layout Component

**Estimated Duration:** 6-8 hours
**Status:** Ready to start
**Prerequisites:** Phase 1 ✅ Complete

---

## Overview

Phase 2 will create the unified `ResponsiveLayout.svelte` component that replaces the current `MapLayout.svelte`. This component will use the CSS system from Phase 1 to render different layouts based on viewport width.

Unlike the current system with its hard branching at 640px, the new component will:
- Use CSS Grid for layout (no JavaScript branching)
- Apply CSS classes that correspond to layout configurations
- Render the same component structure at all breakpoints
- Let CSS media queries handle responsive behavior

---

## Current vs. New Approach

### Current System (What We're Replacing)
```javascript
// MapLayout.svelte
if (viewportWidth < 640) {
  // Render completely different mobile layout
  <mobile-layout>
} else {
  // Render completely different desktop layout
  <desktop-layout>
}
```

**Issues:**
- Two separate code paths to maintain
- Different component structures
- Hard breakpoint at 640px
- Mobile/desktop state management separate
- 400+ lines with nested conditionals

### New System (What We're Building)
```javascript
// ResponsiveLayout.svelte
// Same HTML structure for all breakpoints
<div class="app-layout">
  <nav class="app-nav"><!-- Same everywhere --></nav>
  <aside class="primary-sidebar"><!-- Same everywhere --></aside>
  <div class="app-content"><!-- Same everywhere --></div>
  <aside class="secondary-sidebar"><!-- Same everywhere --></aside>
  <aside class="tertiary-sidebar"><!-- Same everywhere --></aside>
</div>
```

**CSS handles everything:**
```css
/* Mobile */
@media (max-width: 639px) {
  .app-layout { grid-template-columns: 1fr; }
  .app-nav { /* bottom nav */ }
}

/* Tablet */
@media (min-width: 640px) and (max-width: 1023px) {
  .app-layout { grid-template-columns: auto 1fr; }
  .app-nav { /* top nav */ }
}

/* Desktop */
@media (min-width: 1024px) {
  .app-layout { grid-template-columns: auto 1fr auto; }
  .app-nav { /* top nav */ }
}
```

**Advantages:**
- Single code path
- Much simpler logic
- CSS handles all responsive behavior
- Consistent structure everywhere
- Easier to maintain

---

## Component Structure

### New File: `ResponsiveLayout.svelte`

**Location:** `/frontend/src/lib/components/ResponsiveLayout.svelte`

**Size Estimate:** 150-200 lines (vs. 400+ current MapLayout)

**Responsibilities:**
1. Render unified HTML structure
2. Manage sidebar visibility (opacity + pointer-events)
3. Export method to access map component
4. Handle sidebar content mutations
5. Dispatch events for mobile interactions (for backward compatibility)

### Key Props

```typescript
export let tripData: any = null;
export let isPast: boolean = false;
export let highlightedTripId: string | null = null;
export let highlightedItemType: string | null = null;
export let highlightedItemId: string | null = null;
export let allTrips: any[] = [];

// These can be removed after migration
export let mobileActiveTab: 'list' | 'add' | 'calendar' | 'settings' = 'list';
export let mobileSelectedItem: any = null;
export let mobileSelectedItemType: string | null = null;
```

### Slot Structure

```html
<!-- Named slots for each section -->
<nav class="app-nav">
  <slot name="nav" />
</nav>

<aside class="primary-sidebar">
  <slot name="primary" />
</aside>

<div class="app-content">
  <div class="map-container">
    <slot name="map" />
  </div>
  <aside class="secondary-sidebar open">
    <slot name="secondary" />
  </aside>
</div>

<aside class="tertiary-sidebar">
  <slot name="tertiary" />
</aside>
```

---

## HTML Structure (All Breakpoints)

```html
<div class="app-layout">
  <!-- Navigation (layout changes per breakpoint) -->
  <nav class="app-nav">
    <div class="nav-left">
      <button class="nav-hamburger">☰</button>
      <span class="nav-logo">Bluebonnet</span>
    </div>
    <div class="nav-right">
      <!-- User menu, settings -->
    </div>
  </nav>

  <!-- Primary Sidebar (left) -->
  <aside class="primary-sidebar [collapsed]">
    <!-- Trip list content -->
  </aside>

  <!-- Main Content Area -->
  <div class="app-content">
    <!-- Map (always present) -->
    <div class="map-container">
      <!-- MapVisualization component -->
    </div>

    <!-- Secondary Sidebar (right, fades/slides) -->
    <aside class="secondary-sidebar [open]">
      <!-- Details, forms, timeline -->
    </aside>
  </div>

  <!-- Tertiary Sidebar (floating or column) -->
  <aside class="tertiary-sidebar [open]">
    <!-- Additional forms, editor -->
  </aside>

  <!-- Backdrops (invisible unless drawer open) -->
  <div class="sidebar-backdrop"></div>
  <div class="drawer-backdrop"></div>
</div>
```

**All elements present at all breakpoints.** CSS Grid and media queries determine visibility and positioning.

---

## CSS Classes Used

### Layout
- `.app-layout` - Main container (CSS Grid)
- `.app-nav` - Navigation bar (top or bottom)
- `.primary-sidebar` - Trip list (left)
- `.app-content` - Main content area (map + secondary)
- `.map-container` - Map element
- `.secondary-sidebar` - Details/forms (right)
- `.tertiary-sidebar` - Additional forms (floating or right column)

### State Classes
- `.collapsed` - Primary sidebar in drawer mode
- `.open` - Sidebar/drawer is visible
- `.active` - Tab or navigation item is active

### Backdrop
- `.sidebar-backdrop` - Semi-transparent overlay (appears when drawer open)
- `.drawer-backdrop` - Overlay for side drawer (tablet)

---

## CSS Media Queries Applied

The layout CSS from Phase 1 (layout.css) defines all styling:

```css
/* Mobile (< 640px) */
@media (max-width: 639px) {
  .app-layout {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
  }
  /* Single column, bottom nav */
}

/* Tablet (640px - 1023px) */
@media (min-width: 640px) and (max-width: 1023px) {
  .app-layout {
    grid-template-columns: auto 1fr;
    grid-template-rows: auto 1fr;
  }
  /* Collapsible sidebar, top nav */
}

/* Desktop (1024px - 1439px) */
@media (min-width: 1024px) and (max-width: 1439px) {
  .app-layout {
    grid-template-columns: auto 1fr auto;
    grid-template-rows: auto 1fr;
  }
  /* Three columns visible */
}

/* Ultra-wide (1440px+) */
@media (min-width: 1440px) {
  .app-layout {
    grid-template-columns: 340px 1fr 340px 340px;
    grid-template-rows: auto 1fr;
  }
  /* Four columns all visible */
}
```

All CSS already exists in `layout.css` - component just needs to render HTML!

---

## JavaScript Logic

### Minimal Complexity

```javascript
<script lang="ts">
  import MapVisualization from './MapVisualization.svelte';
  import { onMount } from 'svelte';

  // Props...
  export let tripData: any = null;
  // ... etc

  let mapComponent: MapVisualization;
  let secondarySidebarEl: HTMLElement;
  let tertiarySidebarEl: HTMLElement;

  // Export method to access map
  export function getMapComponent() {
    return mapComponent;
  }

  onMount(() => {
    // Monitor sidebar content and toggle visibility
    const observer = new MutationObserver(() => {
      if (secondarySidebarEl) {
        const hasContent = secondarySidebarEl.textContent?.trim().length > 0;
        secondarySidebarEl.style.opacity = hasContent ? '1' : '0';
        secondarySidebarEl.style.pointerEvents = hasContent ? 'auto' : 'none';
      }
      if (tertiarySidebarEl) {
        const hasContent = tertiarySidebarEl.textContent?.trim().length > 0;
        tertiarySidebarEl.style.opacity = hasContent ? '1' : '0';
        tertiarySidebarEl.style.pointerEvents = hasContent ? 'auto' : 'none';
      }
    });

    if (secondarySidebarEl) {
      observer.observe(secondarySidebarEl, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
    if (tertiarySidebarEl) {
      observer.observe(tertiarySidebarEl, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }

    return () => observer.disconnect();
  });
</script>
```

**That's it.** No complex viewport detection. No conditional rendering. Just slots and CSS.

---

## Migration Path

### Step 1: Create New Component
1. Create `ResponsiveLayout.svelte` with structure above
2. Copy `MapLayout.svelte` styles (adapt as needed)
3. Test HTML structure renders correctly

### Step 2: Update Parent Component
1. Import `ResponsiveLayout` instead of `MapLayout`
2. Update slot names if needed
3. Keep same props interface for backward compatibility

### Step 3: Remove Mobile/Desktop Branching
1. Remove conditional rendering from `dashboard/+page.svelte`
2. Render single set of components
3. Use unified state (from redesign spec)

### Step 4: Test All Breakpoints
1. Test mobile (375px)
2. Test tablet (768px)
3. Test desktop (1024px)
4. Test ultra-wide (1440px)
5. Test responsive transitions (resize browser)

### Step 5: Remove Old Component
1. Archive `MapLayout.svelte` (for reference)
2. Remove `MobileTabNavigation.svelte`
3. Update any imports

---

## Testing Strategy

### Test at Each Breakpoint

**Mobile (375px)**
- [ ] Bottom navigation visible
- [ ] Hamburger menu works
- [ ] Single column layout
- [ ] Content scrolls smoothly
- [ ] Forms appear as bottom sheets

**Tablet (768px)**
- [ ] Top navigation visible
- [ ] Hamburger menu toggles sidebar
- [ ] Two-column layout
- [ ] Side drawer for forms
- [ ] Backdrop appears when drawer open

**Desktop (1024px)**
- [ ] Top navigation visible
- [ ] Three columns visible
- [ ] Primary sidebar visible
- [ ] Secondary sidebar fades in/out
- [ ] Tertiary sidebar floating

**Ultra-wide (1440px)**
- [ ] Four columns all visible
- [ ] No overlays or drawers
- [ ] Maximum information density
- [ ] No layout breaks

### Responsive Transitions

**Resize Browser Across Breakpoints:**
- [ ] 375px → 640px (mobile → tablet)
- [ ] 640px → 1024px (tablet → desktop)
- [ ] 1024px → 1440px (desktop → ultra-wide)
- [ ] Reverse (zoom out)
- [ ] Smooth transitions with no jumping

### Interaction Testing

- [ ] Hamburger menu opens/closes drawer
- [ ] Click on sidebars doesn't close them
- [ ] Backdrop click closes drawer
- [ ] Forms appear correctly on all breakpoints
- [ ] Map always visible and interactive

---

## Files to Modify in Phase 2

### Create
- `/frontend/src/lib/components/ResponsiveLayout.svelte` (new)

### Update
- `/frontend/src/routes/dashboard/+page.svelte` (import ResponsiveLayout, remove branching)

### Deprecate
- `/frontend/src/lib/components/MapLayout.svelte` (archive, don't delete)

### Reference
- `/frontend/src/lib/styles/layout.css` (already done in Phase 1)
- `/frontend/src/lib/styles/responsive.css` (already done in Phase 1)

---

## Estimated Timeline

| Task | Duration | Notes |
|------|----------|-------|
| Create HTML structure | 1 hour | Copy from spec, adapt slots |
| Add mutation observer | 1 hour | Monitor sidebar content |
| Test at all breakpoints | 2 hours | 375px, 640px, 1024px, 1440px |
| Update parent component | 1 hour | Import, prop updates |
| Remove old component logic | 1 hour | Clean up MapLayout |
| Final testing & polish | 1-2 hours | Edge cases, accessibility |
| **Total** | **6-8 hours** | |

---

## Success Criteria

✅ ResponsiveLayout.svelte created and working
✅ Renders correctly at all 4 breakpoints
✅ Sidebar content visibility works
✅ Map component accessible via export
✅ No breaking changes to parent component
✅ All tests passing
✅ Smooth responsive transitions
✅ Accessible (keyboard, touch targets, screen readers)

---

## Notes for Phase 2 Developer

1. **Keep it simple** - The CSS does the hard work. Component is just HTML + slots.
2. **Don't change CSS** - Phase 1 CSS is complete and tested. Trust it.
3. **Test frequently** - Test at each breakpoint as you build.
4. **Use the quick reference** - `/frontend/src/lib/styles/QUICK_REFERENCE.md`
5. **Document as you go** - Keep notes for Phase 3+

---

## Resources Available

- **Layout CSS:** `/frontend/src/lib/styles/layout.css` (all styling done)
- **Custom Properties:** `/frontend/src/lib/styles/responsive.css` (all defined)
- **Layout Diagrams:** `BREAKPOINT_GUIDE.md` (visual reference)
- **Quick Reference:** `/frontend/src/lib/styles/QUICK_REFERENCE.md` (copy-paste code)
- **Full Docs:** `/frontend/src/lib/styles/README.md` (detailed reference)

---

## Questions to Ask

**Before starting:**
- Should we keep backward compatibility with current `MapLayout` props?
- Should we migrate `dashboard/+page.svelte` state in Phase 2 or Phase 5?
- Do we want to remove the old component immediately or keep it archived?

**During development:**
- Should we add animation/transition on drawer open?
- How much does the primary sidebar collapse overlap the map?
- Should backdrop be full-screen or just over content?

**After completing:**
- Are all breakpoints matching the design?
- Are transitions smooth at all sizes?
- Is accessibility good (keyboard, screen reader)?
- Are there any performance issues?

---

## Next Steps After Phase 2

Once ResponsiveLayout is complete:
1. **Phase 3:** Navigation.svelte (hamburger, tabs, drawers)
2. **Phase 4:** FormModal.svelte (bottom sheets, side drawers)
3. **Phase 5:** Component refactoring (split dashboard, update forms)
4. **Phase 6:** Testing and optimization

---

**Ready to build Phase 2?** 🚀

All the CSS is done. All the documentation is written. The component is straightforward:
- Render HTML structure
- Add slots
- Monitor sidebar content
- Export map access
- Let CSS handle everything else

Start whenever you're ready!

