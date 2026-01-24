# Responsive Design System Documentation

## Overview

This directory contains the centralized responsive design system for Bluebonnet. The system provides:

- **Unified CSS custom properties** for consistent spacing, colors, and sizing
- **Breakpoint-specific layouts** using CSS Grid
- **Responsive typography** with fluid scaling
- **Responsive utilities** for showing/hiding content

## Files

### `responsive.css`

**Purpose:** Central storage for all CSS custom properties and utilities

**Contains:**

- Breakpoint definitions
- Spacing scale (xs, sm, md, lg, xl, 2xl)
- Sidebar widths
- Navigation heights
- Z-index stack
- Color palette
- Transitions and animations
- Accessibility features
- Responsive utility classes

**Key Features:**

- All spacing values use `clamp()` for fluid scaling
- Separate spacing values for each breakpoint
- Accessibility preferences (reduced motion, high contrast)
- Debug mode helpers

### `layout.css`

**Purpose:** Grid and flexbox layout definitions for each breakpoint

**Contains:**

- Mobile layout (< 640px)
- Tablet layout (640px - 1023px)
- Desktop layout (1024px - 1439px)
- Ultra-wide layout (1440px+)
- Modal and overlay styles

**Key Features:**

- Uses CSS Grid for layout structure
- Responsive sidebar behavior (drawer → sidebar → column)
- Smooth transitions between breakpoints
- Safe area support for notched devices

### `form-styles.css`

**Purpose:** Shared form styling (updated with new breakpoint system)

**Contains:**

- Form input styling
- Button styling
- Touch-friendly sizing

### `breakpoints.css` (DEPRECATED)

**Status:** Archive for reference only

This file is no longer used. All breakpoint definitions have been moved to `responsive.css`.

## CSS Custom Properties Reference

### Breakpoints

```css
--bp-mobile: 640px; /* Mobile → Tablet boundary */
--bp-tablet: 1024px; /* Tablet → Desktop boundary */
--bp-desktop: 1440px; /* Desktop → Ultra-wide boundary */
```

### Spacing Scale

Responsive spacing that scales with viewport width:

```css
--spacing-xs: clamp(0.25rem, 1vw, 0.5rem); /* 4px → 8px */
--spacing-sm: clamp(0.5rem, 1.5vw, 0.75rem); /* 8px → 12px */
--spacing-md: clamp(0.75rem, 2vw, 1rem); /* 12px → 16px */
--spacing-lg: clamp(1rem, 2.5vw, 1.5rem); /* 16px → 24px */
--spacing-xl: clamp(1.5rem, 3vw, 2rem); /* 24px → 32px */
--spacing-2xl: clamp(2rem, 4vw, 2.5rem); /* 32px → 40px */
```

**Usage:**

```css
.component {
  padding: var(--spacing-md);
  gap: var(--spacing-lg);
  margin: var(--spacing-xl);
}
```

### Navigation Heights

```css
--nav-height-mobile: 60px; /* Bottom tab bar on mobile */
--nav-height-tablet: 60px; /* Top nav bar on tablet+ */
--nav-height-landscape: 50px; /* Compressed landscape */
```

### Z-Index Stack

```css
--z-map: 1; /* Map background */
--z-content: 5; /* Main content */
--z-sidebar-primary: 20; /* Trip list sidebar */
--z-sidebar-secondary: 21; /* Details sidebar */
--z-sidebar-tertiary: 22; /* Forms sidebar */
--z-drawer: 30; /* Navigation drawer */
--z-drawer-backdrop: 29; /* Drawer overlay */
--z-modal: 40; /* Forms and modals */
--z-modal-backdrop: 39; /* Modal overlay */
--z-nav: 50; /* Top/bottom navigation */
```

### Sidebar Widths

```css
--sidebar-width-primary: 340px;
--sidebar-width-secondary: 340px;
--sidebar-width-tertiary: 340px;
```

These are adjusted in media queries for smaller screens.

### Colors

