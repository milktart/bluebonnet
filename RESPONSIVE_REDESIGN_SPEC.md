# Bluebonnet: Sidebar-to-Drawer Responsive Redesign Specification

**Document Version:** 1.0
**Date Created:** January 8, 2026
**Status:** Design Phase - Ready for Implementation
**Target Implementation:** Single unified responsive layout across all breakpoints

---

## Executive Summary

This document specifies a unified responsive design system that transforms the current dual-view architecture (mobile tab-based + desktop three-sidebar) into a **single elegant responsive layout** that adapts gracefully across all breakpoints using a **Sidebar-to-Drawer pattern**.

### Key Improvements

- ✅ One codebase instead of two separate layout systems
- ✅ Smooth transitions between breakpoints (no hard layout switches)
- ✅ Modern drawer-based navigation (hamburger menu on smaller screens)
- ✅ Flexible sidebar that adapts to available space
- ✅ Consistent user experience across all devices
- ✅ Reduced component complexity and maintenance burden

---

## 1. Responsive Breakpoint System

### Defined Breakpoints

```
┌─────────────────────────────────────────────────────────────────────┐
│ Mobile       │ Tablet        │ Desktop       │ Ultra-Wide          │
│ < 640px      │ 640-1023px    │ 1024-1439px   │ 1440px+             │
├──────────────┼───────────────┼───────────────┼─────────────────────┤
│ • Single col │ • Two columns │ • Three cols  │ • Three cols        │
│ • Drawer nav │ • Drawer nav  │ • Sidebar nav │ • Full sidebar nav  │
│ • Bottom nav │ • Top nav bar │ • Top nav bar │ • Top nav bar       │
│ • Full map   │ • Map + list  │ • Map + 3-SB  │ • Map + 3-SB        │
│ • Bottom SB  │ • Side drawer │ • Side panels │ • Side panels       │
└──────────────┴───────────────┴───────────────┴─────────────────────┘
```

### CSS Custom Properties (Unified System)

