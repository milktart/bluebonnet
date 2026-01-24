# Responsive Design System - Quick Reference

## Import the System

```css
/* Already imported in app.css */
@import './lib/styles/responsive.css';
@import './lib/styles/layout.css';
```

## Breakpoints (Copy & Paste)

```css
/* Mobile only (< 640px) */
@media (max-width: 639px) {
}

/* Tablet and up (≥ 640px) */
@media (min-width: 640px) {
}

/* Desktop and up (≥ 1024px) */
@media (min-width: 1024px) {
}

/* Ultra-wide (≥ 1440px) */
@media (min-width: 1440px) {
}
```

## Spacing Tokens

```
--spacing-xs  → 4px to 8px
--spacing-sm  → 8px to 12px
--spacing-md  → 12px to 16px (default)
--spacing-lg  → 16px to 24px
--spacing-xl  → 24px to 32px
--spacing-2xl → 32px to 40px
```

## Most Common Custom Properties

```css
/* Spacing */
padding: var(--spacing-md);
margin: var(--spacing-lg);
gap: var(--spacing-lg);

/* Colors */
color: var(--color-text-primary);
background: var(--color-bg-primary);
border: 1px solid var(--color-border);

/* Shadows */
box-shadow: var(--shadow-md);

/* Transitions */
transition: all var(--transition-smooth);

/* Z-index */
z-index: var(--z-sidebar-primary);
```

## Layout Classes

```html
<!-- Use these classes in your components -->
<div class="app-layout">        <!-- Main container -->
  <nav class="app-nav">         <!-- Navigation bar -->
  <aside class="primary-sidebar">   <!-- Trip list -->
  <div class="app-content">     <!-- Map container -->
  <aside class="secondary-sidebar">  <!-- Details -->
  <aside class="tertiary-sidebar">   <!-- Forms -->
</div>
```

## Show/Hide by Breakpoint

```html
<!-- Hide on mobile -->
<div class="hide-mobile">Content for tablet+</div>

<!-- Show only on mobile -->
<div class="show-mobile">Mobile only</div>

<!-- Hide on tablet and below -->
<div class="hide-tablet-down">Desktop+ only</div>

<!-- Show only on tablet and below -->
<div class="show-tablet-down">Mobile + Tablet</div>

<!-- Hide on desktop -->
<div class="hide-desktop">Mobile + Tablet</div>

<!-- Show only on desktop -->
<div class="show-desktop">Desktop+ only</div>
```

## Responsive Typography

```css
h1 {
  font-size: clamp(1.75rem, 8vw, 2.5rem); /* Scales 28px → 40px */
}

p {
  font-size: clamp(0.875rem, 2vw, 1rem); /* Scales 14px → 16px */
}
```

## Touch-Friendly Elements

```css
/* Minimum touch target (WCAG AA) */
button,
a,
input {
  min-height: var(--touch-target-min); /* 44px */
  min-width: var(--touch-target-min);
}
```

## Notched Device Safe Areas

```css
.notch-safe {
  padding-left: max(var(--spacing-md), env(safe-area-inset-left));
  padding-right: max(var(--spacing-md), env(safe-area-inset-right));
  padding-bottom: max(var(--spacing-md), env(safe-area-inset-bottom));
}
```

## Sidebar States (CSS Classes)

```html
<!-- Open/closed states -->
<aside class="secondary-sidebar open">
  <!-- Visible -->
  <aside class="secondary-sidebar">
    <!-- Hidden -->

    <!-- Collapsed navigation drawer -->
    <aside class="primary-sidebar collapsed">
      <!-- Drawer mode -->
      <aside class="primary-sidebar"><!-- Sidebar mode --></aside>
    </aside>
  </aside>
</aside>
```

## Common Patterns

### Responsive Flexbox

```css
.flex-responsive {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

@media (min-width: 640px) {
  .flex-responsive {
    flex-direction: row;
  }
}
```

### Responsive Grid

```css
.grid-responsive {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-lg);
}

@media (min-width: 640px) {
  .grid-responsive {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 1024px) {
  .grid-responsive {
    grid-template-columns: 1fr 1fr 1fr;
  }
}
```

### Bottom Sheet (Mobile)

```css
.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 90vh;
  background: white;
  border-radius: 1rem 1rem 0 0;
  z-index: var(--z-modal);
  transform: translateY(100%);
  transition: transform var(--transition-smooth);
}

.bottom-sheet.open {
  transform: translateY(0);
}
```

### Side Drawer (Tablet)

