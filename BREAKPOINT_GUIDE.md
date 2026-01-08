# Responsive Breakpoint Visual Guide

## Breakpoint Overview

```
┌─────────────┬──────────────────┬──────────────────┬──────────────────┐
│  MOBILE     │     TABLET       │    DESKTOP       │   ULTRA-WIDE     │
│  < 640px    │  640 - 1023px    │ 1024 - 1439px    │    ≥ 1440px      │
└─────────────┴──────────────────┴──────────────────┴──────────────────┘

        375px          768px          1200px         1920px
  ┌──────────┬───────────────┬─────────────────┬──────────────────┐
  │ iPhone   │   iPad        │  Laptop         │  Full HD         │
  │ SE       │   Mini        │  (MacBook)      │  Monitor         │
  └──────────┴───────────────┴─────────────────┴──────────────────┘
```

---

## Layout Comparison

### MOBILE (< 640px)
**Devices:** iPhone SE, iPhone 12-15, Galaxy S21

**Structure:**
```
┌──────────────────────────┐
│                          │
│   App Content (100%)     │  ↑
│                          │  │
│   • Full-width list      │  Flex: 1
│   • Bottom sheet forms   │  (Scrollable)
│   • Map full-screen      │  │
│                          │  ↓
├──────────────────────────┤
│ [List] [Add] [Cal] [⚙]   │  ← 60px nav
│   (Bottom Tab Bar)       │
└──────────────────────────┘
```

**Navigation:**
- ✅ Bottom tab bar (glass morphism, blur effect)
- ✅ Hamburger menu for trip list
- ✅ Bottom sheet for forms
- ✅ Safe area padding for notches

**Content Stacking:**
```
Sidebar (Hamburger Drawer)
    ↓
App Content (Main View)
    ↓
Navigation (Bottom Tab Bar)
```

**Form Display:**
```
Backdrop (Semi-transparent)
    ↓
Bottom Sheet (Slides up from bottom)
    • 90% max height
    • Top radius: 1rem
    • Touch-friendly close
```

---