```css
:root {
  /* Breakpoints */
  --bp-mobile: 640px;
  --bp-tablet: 1024px;
  --bp-desktop: 1440px;

  /* Spacing (Scales with viewport) */
  --spacing-xs: clamp(0.25rem, 1vw, 0.5rem);
  --spacing-sm: clamp(0.5rem, 1.5vw, 0.75rem);
  --spacing-md: clamp(0.75rem, 2vw, 1rem);
  --spacing-lg: clamp(1rem, 2.5vw, 1.5rem);
  --spacing-xl: clamp(1.5rem, 3vw, 2rem);

  /* Sidebar Widths (Responsive) */
  --sidebar-width-primary: clamp(260px, 30vw, 340px);
  --sidebar-width-secondary: clamp(260px, 30vw, 340px);
  --sidebar-width-tertiary: clamp(260px, 30vw, 340px);

  /* Navigation Heights */
  --nav-height-mobile: 60px; /* Bottom bar on mobile */
  --nav-height-tablet: 60px; /* Top bar on tablet */
  --nav-height-desktop: 60px; /* Top bar on desktop */

  /* Z-index Stack */
  --z-map: 1;
  --z-sidebar-primary: 20;
  --z-sidebar-secondary: 21;
  --z-sidebar-tertiary: 22;
  --z-drawer: 30;
  --z-drawer-backdrop: 29;
  --z-modal: 40;
  --z-modal-backdrop: 39;
  --z-nav: 50;

  /* Transitions */
  --transition-smooth: 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 2. Layout Configurations by Breakpoint

### 2.1 Mobile Layout (< 640px)

**Purpose:** Single-column layout optimized for phones

**Structure:**

```
┌─────────────────────────────────┐
│     Full-screen Content          │
│  (Map, List, Calendar, etc)      │
│                                  │
│                                  │
│                                  │
│                                  │
├─────────────────────────────────┤
│  Navigation Bar (Bottom, 60px)   │
│ [List] [Add] [Cal] [Settings]    │
└─────────────────────────────────┘
```

**Key Features:**

- Full-screen content area (100vw × 100vh - nav height)
- Fixed bottom navigation bar (60px)
- Hamburger menu for navigation drawer (top-left)
- Forms appear as bottom sheets (slide up from bottom)
- No sidebars visible (all content in drawer or fullscreen)

**Sidebar Visibility:**

- **Primary Sidebar:** Hidden, accessible via hamburger menu (drawer)
- **Secondary Sidebar:** Hidden, appears as bottom sheet modal
- **Tertiary Sidebar:** Hidden, appears as bottom sheet modal

**Navigation:**

- Bottom tab bar with 4 main actions: List, Add, Calendar, Settings
- Hamburger menu (top-left) for trip list access
- Smooth slide-up animations for bottom sheets

**CSS Implementation:**

```css
@media (max-width: 639px) {
  .app-layout {
    display: flex;
    flex-direction: column;
    height: 100dvh;
  }

  .app-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .app-nav {
    position: fixed;
    bottom: 0;
    width: 100%;
    height: var(--nav-height-mobile);
    display: flex;
    justify-content: space-around;
  }

  /* Drawer for primary sidebar */
  .nav-drawer {
    position: fixed;
    left: -100%;
    top: 0;
    width: 80%;
    height: 100vh;
    background: white;
    transition: left var(--transition-smooth);
    z-index: var(--z-drawer);
  }

  .nav-drawer.open {
    left: 0;
  }

  .nav-drawer-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--transition-smooth);
    z-index: var(--z-drawer-backdrop);
  }

  .nav-drawer.open ~ .nav-drawer-backdrop {
    opacity: 1;
    pointer-events: auto;
  }

  /* Bottom sheet for forms */
  .bottom-sheet {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 90vh;
    background: white;
    border-radius: 1rem 1rem 0 0;
    transform: translateY(100%);
    transition: transform var(--transition-smooth);
    z-index: var(--z-modal);
  }

  .bottom-sheet.open {
    transform: translateY(0);
  }
}
```

---

### 2.2 Tablet Layout (640px - 1023px)

**Purpose:** Two-column layout for landscape phones and small tablets

**Structure:**

```
┌─────────────────────────────────────────────────────────┐
│  ☰  Bluebonnet                              [User] [×]   │ ← Top Nav Bar (60px)
├──────────────────┬────────────────────────────────────┤
│                  │                                     │
│  Primary List    │  Map + Secondary Content            │
│  (Drawer when    │  (40% drawer, 60% content)          │
│   collapsed)     │                                     │
│                  │                                     │
└──────────────────┴────────────────────────────────────┘
```

**Key Features:**

- Collapsible primary sidebar (hamburger menu collapses/expands)
- Secondary sidebar visible as overlay/drawer when content exists
- Top navigation bar (matches desktop)
- Map remains visible in background
- Forms appear as side drawers or bottom sheets

**Sidebar Visibility:**

- **Primary Sidebar:** Collapsible via hamburger toggle (or always visible if space allows)
- **Secondary Sidebar:** Drawer overlay on right side
- **Tertiary Sidebar:** Drawer overlay (layered over secondary)

**Navigation:**

- Top navigation bar with hamburger menu
- Consistent with desktop navigation pattern

**CSS Implementation:**

```css
@media (min-width: 640px) and (max-width: 1023px) {
  .app-layout {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: auto 1fr;
    height: 100vh;
  }

  .app-nav {
    grid-column: 1 / -1;
    height: var(--nav-height-tablet);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--spacing-md);
  }

  .primary-sidebar {
    grid-row: 2;
    grid-column: 1;
    width: var(--sidebar-width-primary);
    overflow-y: auto;
    transition: transform var(--transition-smooth);
    border-right: 1px solid #e5e7eb;
  }

  .primary-sidebar.collapsed {
    transform: translateX(-100%);
    position: absolute;
    z-index: var(--z-drawer);
    border-right: none;
  }

  .app-content {
    grid-row: 2;
    grid-column: 2;
    overflow: hidden;
    display: grid;
    grid-template-columns: 1fr;
    position: relative;
  }

  .map-container {
    grid-column: 1;
    grid-row: 1;
    z-index: var(--z-map);
  }

  .secondary-sidebar {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 50%;
    max-width: 400px;
    background: white;
    overflow-y: auto;
    transform: translateX(100%);
    transition: transform var(--transition-smooth);
    z-index: var(--z-sidebar-secondary);
  }

  .secondary-sidebar.open {
    transform: translateX(0);
  }
}
```

---

### 2.3 Desktop Layout (1024px - 1439px)

**Purpose:** Three-column layout for traditional laptops

**Structure:**

```
┌─────────────────────────────────────────────────────────────────┐
│  ☰ Bluebonnet                                      [User] [×]     │
├──────────────┬─────────────────────────┬──────────────────────┤
│              │                         │                      │
│   Primary    │        Map              │    Secondary         │
│   Sidebar    │   (Background)          │    Sidebar           │
│              │                         │  (Form/Details)      │
│  (Trip List) │   + Tertiary Sidebar    │                      │
│              │      (Floating Over)    │                      │
│              │                         │                      │
└──────────────┴─────────────────────────┴──────────────────────┘
```

**Key Features:**

- Three sidebars fully visible simultaneously
- Primary sidebar always visible (trip list)
- Secondary sidebar shows details/forms (340px default)
- Tertiary sidebar shows additional forms/modals
- Full-screen map in background
- Hamburger menu collapses primary sidebar

**Sidebar Visibility:**

- **Primary Sidebar:** Always visible (collapsible, 340px default)
- **Secondary Sidebar:** Appears on-demand with fade-in
- **Tertiary Sidebar:** Appears on-demand with fade-in

**Navigation:**

- Top navigation bar with hamburger menu
- Logo/branding visible in top-left

**CSS Implementation:**

```css
@media (min-width: 1024px) and (max-width: 1439px) {
  .app-layout {
    display: grid;
    grid-template-columns: auto 1fr auto;
    grid-template-rows: auto 1fr;
    height: 100vh;
  }

  .app-nav {
    grid-column: 1 / -1;
    height: var(--nav-height-desktop);
  }

  .primary-sidebar {
    grid-row: 2;
    grid-column: 1;
    width: var(--sidebar-width-primary);
    overflow-y: auto;
    border-right: 1px solid #e5e7eb;
  }

  .app-content {
    grid-row: 2;
    grid-column: 2;
    position: relative;
    overflow: hidden;
  }

  .map-container {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: var(--z-map);
  }

  .secondary-sidebar {
    grid-row: 2;
    grid-column: 3;
    width: var(--sidebar-width-secondary);
    overflow-y: auto;
    border-left: 1px solid #e5e7eb;
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--transition-smooth);
  }

  .secondary-sidebar.open {
    opacity: 1;
    pointer-events: auto;
  }

  .tertiary-sidebar {
    position: absolute;
    right: var(--spacing-md);
    top: var(--spacing-md);
    width: var(--sidebar-width-tertiary);
    max-height: calc(100% - var(--spacing-xl));
    overflow-y: auto;
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--transition-smooth);
    z-index: var(--z-sidebar-tertiary);
  }

  .tertiary-sidebar.open {
    opacity: 1;
    pointer-events: auto;
  }
}
```

---

### 2.4 Ultra-Wide Layout (1440px+)

**Purpose:** Full three-column layout for ultra-wide screens with maximum content visibility

**Structure:**

```
┌──────────────────────────────────────────────────────────────────────┐
│  ☰ Bluebonnet                                       [User] [Settings] │
├──────────────┬─────────────────────────┬──────────────┬──────────────┤
│              │                         │              │              │
│   Primary    │        Map              │  Secondary   │   Tertiary   │
│   Sidebar    │   (Background)          │   Sidebar    │   Sidebar    │
│              │                         │   (Content)  │   (Forms)    │
│  (Trip List) │   (Full Screen)         │              │              │
│              │                         │              │              │
│ (340px wide) │                         │  (340px)     │  (340px)     │
└──────────────┴─────────────────────────┴──────────────┴──────────────┘
```

**Key Features:**

- All three sidebars visible simultaneously
- Maximum information density
- Large map in center background
- All forms/modals in dedicated right panel
- No drawer behavior (everything visible)

**Sidebar Visibility:**

- **Primary Sidebar:** Always visible (340px)
- **Secondary Sidebar:** Always visible or on-demand (340px)
- **Tertiary Sidebar:** Always visible or on-demand (340px)

**CSS Implementation:**

```css
@media (min-width: 1440px) {
  .app-layout {
    display: grid;
    grid-template-columns: 340px 1fr 340px 340px;
    grid-template-rows: auto 1fr;
    height: 100vh;
  }

  .app-nav {
    grid-column: 1 / -1;
    height: var(--nav-height-desktop);
  }

  .primary-sidebar {
    grid-row: 2;
    grid-column: 1;
    width: 340px;
    overflow-y: auto;
    border-right: 1px solid #e5e7eb;
  }

  .app-content {
    grid-row: 2;
    grid-column: 2;
    position: relative;
    overflow: hidden;
  }

  .map-container {
    position: absolute;
    width: 100%;
    height: 100%;
  }

  .secondary-sidebar {
    grid-row: 2;
    grid-column: 3;
    width: 340px;
    overflow-y: auto;
    border-left: 1px solid #e5e7eb;
  }

  .tertiary-sidebar {
    grid-row: 2;
    grid-column: 4;
    width: 340px;
    overflow-y: auto;
    border-left: 1px solid #e5e7eb;
  }
}
```

---

## 3. Navigation System (Unified)

### 3.1 Top Navigation Bar (All Breakpoints ≥ 640px)

**Components:**

- Left: Hamburger menu + Logo
- Center: (Optional) App title
- Right: User avatar, settings dropdown, close button

**Behavior:**

```
Mobile < 640px:   HIDDEN (uses bottom tab bar instead)
Tablet 640-1023px: VISIBLE (dark background, sticky)
Desktop 1024px+:   VISIBLE (light background, sticky)
```

**HTML Structure:**

```html
<nav class="app-nav">
  <div class="nav-left">
    <button class="nav-hamburger" aria-label="Toggle menu">
      <svg><!-- hamburger icon --></svg>
    </button>
    <span class="nav-logo">Bluebonnet</span>
  </div>

  <div class="nav-center">
    <!-- App title or search (optional) -->
  </div>

  <div class="nav-right">
    <button class="nav-user" aria-label="User menu">
      <img src="avatar.jpg" alt="User" />
    </button>
    <button class="nav-settings" aria-label="Settings">
      <svg><!-- settings icon --></svg>
    </button>
  </div>