```css
.side-drawer {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 50%;
  max-width: 400px;
  transform: translateX(100%);
  transition: transform var(--transition-smooth);
}

.side-drawer.open {
  transform: translateX(0);
}
```

## Color Palette (Quick Reference)

```
Primary Blue:     #007bff    (--color-primary)
Dark Blue:        #0056b3    (--color-primary-dark)
Light Blue:       #e7f1ff    (--color-primary-light)

Text Dark:        #111827    (--color-text-primary)
Text Medium:      #6b7280    (--color-text-secondary)
Text Light:       #9ca3af    (--color-text-tertiary)

Border:           #e5e7eb    (--color-border)
Border Dark:      #d1d5db    (--color-border-dark)

Background:       #ffffff    (--color-bg-primary)
Background Alt:   #f9fafb    (--color-bg-secondary)
Background Light: #f3f4f6    (--color-bg-tertiary)

Success:          #10b981    (--color-success)
Warning:          #f59e0b    (--color-warning)
Error:            #ef4444    (--color-error)
Info:             #3b82f6    (--color-info)
```

## Z-Index Stack (Don't memorize, reference)

```
Map Background:           1
Main Content:             5
Primary Sidebar:         20
Secondary Sidebar:       21
Tertiary Sidebar:        22
Navigation Drawer:       30
Drawer Backdrop:         29
Modals/Bottom Sheets:    40
Modal Backdrop:          39
Top/Bottom Navigation:   50
```

## Animation Durations

```
--transition-fast:   0.15s  (Quick feedback)
--transition-smooth: 0.35s  (Standard animations)
--transition-slow:   0.5s   (Page transitions)
```

## Testing Widths

```
Mobile:      375px   (iPhone SE minimum)
Tablet:      640px   (iPad minimum)
Desktop:    1024px   (Traditional desktop)
Ultra:      1440px   (Larger screens)
Full HD:    1920px   (Full HD monitor)
4K:         2560px   (Ultra-wide)
```

## Most Important Rules

1. ✅ Use `var(--spacing-*)` instead of hardcoded sizes
2. ✅ Use `var(--color-*)` for all colors
3. ✅ Use media query boundaries: 640px, 1024px, 1440px
4. ✅ Use `var(--transition-*)` for animations
5. ✅ Use `var(--z-*)` for z-index values
6. ✅ Always test mobile (< 640px) view
7. ✅ Always test desktop (≥ 1024px) view

## Don't Do This ❌

```css
/* ❌ Hardcoded values */
margin: 16px;
padding: 1.5rem;

/* ❌ Random z-index */
z-index: 999;

/* ❌ Hardcoded colors */
color: #111827;

/* ❌ Missing mobile styles */
.component {
  width: 33%; /* Breaks on mobile! */
}

/* ❌ Hard to maintain breakpoints */
@media (max-width: 480px) {
}
@media (min-width: 481px) and (max-width: 768px) {
}
```

## Do This Instead ✅

```css
/* ✅ Use custom properties */
margin: var(--spacing-lg);
padding: var(--spacing-xl);

/* ✅ Use z-index stack */
z-index: var(--z-sidebar-primary);

/* ✅ Use color tokens */
color: var(--color-text-primary);

/* ✅ Mobile-first approach */
.component {
  width: 100%; /* Mobile default */
}

@media (min-width: 640px) {
  .component {
    width: 50%; /* Tablet */
  }
}

@media (min-width: 1024px) {
  .component {
    width: 33%; /* Desktop */
  }
}

/* ✅ Use standard breakpoints */
@media (max-width: 639px) {
} /* Mobile */
@media (min-width: 640px) {
} /* Tablet+ */
@media (min-width: 1024px) {
} /* Desktop+ */
```

## Debug Mode

```javascript
// Enable breakpoint display (bottom-right corner)
document.documentElement.classList.add('debug-mode');

// Disable
document.documentElement.classList.remove('debug-mode');
```

## Accessibility Checklist

- [ ] Touch targets are 44px minimum
- [ ] Text has sufficient contrast
- [ ] Respects `prefers-reduced-motion`
- [ ] Keyboard navigation works
- [ ] Focus states are visible
- [ ] Safe area insets considered
- [ ] Tested on actual mobile device

## Need More Help?

- **Full Docs:** `frontend/src/lib/styles/README.md`
- **System Spec:** `RESPONSIVE_REDESIGN_SPEC.md`
- **Architecture:** `/.claude/ARCHITECTURE/FRONTEND/README.md`