```css
/* Brand */
--color-primary: #007bff;
--color-primary-dark: #0056b3;
--color-primary-light: #e7f1ff;

/* Text */
--color-text-primary: #111827;
--color-text-secondary: #6b7280;
--color-text-tertiary: #9ca3af;

/* Borders & Backgrounds */
--color-border: #e5e7eb;
--color-bg-primary: #ffffff;
--color-bg-secondary: #f9fafb;
--color-bg-tertiary: #f3f4f6;

/* Status */
--color-success: #10b981;
--color-warning: #f59e0b;
--color-error: #ef4444;
--color-info: #3b82f6;
```

### Transitions

```css
--transition-fast: 0.15s ease-in-out;
--transition-smooth: 0.35s cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 0.5s cubic-bezier(0.4, 0, 0.2, 1);
```

## Responsive Layout Patterns

### Mobile (< 640px)

**Navigation:** Bottom tab bar
**Sidebar:** Hamburger drawer
**Forms:** Bottom sheet modals
**Layout:** Single column

```
┌─────────────────┐
│  App Content    │
│                 │
├─────────────────┤
│  Bottom Nav     │ ← 60px
└─────────────────┘
```

### Tablet (640px - 1023px)

**Navigation:** Top nav bar
**Sidebar:** Collapsible + side drawer
**Forms:** Side drawer
**Layout:** Two columns

```
┌────────────────────────────────┐
│  Nav Bar       │ 60px           │
├──────────┬─────────────────────┤
│ Primary  │   Map + Content     │
│ Sidebar  │   + Drawers         │
│ 300px    │                     │
└──────────┴─────────────────────┘
```

### Desktop (1024px - 1439px)

**Navigation:** Top nav bar
**Sidebar:** Three full sidebars
**Forms:** Fade in/out overlays
**Layout:** Three columns

```
┌───────────────────────────────────────────┐
│  Nav Bar       │ 60px                      │
├──────────┬──────────────┬──────────────────┤
│ Primary  │   Map        │   Secondary      │
│ Sidebar  │   Content    │   Sidebar        │
│ 340px    │              │   340px          │
│          │ + Tertiary   │                  │
└──────────┴──────────────┴──────────────────┘
```

### Ultra-Wide (1440px+)

**Navigation:** Top nav bar
**Sidebar:** Four columns all visible
**Forms:** Visible in rightmost column
**Layout:** Four columns

```
┌──────────────────────────────────────────────────────────┐
│  Nav Bar       │ 60px                                      │
├──────────┬──────────────┬────────────┬──────────────────┤
│ Primary  │   Map        │ Secondary  │   Tertiary       │
│ Sidebar  │   Content    │ Sidebar    │   Sidebar        │
│ 340px    │              │ 340px      │   340px          │
└──────────┴──────────────┴────────────┴──────────────────┘
```

## Using the Layout System in Components

### Basic Grid Layout

```html
<div class="app-layout">
  <nav class="app-nav"><!-- Navigation bar --></nav>

  <aside class="primary-sidebar"><!-- Trip list --></aside>

  <div class="app-content">
    <div class="map-container"><!-- Map --></div>
    <aside class="secondary-sidebar open"><!-- Details --></aside>
  </div>

  <aside class="tertiary-sidebar"><!-- Forms --></aside>
</div>
```

### Responsive Spacing

```html
<div style="padding: var(--spacing-lg); gap: var(--spacing-md);">
  <!-- Spacing automatically scales with viewport -->
</div>
```

### Conditional Display

```html
<!-- Hide on mobile -->
<div class="hide-mobile">Desktop only content</div>

<!-- Show only on mobile -->
<div class="show-mobile">Mobile only content</div>

<!-- Hide on tablet and below -->
<div class="hide-tablet-down">Desktop only</div>

<!-- Show only on tablet and below -->
<div class="show-tablet-down">Mobile + Tablet</div>
```

## Media Query Usage

### Template for Mobile-First

```css
/* Mobile (default) */
.component {
  display: block;
  width: 100%;
}

/* Tablet and up */
@media (min-width: 640px) {
  .component {
    display: flex;
    width: 50%;
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .component {
    width: 33%;
  }
}

/* Ultra-wide */
@media (min-width: 1440px) {
  .component {
    width: 25%;
  }
}
```

### Quick Reference

```css
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

/* Landscape (height-based) */
@media (max-height: 600px) {
}
```

## Accessibility Features

### Respects User Preferences

The system respects:

- `prefers-reduced-motion: reduce` - Disables all animations
- `prefers-contrast: more` - Increases border widths
- `prefers-color-scheme: dark` - (Placeholder for dark mode)

### Touch Target Sizing

All interactive elements follow WCAG AA standards:

- Minimum: 44px × 44px touch targets
- Padding for notched devices: `safe-area-inset-*`

### Safe Area Support

Forms and navigation account for notches and bottom bars:

```css
padding-bottom: max(var(--spacing-md), env(safe-area-inset-bottom, 0px));
```

## Testing Responsive Breakpoints

### Browser DevTools

1. Open Chrome/Edge DevTools (F12)
2. Click device toolbar (Ctrl+Shift+M or Cmd+Shift+M)
3. Test at these widths:
   - **375px** (Mobile)
   - **640px** (Tablet)
   - **1024px** (Desktop)
   - **1440px** (Ultra-wide)
   - **1920px** (Full HD)

### Debug Mode

Add `debug-mode` class to root to show current breakpoint:

```javascript
// In console
document.documentElement.classList.add('debug-mode');
```

This displays the current breakpoint in the bottom-right corner.

## Migration Guide (from old system)

### Old Breakpoint System → New System

**Old:**

```css
@media (max-width: 479px) {
} /* Mobile small */
@media (min-width: 480px) and (max-width: 639px) {
} /* Mobile large */
@media (min-width: 640px) and (max-width: 1023px) {
} /* Tablet */
@media (min-width: 1024px) {
} /* Desktop */
```

**New (Simplified):**

```css
@media (max-width: 639px) {
} /* Mobile (all) */
@media (min-width: 640px) {
} /* Tablet+ */
@media (min-width: 1024px) {
} /* Desktop+ */
@media (min-width: 1440px) {
} /* Ultra-wide */
```

### Old Spacing → New Spacing

**Old:**

```css
margin: 1rem;
padding: 0.75rem;
gap: 1.5rem;
```

**New (Responsive):**

```css
margin: var(--spacing-lg); /* 1rem → 1.5rem based on viewport */
padding: var(--spacing-md); /* 0.75rem → 1rem */
gap: var(--spacing-xl); /* 1.5rem → 2rem */
```

### Old Colors → New System

**Old:**

```css
color: #111827;
background: #f9fafb;
border: 1px solid #e5e7eb;
```

**New:**

```css
color: var(--color-text-primary);
background: var(--color-bg-secondary);
border: 1px solid var(--color-border);
```

## Best Practices

1. **Always use CSS custom properties** instead of hardcoded values
2. **Use `clamp()`** for fluid sizing instead of fixed values
3. **Mobile-first approach** - start with mobile styles, enhance for larger screens
4. **Reference the z-index stack** - never use arbitrary z-index values
5. **Test at all breakpoints** - especially 640px and 1024px boundaries
6. **Use safe-area insets** for notched devices
7. **Respect user preferences** - reduced motion, high contrast, etc.

## Troubleshooting

### Spacing doesn't scale smoothly

**Issue:** Using hardcoded values instead of `clamp()`
**Solution:** Use CSS custom properties like `var(--spacing-md)`

### Layout breaks at 640px

**Issue:** Missing media query boundary
**Solution:** Test with `@media (max-width: 639px)` and `@media (min-width: 640px)`

### Sidebars overlapping

**Issue:** Z-index conflicts
**Solution:** Use defined z-index custom properties: `var(--z-sidebar-primary)`, etc.

### Content not visible on mobile

**Issue:** Wrong display class or media query
**Solution:** Check for `hide-mobile` or `@media (max-width: 639px) { display: none; }`

## Future Enhancements

1. **Dark Mode** - Add dark color palette in `@media (prefers-color-scheme: dark)`
2. **Container Queries** - Use `@container` for component-level responsive design
3. **CSS Grid Auto** - Leverage `auto-fit` and `auto-fill` more aggressively
4. **Component Library** - Extract common patterns into reusable components

## Related Documentation

- **Specification:** `/RESPONSIVE_REDESIGN_SPEC.md` - Full design system
- **Architecture:** `/.claude/ARCHITECTURE/FRONTEND/README.md` - Component architecture
- **Features:** `/.claude/features.md` - Feature documentation