</nav>
```

**Styling:**

```css
.app-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-lg);
  height: var(--nav-height-tablet);
  background: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: var(--z-nav);
}

.nav-hamburger {
  display: none;
  width: 40px;
  height: 40px;
  padding: 0;
  margin-right: var(--spacing-md);
  background: none;
  border: none;
  cursor: pointer;
}

@media (max-width: 1023px) {
  .nav-hamburger {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.nav-logo {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
}

.nav-right {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}
```

### 3.2 Bottom Navigation Bar (Mobile < 640px)

**Components:**

- 4 tabs: List, Add, Calendar, Settings
- Active state highlighting
- Icon + label (stacked)

**Behavior:**

```
Mobile < 640px:   VISIBLE (fixed bottom, glass morphism)
Tablet 640px+:    HIDDEN (replaced by top nav + drawer)
```

**HTML Structure:**

```html
<nav class="mobile-nav">
  <button class="mobile-nav-tab active" data-tab="list">
    <svg class="icon"><!-- list icon --></svg>
    <span>List</span>
  </button>
  <button class="mobile-nav-tab" data-tab="add">
    <svg class="icon"><!-- plus icon --></svg>
    <span>Add</span>
  </button>
  <button class="mobile-nav-tab" data-tab="calendar">
    <svg class="icon"><!-- calendar icon --></svg>
    <span>Calendar</span>
  </button>
  <button class="mobile-nav-tab" data-tab="settings">
    <svg class="icon"><!-- settings icon --></svg>
    <span>Settings</span>
  </button>
</nav>
```

**Styling:**

```css
@media (max-width: 639px) {
  .mobile-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    display: flex;
    justify-content: space-around;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    border-top: 1px solid #e5e7eb;
    z-index: var(--z-nav);
    padding: max(0, env(safe-area-inset-bottom));
  }

  .mobile-nav-tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: 0;
    background: none;
    border: none;
    cursor: pointer;
    color: #9ca3af;
    font-size: 0.75rem;
    flex: 1;
  }

  .mobile-nav-tab.active {
    color: #2563eb;
  }

  .mobile-nav-tab .icon {
    width: 24px;
    height: 24px;
  }
}
```

---

## 4. Sidebar Behavior Across Breakpoints

### 4.1 Primary Sidebar (Trip List)

| Breakpoint              | Visibility     | Behavior                                     | Trigger          |
| ----------------------- | -------------- | -------------------------------------------- | ---------------- |
| **Mobile < 640px**      | Hidden         | Accessible via hamburger drawer              | Hamburger icon   |
| **Tablet 640-1023px**   | Collapsible    | Drawer when collapsed, sidebar when expanded | Hamburger toggle |
| **Desktop 1024-1439px** | Always visible | Fixed column (340px)                         | Always shown     |
| **Ultra 1440px+**       | Always visible | Fixed column (340px)                         | Always shown     |

### 4.2 Secondary Sidebar (Details/Forms)

| Breakpoint              | Visibility | Behavior                      | Appearance            |
| ----------------------- | ---------- | ----------------------------- | --------------------- |
| **Mobile < 640px**      | Hidden     | Bottom sheet modal            | Slides up from bottom |
| **Tablet 640-1023px**   | Hidden     | Right-side drawer (50% width) | Slides in from right  |
| **Desktop 1024-1439px** | On-demand  | Right column (340px)          | Fade in/out           |
| **Ultra 1440px+**       | Always     | Right column (340px)          | Always visible        |

### 4.3 Tertiary Sidebar (Additional Forms)

| Breakpoint              | Visibility | Behavior                    | Appearance                        |
| ----------------------- | ---------- | --------------------------- | --------------------------------- |
| **Mobile < 640px**      | Hidden     | Bottom sheet (layered)      | Slides up over secondary          |
| **Tablet 640-1023px**   | Hidden     | Right-side drawer (layered) | Slides over secondary             |
| **Desktop 1024-1439px** | On-demand  | Floating panel (340px)      | Fade in/out, positioned top-right |
| **Ultra 1440px+**       | Always     | Right column (340px)        | Always visible, rightmost         |

---

## 5. Form & Modal System (Unified)

### 5.1 Bottom Sheet (Mobile < 640px)

**Appearance:**

- Slides up from bottom
- Dark backdrop (semi-transparent)
- Border-radius on top corners only
- Max height: 90vh (allows close button visible)

**Animation:**

```css
.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 90vh;
  background: white;
  border-radius: 1rem 1rem 0 0;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
  z-index: var(--z-modal);
  transform: translateY(100%);
  transition: transform var(--transition-smooth);
  overflow-y: auto;
}