### TABLET (640px - 1023px)
**Devices:** iPad Mini, iPad (9-10"), Landscape phones

**Structure:**
```
┌────────────────────────────────────────┐
│    Top Navigation Bar (60px)            │
├──────────┬───────────────────────────┤
│          │                           │
│ Primary  │   App Content (100%)      │
│ Sidebar  │                           │  ↑
│ (300px)  │ • Map background          │  │
│          │ • List view               │  Flex: 1
│ Trip     │ • Side drawer for forms   │  (Scrollable)
│ List     │ • Details on right        │  │
│          │                           │  ↓
│          │                           │
└──────────┴───────────────────────────┘
```

**Navigation:**
- ✅ Top navigation bar (sticky)
- ✅ Hamburger menu (collapses primary sidebar)
- ✅ Side drawer from right (50% width, max 400px)
- ✅ Backdrop overlay when drawer open

**Content Stacking:**
```
Top Navigation
    ↓
├─ Primary Sidebar (Collapsible)
├─ App Content
│  ├─ Map Container
│  └─ Secondary Sidebar (Drawer)
    ↓
Backdrop (When drawer open)
```

**Responsive Behavior:**
- Sidebar starts expanded at 640px
- Hamburger available to collapse
- When collapsed, becomes drawer on left
- Forms appear as right-side drawer
- Max two columns visible at once

---

### DESKTOP (1024px - 1439px)
**Devices:** MacBook (13"), Laptop (1200px), Desktop (1366px)

**Structure:**
```
┌──────────────────────────────────────────────────────┐
│  ☰  Bluebonnet                       [User] [Settings] │ ← 60px Nav
├──────────┬──────────────────────┬───────────────────┤
│          │                      │                   │
│ Primary  │   Map Container      │  Secondary Sidebar│
│ Sidebar  │                      │  • Details        │  ↑
│ (340px)  │   • Full map area    │  • Forms          │  │
│          │   • Background       │  • Content        │  Flex: 1
│ • Trips  │   • Navigation       │                   │  │
│ • Items  │                      │  + Tertiary       │  ↓
│          │   + Tertiary         │    (Floating)     │
│          │   (Floating)         │                   │
│          │                      │                   │
└──────────┴──────────────────────┴───────────────────┘
```

**Navigation:**
- ✅ Top navigation bar (always visible)
- ✅ Hamburger menu available (collapses primary)
- ✅ Logo visible
- ✅ User menu on right

**Sidebar Behavior:**
- Primary sidebar: Always visible (340px)
- Secondary sidebar: Fades in/out (340px)
- Tertiary sidebar: Floating, layered above content
- Smooth opacity transitions

**Content Stacking:**
```
Top Navigation
    ↓
├─ Primary Sidebar
├─ App Content
│  ├─ Map Container (Background)
│  └─ Secondary Sidebar (Right, fades in/out)
│
├─ Tertiary Sidebar (Floating, top-right)
```

**Visual Appearance:**
```
Sidebars:
  • White background: rgba(255, 255, 255, 0.7)
  • Border: 1px solid #e5e7eb
  • Shadow: 0 2px 8px rgba(0,0,0,0.1)
  • Border-radius: 0.425rem (7px)
```

---

### ULTRA-WIDE (≥ 1440px)
**Devices:** Desktop (1440px+), Full HD (1920px), 4K (2560px)

**Structure:**
```
┌──────────────────────────────────────────────────────────────────┐
│  ☰  Bluebonnet                          [User] [Settings] [Logout] │ ← 60px
├──────────┬──────────────────────┬──────────────┬──────────────┤
│          │                      │              │              │
│ Primary  │   Map Container      │  Secondary   │   Tertiary   │
│ Sidebar  │                      │  Sidebar     │   Sidebar    │
│ (340px)  │   • Full map area    │              │              │  ↑
│          │   • All interactive  │ • Details    │ • Forms      │  │
│ • Trips  │   • Full visibility  │ • Timeline   │ • Editor     │  Flex: 1
│ • Items  │                      │ • Companions │ • Settings   │  │
│          │                      │              │              │  ↓
│ (Always  │   (All data visible) │ (Always      │ (Always      │
│  visible │                      │  visible)    │  visible)    │
│ )        │                      │              │              │
└──────────┴──────────────────────┴──────────────┴──────────────┘
```

**Navigation:**
- ✅ Top navigation bar (always visible)
- ✅ Hamburger menu available
- ✅ Full branding visible
- ✅ User menu expanded

**All Sidebars Always Visible:**
- Primary (340px): Trip list
- Secondary (340px): Details/content
- Tertiary (340px): Forms/editor
- No overlays or drawers
- Maximum information density

**Content Stacking:**
```
Top Navigation
    ↓
├─ Primary Sidebar (340px, always visible)
├─ App Content
│  └─ Map Container (Background, always visible)
├─ Secondary Sidebar (340px, always visible)
└─ Tertiary Sidebar (340px, always visible)

No overlays, all columns in grid
```

**Maximum Utilization:**
```
Navigation: 60px
Content: Full remaining height
Total Visible Columns: 4
Total Visible Width: 340 + 1fr + 340 + 340 = Full viewport
```

---

## Responsive Spacing

### How Spacing Scales
```
--spacing-lg ranges from 16px to 24px depending on viewport

Viewport Width
    375px  →  500px  →  750px  →  1000px  →  1400px
     ↓        ↓        ↓         ↓          ↓
  16px   →  18px   →  20px   →  22px   →  24px

Using: clamp(1rem, 2.5vw, 1.5rem)
       min   preferred  max
```

### Spacing Scale Reference
```
--spacing-xs:  4px    (mobile) → 8px    (desktop)
--spacing-sm:  8px    (mobile) → 12px   (desktop)
--spacing-md:  12px   (mobile) → 16px   (desktop)  ← Most used
--spacing-lg:  16px   (mobile) → 24px   (desktop)  ← Section spacing
--spacing-xl:  24px   (mobile) → 32px   (desktop)
--spacing-2xl: 32px   (mobile) → 40px   (desktop)
```

---

## Form Display Variations

### Mobile: Bottom Sheet
```
┌──────────────────────┐
│                      │
│   App Content        │
│                      │
├──────────────────────┤  ← Backdrop (semi-transparent)
│                      │
│   Bottom Sheet       │  ← Slides up from bottom
│                      │  Radius: 1rem 1rem 0 0
│   • Form inputs      │  Max height: 90vh
│   • Submit button    │  Touch-friendly
│   • Close button     │
│                      │
│  (Swipe down to close)
└──────────────────────┘
```

### Tablet: Side Drawer
```
┌────────────────────────────────────────┐
│ Top Nav                                 │
├──────────┬───────────────┬─────────────┤
│          │               │  Drawer  │← 50% width
│ Sidebar  │   Map         │─────────│  max 400px
│          │               │ • Forms │
│          │               │ • Edit  │
│          │               │ • Info  │
│          │               │         │
│          │               └────────┘
└──────────┴───────────────┴─────────────┘
           ↓
          Backdrop (click to close)
```

### Desktop: Side Panel (Fade)
```
┌──────────────────────────────────────────────┐
│ Top Nav                                      │
├──────────┬───────────────┬──────────────────┤
│          │               │  Secondary       │
│ Primary  │   Map         │  Sidebar (fade)  │
│ Sidebar  │               │  • Details       │
│          │               │  • Info          │
│          │               │  • Timeline      │
│          │               │                  │
└──────────┴───────────────┴──────────────────┘

Opacity: 0 (hidden) → 1 (visible)
Smooth transition: 0.35s
```

---

## Navigation Variations

### Mobile Navigation
```
┌──────────────────────────────┐
│    Hamburger Drawer          │
│  ┌────────────────────────┐  │
│  │ ☰ Navigation Menu      │  │
│  ├────────────────────────┤  │
│  │ • Trips                │  │
│  │ • Flights              │  │
│  │ • Hotels               │  │
│  │ • Events               │  │
│  │ • Settings             │  │
│  │ • Logout               │  │
│  └────────────────────────┘  │
│                              │
│                              │
│                              │
│                              │
│                              │
├──────────────────────────────┤
│ [List] [Add] [Cal] [⚙]       │ ← Bottom Tab Bar
└──────────────────────────────┘
```

### Tablet/Desktop Navigation
```
┌──────────────────────────────────────┐
│ ☰ Bluebonnet  [Search]  [User] [⚙]   │ ← Top Nav Bar
│                                      │
│ All navigation items in top bar      │
│ Hamburger available for collapse     │
└──────────────────────────────────────┘
```

---

## Hamburger Menu States

### Closed (Sidebar visible)
```
┌─────────────────┐
│ ☰ (visible)     │  ← Hamburger icon visible
│                 │
│ [Content]       │
└─────────────────┘
```

### Open (Sidebar hidden)
```
┌─────────────────┐
│ ✕ (visible)     │  ← X icon (close)
│                 │
│ [Drawer]        │  ← Drawer slides in from left
│ [+ Backdrop]    │
└─────────────────┘
```

---

## Touch Target Sizing

### WCAG AA Compliance
```
Minimum touch target: 44px × 44px

Navigation Buttons:
  ┌──────────────────┐
  │     [Button]     │  ← 44px height
  │  44px ────────   │
  └──────────────────┘
       ↑
       44px width

Form Inputs:
  ┌──────────────────┐
  │ [Input field]    │  ← 44px height
  │  44px ────────   │  (16px font prevents iOS zoom)
  └──────────────────┘

Tab Navigation:
  ┌────┬────┬────┬────┐
  │    │    │    │    │ ← 60px height
  │ 60 │ 60 │ 60 │ 60 │
  │ px │ px │ px │ px │
  │    │    │    │    │
  └────┴────┴────┴────┘
```

---

## Safe Area Support (Notched Devices)

### iPhone with Notch
```
┌────────┌────┐────────┐
│        │ 🔆 │        │  ← Notch
├────────┴────┴────────┤
│ [Button] [Button]    │  ← Safe area padding applied
│                      │
│ Content              │
│                      │
├──────────────────────┤
│ [Tab] [Tab] [Tab]    │  ← Safe area: safe-area-inset-bottom
└──────────────────────┘
     ↓
  Safe Area Inset
```

### CSS Implementation
```css
.nav-bar {
  padding-bottom: max(
    var(--spacing-md),
    env(safe-area-inset-bottom, 0px)
  );
}
```

---

## Landscape Mode Detection

### Tablet Landscape (max-height: 600px)
```
Reduced spacing and nav height

Normal Portrait:        Landscape:
┌──────────────────┐   ┌──────────────────────────────┐
│ Nav (60px)       │   │ Nav (50px) ← Compressed      │
├──────────────────┤   ├──────────────────────────────┤
│                  │   │                              │
│   Content        │   │  Content                     │
│                  │   │                              │
└──────────────────┘   └──────────────────────────────┘

Changes:
  • Nav height: 60px → 50px
  • Spacing: Reduced by 20%
  • Tab icons: Smaller
  • Tab labels: Hidden on very narrow
```

---

## Media Query Quick Reference

Copy these for your component styling:

```css
/* Mobile ONLY */
@media (max-width: 639px) { }

/* Tablet and up */
@media (min-width: 640px) { }

/* Tablet ONLY */
@media (min-width: 640px) and (max-width: 1023px) { }

/* Desktop and up */
@media (min-width: 1024px) { }

/* Desktop ONLY */
@media (min-width: 1024px) and (max-width: 1439px) { }

/* Ultra-wide */
@media (min-width: 1440px) { }

/* Landscape mode */
@media (max-height: 600px) { }

/* Hover capable devices */
@media (hover: hover) { }

/* Touch-only devices */
@media (hover: none) { }

/* Reduced motion */
@media (prefers-reduced-motion: reduce) { }

/* High contrast mode */
@media (prefers-contrast: more) { }

/* Dark mode */
@media (prefers-color-scheme: dark) { }
```

---

## Testing Checklist

### Test These Viewport Widths
- [ ] 375px (iPhone SE)
- [ ] 480px (Galaxy S21)
- [ ] 640px (iPad boundary)
- [ ] 768px (iPad)
- [ ] 1024px (Desktop boundary)
- [ ] 1280px (Laptop)
- [ ] 1440px (Ultra-wide boundary)
- [ ] 1920px (Full HD)
- [ ] 2560px (4K)

### Test These Device Orientations
- [ ] Portrait (all mobile)
- [ ] Landscape (mobile)
- [ ] Landscape (tablet)

### Test Form Display
- [ ] Mobile: Bottom sheet appears
- [ ] Tablet: Side drawer appears
- [ ] Desktop: Side panel fades in

### Test Navigation
- [ ] Mobile: Bottom tab bar visible
- [ ] Mobile: Hamburger drawer works
- [ ] Tablet: Top nav visible, hamburger works
- [ ] Desktop: Top nav visible, hamburger works

### Test Sidebars
- [ ] Mobile: All hidden, drawer accessible
- [ ] Tablet: Primary collapsible, secondary drawer
- [ ] Desktop: Primary + Secondary visible, tertiary floating
- [ ] Ultra-wide: All four visible simultaneously

---

## Accessibility Testing

- [ ] Touch targets ≥ 44px
- [ ] Focus states visible
- [ ] Keyboard navigation works
- [ ] Screen reader labels correct
- [ ] Reduced motion respected
- [ ] High contrast supported
- [ ] Color not only means of communication
- [ ] Text has sufficient contrast (4.5:1 minimum)

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| CSS Grid | ✅ | ✅ | ✅ | ✅ |
| CSS Variables | ✅ | ✅ | ✅ | ✅ |
| clamp() | ✅ | ✅ | ✅ | ✅ |
| env() (safe area) | ✅ | ✅ | ✅ | ✅ |
| Media Queries | ✅ | ✅ | ✅ | ✅ |
| Backdrop-filter | ✅ | ✅ | ✅ (12.1+) | ✅ |

---

**Last Updated:** January 8, 2026
**System Version:** Phase 1 - CSS Foundation Complete