.bottom-sheet.open {
  transform: translateY(0);
}

.bottom-sheet-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: calc(var(--z-modal) - 1);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-smooth);
}

.bottom-sheet.open ~ .bottom-sheet-backdrop {
  opacity: 1;
  pointer-events: auto;
}
```

### 5.2 Side Drawer (Tablet 640-1023px)

**Appearance:**

- Slides in from right side
- 50% viewport width (max 400px)
- Dark backdrop
- Full height

**Animation:**

```css
.side-drawer {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 50%;
  max-width: 400px;
  background: white;
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.15);
  z-index: var(--z-modal);
  transform: translateX(100%);
  transition: transform var(--transition-smooth);
  overflow-y: auto;
}

.side-drawer.open {
  transform: translateX(0);
}

.side-drawer-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: calc(var(--z-modal) - 1);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-smooth);
}

.side-drawer.open ~ .side-drawer-backdrop {
  opacity: 1;
  pointer-events: auto;
}
```

### 5.3 Side Panel (Desktop 1024px+)

**Appearance:**

- Always visible or fade in/out
- Fixed width (340px)
- No backdrop (integrated into layout)
- Smooth opacity transitions

**Animation:**

```css
.side-panel {
  width: 340px;
  overflow-y: auto;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-smooth);
}

.side-panel.open {
  opacity: 1;
  pointer-events: auto;
}
```

---

## 6. Component Architecture Changes

### Current Components to Refactor

**HIGH PRIORITY (Fundamental changes):**

1. **MapLayout.svelte** → **ResponsiveLayout.svelte**
   - Remove mobile/desktop branching logic
   - Implement unified grid-based layout
   - Use CSS media queries instead of JavaScript for viewport detection
   - Reduce from 404 lines to ~200 lines

2. **dashboard/+page.svelte** → **Split into feature modules**
   - Split 2,066 lines into 5-6 focused components
   - Remove mobile-specific state variables
   - Use unified view state management
   - Create: `DashboardContainer.svelte`, `DashboardContent.svelte`, `DashboardSidebars.svelte`

3. **MobileTabNavigation.svelte** → **Navigation.svelte**
   - Create unified navigation component
   - Render bottom bar on mobile, top bar on tablet+
   - Remove mobile-specific styling
   - Add hamburger menu behavior

4. **MobileFormModal.svelte** → **FormModal.svelte**
   - Support three display modes: bottom sheet, side drawer, side panel
   - Detect breakpoint and render appropriate container
   - Use CSS media queries for appearance

5. **MobileTripDetailView.svelte** → **TripDetailView.svelte**
   - Adapt to work on all breakpoints
   - Use responsive grid for map + details split
   - Remove mobile-specific styling

**MEDIUM PRIORITY (Component updates):** 6. **MapVisualization.svelte** - Update sizing logic 7. **ItemsList.svelte** - Make card sizes responsive 8. **Sidebar.svelte** - Adapt to new layout system 9. All form components - Support responsive display modes

**LOWER PRIORITY (Styling updates):** 10. Global styles consolidation 11. Breakpoint variable synchronization 12. Responsive typography refinement

---

## 7. State Management Simplification

### Current State (Two Systems)

```typescript
// Desktop state
let selectedTrip: Trip | null;
let formMode: 'create' | 'edit' | null;

// Mobile state (separate)
let mobileActiveTab: 'list' | 'add' | 'calendar' | 'settings';
let mobileSelectedItem: TravelItem | null;
let mobileSelectedItemType: string | null;
let mobileFormState: FormState | null;
```

### New Unified State

```typescript
// Single state system
interface AppState {
  // Navigation
  navigationOpen: boolean; // Hamburger menu open/closed
  activePanel: 'list' | 'calendar' | 'settings'; // Active main view

  // Content selection
  selectedTrip: Trip | null;
  selectedItem: TravelItem | null;
  selectedItemType: string | null;

  // Form/modal display
  formMode: 'create' | 'edit' | null;
  formType: string | null; // 'trip', 'flight', etc.
  showSecondaryPanel: boolean;
  showTertiaryPanel: boolean;

  // Responsiveness
  currentBreakpoint: 'mobile' | 'tablet' | 'desktop' | 'ultra';
}

// Store
export const appState = writable<AppState>({
  navigationOpen: false,
  activePanel: 'list',
  selectedTrip: null,
  selectedItem: null,
  selectedItemType: null,
  formMode: null,
  formType: null,
  showSecondaryPanel: false,
  showTertiaryPanel: false,
  currentBreakpoint: 'desktop',
});
```

---

## 8. Implementation Roadmap

### Phase 1: CSS Foundation (Est. 4-6 hours)

1. Create unified CSS custom properties system
2. Add media query framework for all breakpoints
3. Create base layout component scaffolding
4. Move all breakpoint definitions to centralized file
5. Test CSS layout at different viewport widths

**Files to Create:**

- `/frontend/src/lib/styles/responsive.css` - Unified breakpoint system
- `/frontend/src/lib/styles/layout.css` - Grid/flex layouts for each breakpoint

**Files to Modify:**

- `/frontend/src/app.css` - Add custom properties
- `/frontend/src/lib/styles/form-styles.css` - Update breakpoint references

### Phase 2: Core Layout Component (Est. 6-8 hours)

1. Create new `ResponsiveLayout.svelte` component
2. Implement grid layouts for each breakpoint
3. Remove branching logic from MapLayout
4. Set up sidebar visibility/drawer logic
5. Test layout switching at each breakpoint

**Files to Create:**

- `/frontend/src/lib/components/ResponsiveLayout.svelte`
- `/frontend/src/lib/components/Navigation.svelte`

**Files to Modify:**

- Deprecate `MapLayout.svelte`
- Update `dashboard/+page.svelte` imports

### Phase 3: Navigation System (Est. 4-6 hours)

1. Refactor `MobileTabNavigation.svelte` into unified `Navigation.svelte`
2. Implement hamburger menu and drawer
3. Add top navigation bar for tablet+
4. Update styling for all breakpoints

**Files to Create:**

- `/frontend/src/lib/components/NavigationDrawer.svelte`

**Files to Modify:**

- Refactor `MobileTabNavigation.svelte`

### Phase 4: Form System (Est. 6-8 hours)

1. Refactor `MobileFormModal.svelte` into unified `FormModal.svelte`
2. Implement bottom sheet for mobile
3. Implement side drawer for tablet
4. Implement side panel for desktop
5. Update all form components to support new system

**Files to Create:**

- `/frontend/src/lib/components/FormContainer.svelte` (wrapper)
- `/frontend/src/lib/components/BottomSheet.svelte`
- `/frontend/src/lib/components/SideDrawer.svelte`

**Files to Modify:**

- Deprecate `MobileFormModal.svelte`
- Update all form components

### Phase 5: Component Refactoring (Est. 8-12 hours)

1. Refactor `dashboard/+page.svelte` (split into multiple components)
2. Update `MobileTripDetailView.svelte` for all breakpoints
3. Update `ItemsList.svelte` for responsive card sizing
4. Update all detail components

**Files to Modify:**

- Split `dashboard/+page.svelte` (create 3-4 new files)
- Update `MobileTripDetailView.svelte`
- Update `ItemsList.svelte`

### Phase 6: Testing & Polish (Est. 6-8 hours)

1. Test at all breakpoints: 375px, 640px, 768px, 1024px, 1440px, 1920px
2. Test responsive transitions (resize browser)
3. Fix edge cases and visual issues
4. Accessibility audit (focus, keyboard, screen readers)
5. Performance optimization

**Testing Checklist:**

- [ ] Mobile (< 640px): bottom nav, bottom sheets, hamburger drawer
- [ ] Tablet (640-1023px): top nav, side drawer, hamburger toggle
- [ ] Desktop (1024-1439px): three-sidebar layout visible
- [ ] Ultra (1440px+): all content visible simultaneously
- [ ] Responsive transitions: smooth resizing at breakpoints
- [ ] Touch interactions: tap targets 44px minimum
- [ ] Keyboard navigation: tab order, focus states
- [ ] Screen readers: ARIA labels, semantic HTML

---

## 9. CSS Breakpoint Reference

### Media Query Templates

```css
/* Mobile first approach */

/* Mobile only (< 640px) */
@media (max-width: 639px) {
}

/* Tablet and up (≥ 640px) */
@media (min-width: 640px) {
}

/* Tablet only (640-1023px) */
@media (min-width: 640px) and (max-width: 1023px) {
}

/* Desktop and up (≥ 1024px) */
@media (min-width: 1024px) {
}

/* Desktop only (1024-1439px) */
@media (min-width: 1024px) and (max-width: 1439px) {
}

/* Ultra-wide (≥ 1440px) */
@media (min-width: 1440px) {
}

/* Landscape mode (height-based) */
@media (max-height: 600px) {
}

/* Touch devices */
@media (hover: none) {
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
}

/* High contrast */
@media (prefers-contrast: more) {
}

/* Dark mode (future) */
@media (prefers-color-scheme: dark) {
}
```

---

## 10. File Structure After Refactoring

```
frontend/src/
├── lib/
│   ├── components/
│   │   ├── ResponsiveLayout.svelte        [NEW] Master layout
│   │   ├── Navigation.svelte              [NEW] Unified nav
│   │   ├── NavigationDrawer.svelte        [NEW] Hamburger drawer
│   │   ├── FormContainer.svelte           [NEW] Form wrapper
│   │   ├── BottomSheet.svelte             [NEW] Mobile forms
│   │   ├── SideDrawer.svelte              [NEW] Tablet forms
│   │   ├── TripDetailView.svelte          [REFACTORED] From MobileTripDetailView
│   │   ├── FormModal.svelte               [REFACTORED] From MobileFormModal
│   │   ├── MapLayout.svelte               [DEPRECATED]
│   │   ├── MobileTabNavigation.svelte     [DEPRECATED]
│   │   ├── MobileFormModal.svelte         [DEPRECATED]
│   │   ├── MobileTripDetailView.svelte    [DEPRECATED]
│   │   └── ... (other components)
│   └── styles/
│       ├── responsive.css                 [NEW] Breakpoint system
│       ├── layout.css                     [NEW] Grid layouts
│       ├── form-styles.css                [UPDATED]
│       └── breakpoints.css                [DEPRECATED/ARCHIVED]
├── routes/
│   └── dashboard/
│       ├── +page.svelte                   [REFACTORED] Split into features
│       ├── components/
│       │   ├── DashboardContainer.svelte  [NEW]
│       │   ├── DashboardContent.svelte    [NEW]
│       │   ├── DashboardSidebars.svelte   [NEW]
│       │   └── ... (existing)
└── app.css                                [UPDATED]
```

---

## 11. Success Criteria

### Functionality

- ✅ All features work identically across all breakpoints
- ✅ No layout jumping or visual artifacts during resize
- ✅ Forms appear correctly on all screen sizes
- ✅ Navigation accessible and intuitive at all sizes

### Performance

- ✅ No performance degradation from responsive changes
- ✅ Smooth 60fps transitions between states
- ✅ Fast breakpoint detection (CSS-based, not JavaScript)
- ✅ Bundle size reduction (removed duplicate code)

### User Experience

- ✅ Seamless experience across all devices
- ✅ Familiar patterns: hamburger menu, bottom sheets, sidebars
- ✅ Touch-friendly (44px minimum tap targets)
- ✅ Accessible (keyboard navigation, ARIA labels, high contrast)

### Code Quality

- ✅ 50% reduction in layout component code
- ✅ Single responsive system (no duplication)
- ✅ Clear CSS custom properties for maintenance
- ✅ Well-documented component APIs

---

## 12. Conclusion

This specification defines a comprehensive transformation of the Bluebonnet frontend from a dual-view (mobile + desktop) architecture to a unified, modern responsive design using the Sidebar-to-Drawer pattern.

**Key Benefits:**

1. **Single Codebase:** One set of components handles all breakpoints
2. **Better UX:** Smooth transitions, modern patterns (hamburger, drawers)
3. **Easier Maintenance:** No duplicate logic or conditional rendering
4. **Future-Proof:** Scales easily to new device sizes

**Timeline:** 40-54 hours across 6 implementation phases
**Starting Phase:** CSS Foundation (Phase 1)

---

**Next Steps:**

1. Review and approve this specification
2. Begin Phase 1: CSS Foundation
3. Create `responsive.css` and `layout.css` files
4. Start unit testing of CSS layouts at each breakpoint
