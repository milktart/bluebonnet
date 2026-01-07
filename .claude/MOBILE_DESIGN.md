# Mobile-First Responsive Design Guide - Bluebonnet

**Last Updated:** January 6, 2026
**Status:** Phase 1 Complete - Breakpoint Foundation Established

---

## Overview

This document describes the mobile-first responsive design system implemented in the Bluebonnet application. The system uses a **4-tier breakpoint approach** optimized for modern mobile, tablet, and desktop devices.

---

## Breakpoint System

### 4-Tier Breakpoints

```
┌─────────────────────────────────────────────────────────────────┐
│                    RESPONSIVE BREAKPOINT TIERS                  │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│   Mobile     │  Small Mobile│   Tablet     │     Desktop        │
│  0-479px     │   480-639px  │  640-1023px  │    1024px+         │
├──────────────┼──────────────┼──────────────┼────────────────────┤
│ iPhone SE    │ Landscape    │ iPad Mini    │ Laptop/Desktop     │
│ iPhone 12    │ Larger phones│ iPad Air     │ Wide screens       │
│ iPhone 14    │ Fold devices │ Galaxy Tab   │ 4K displays        │
│ iPhone 15    │              │              │                    │
└──────────────┴──────────────┴──────────────┴────────────────────┘
```

### Tailwind Configuration

The following breakpoints are defined in `tailwind.config.js`:

```javascript
screens: {
  'mobile': '0px',      // Base (mobile-first)
  'sm': '480px',        // Larger phones, landscape
  'md': '640px',        // Tablets
  'lg': '1024px',       // Desktop (default Tailwind)
}
```

### Usage in Tailwind Utilities

Apply responsive utilities with the breakpoint prefix:

```html
<!-- Mobile-first base: 16px font, tablet and up: 18px -->
<p class="text-base md:text-lg">Responsive text</p>

<!-- Show on mobile, hide on tablet+ -->
<div class="block md:hidden">Mobile only</div>

<!-- Hide on mobile, show on tablet+ -->
<div class="hidden md:block">Tablet and up</div>

<!-- Different grid columns per breakpoint -->
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
  <!-- 1 col on mobile, 2 on sm, 3 on md, 4 on lg -->
</div>
```

### CSS Variables for Custom Styles

CSS variables are defined in `src/lib/styles/breakpoints.css`:

```css
/* Access in CSS */
:root {
  --breakpoint-mobile-min: 0px;
  --breakpoint-mobile-max: 479px;
  --breakpoint-sm-min: 480px;
  --breakpoint-sm-max: 639px;
  --breakpoint-md-min: 640px;
  --breakpoint-md-max: 1023px;
  --breakpoint-lg-min: 1024px;

  /* Touch targets */
  --touch-target-min: 44px;

  /* Safe area insets (dynamic) */
  --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
}
```

---

## Mobile-First Design Principles

### 1. Start with Mobile Base Styles

Always write CSS for mobile first, then enhance for larger screens:

```css
/* ❌ WRONG - Desktop-first approach */
.card {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* Desktop only */
}
@media (max-width: 768px) {
  .card {
    grid-template-columns: 1fr; /* Override for mobile */
  }
}

/* ✅ RIGHT - Mobile-first approach */
.card {
  display: grid;
  grid-template-columns: 1fr; /* Mobile base */
}
@media (min-width: 640px) {
  .card {
    grid-template-columns: repeat(3, 1fr); /* Enhanced for tablet+ */
  }
}
```

### 2. Touch Target Sizing

Minimum touch targets are **44x44px** (WCAG AA standard):

```css
/* ✅ Touch-friendly button on mobile */
button {
  min-width: 44px;
  min-height: 44px;
  padding: 0.75rem 1rem;
}

/* Form inputs */
input,
select,
textarea {
  min-height: 44px;
  padding: 0.5rem 0.75rem;
}
```

### 3. Viewport Height Considerations

iOS and Android handle `vh` units differently. Use `dvh` (dynamic viewport height) for better support:

```css
/* ❌ AVOID on mobile - breaks on keyboard appearance */
.sidebar {
  height: 100vh;
}

/* ✅ USE on mobile - accounts for keyboard */
.sidebar {
  height: 100dvh;
}
```

### 4. Safe Area Insets (Notched Devices)

iPhone X, 12, 14, 15 and newer have notches. Use safe area insets:

```css
/* Reserve space for Dynamic Island and home indicator */
.container {
  padding-left: env(safe-area-inset-left, 1rem);
  padding-right: env(safe-area-inset-right, 1rem);
  padding-top: env(safe-area-inset-top, 1rem);
  padding-bottom: env(safe-area-inset-bottom, 1rem);
}

/* Tab bar respecting home indicator */
.tab-bar {
  padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px));
}
```

### 5. Font Size for iOS Zoom Prevention

iOS zooms in on form inputs with `font-size < 16px`. Always use minimum 16px:

```css
/* ❌ WRONG - triggers iOS zoom */
input {
  font-size: 14px;
}

/* ✅ RIGHT - prevents zoom */
input {
  font-size: 16px;
}
input::placeholder {
  font-size: 14px; /* Placeholder can be smaller */
}
```

---

## Layout Patterns by Breakpoint

### Mobile (0-479px) - Tab-Based Navigation

**Layout:** Full-screen tabs with single active panel

```
┌─────────────────────────┐
│   Page Content          │
│   (Tab 1: List)         │
│                         │
│   (Tab 2: Add)          │
│   (Tab 3: Calendar)     │
│   (Tab 4: Settings)     │
│                         │
├─────────────────────────┤
│ 🏠 📝 📅 ⚙️ (Tab Bar)   │ ← 60px + safe area
└─────────────────────────┘

Height constraint:
Content = Viewport - Tab Bar (60px + safe area)
```

### Small Mobile (480-639px) - Landscape Support

**Layout:** Same tab-based navigation, wider content

```
Content width: Full viewport - padding
Height more constrained (landscape = ~568px available)
```

### Tablet (640-1023px) - Three Sidebars

**Layout:** Sidebar layout with reduced widths

```
┌─────────┬─────────┬─────────┐
│ Primary │Secondary│Tertiary │
│ 280px   │  280px  │  280px  │ ← Reduced from desktop 340px
│         │         │         │
│  +Map   │  +Map   │  +Map   │
└─────────┴─────────┴─────────┘

Spacing: 2vh (smaller than desktop 2.5vh)
```

### Desktop (1024px+) - Original Three-Sidebar Layout

**Layout:** Original desktop experience preserved

```
┌─────────┬─────────┬─────────┬─────────┐
│ Primary │Secondary│Tertiary │   Map   │
│ 340px   │  340px  │  340px  │ Full BG │
│         │         │         │  (z:1)  │
└─────────┴─────────┴─────────┴─────────┘

Spacing: 2.5vh
```

---

## Component Guidelines

### Forms

**Mobile (0-479px):**

- Single column layout
- Full-width inputs
- 44px minimum button height
- 1rem gap between rows

```html
<!-- Mobile-first form -->
<div class="space-y-4">
  <input class="w-full h-11" />
  <!-- 44px height -->
  <input class="w-full h-11" />
  <button class="w-full h-11">Submit</button>
</div>
```

**Tablet (640px+):**

- Two columns max
- Inline inputs where appropriate

**Desktop (1024px+):**

- Three columns max
- Compact spacing

### Grid Layouts

```html
<!-- Mobile: 1 column, Tablet: 2, Desktop: 3 -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- Items stack on mobile, 2-col on tablet, 3-col on desktop -->
</div>
```

### Navigation

**Mobile (0-479px):**

- Tab bar at bottom
- 44px minimum tab height
- Clear active indicator

**Tablet+ (640px+):**

- Sidebar navigation
- Original three-sidebar layout

---

## Testing Checklist

### Device Testing

- [ ] iPhone SE (3rd gen, 375px) - portrait and landscape
- [ ] iPhone 12 (390px) - iOS Safari
- [ ] iPhone 14 (390px) - Dynamic Island testing
- [ ] iPhone 15 (393px) - Latest model
- [ ] iPad mini (768px) - tablet experience
- [ ] iPad Pro (1024px) - larger tablet
- [ ] Android phones (Samsung S24, Google Pixel) - similar widths
- [ ] Landscape on all devices
- [ ] Desktop (1920px+)

### Responsive Behavior Checklist

- [ ] No horizontal scrolling on any device
- [ ] Tab bar visible and accessible at all times on mobile
- [ ] Safe area insets applied correctly (notched devices)
- [ ] Touch targets minimum 44x44px
- [ ] Forms responsive without breaking layout
- [ ] Map visibility preserved
- [ ] Scroll position maintained when navigating
- [ ] No content cutoff on landscape mode
- [ ] Performance: Smooth animations at 60fps on mobile

### Accessibility Checklist

- [ ] Color contrast ratios (WCAG AA) maintained
- [ ] Focus states visible on keyboard navigation
- [ ] Form labels associated with inputs
- [ ] Button touch targets adequate for motor impairments
- [ ] Alternative text for images
- [ ] Keyboard navigation works on all devices

---

## Common Patterns

### Responsive Text

```html
<!-- Scales between 14px on mobile, 16px on desktop -->
<p class="text-sm md:text-base">Responsive text</p>

<!-- Using clamp() for fluid scaling -->
<p style="font-size: clamp(0.875rem, 2vw, 1rem)">Fluid text</p>
```

### Responsive Spacing

```html
<!-- Padding scales: 1rem on mobile, 1.5rem on tablet, 2rem on desktop -->
<div class="p-4 md:p-6 lg:p-8">Content with responsive padding</div>

<!-- Using clamp() for fluid spacing -->
<div style="padding: clamp(1rem, 3vw, 2rem)">Fluid padding</div>
```

### Visibility Toggling

```html
<!-- Show only on mobile -->
<div class="md:hidden">Mobile menu</div>

<!-- Show only on tablet+ -->
<div class="hidden md:block">Desktop menu</div>

<!-- Conditional rendering for larger screens -->
<div class="hidden lg:flex">Desktop sidebar</div>
```

### Flexible Grid

```html
<!-- Adjusts columns based on viewport -->
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  <div>Card 1</div>
  <div>Card 2</div>
  <!-- ... more cards ... -->
</div>
```

---

## Browser Support

| Browser          | Support | Notes                                               |
| ---------------- | ------- | --------------------------------------------------- |
| iOS Safari       | ✅ Full | iOS 15+, notch support, safe area insets            |
| Chrome Mobile    | ✅ Full | Android 5+, safe area insets in newer versions      |
| Firefox Mobile   | ✅ Full | Latest versions support safe area insets            |
| Samsung Internet | ✅ Full | Follows Chromium standards                          |
| Desktop browsers | ✅ Full | All modern browsers (Chrome, Safari, Firefox, Edge) |

---

## Performance Tips

1. **Minimize Media Queries:** Use Tailwind utilities instead of custom CSS media queries
2. **Lazy Load Images:** Use `srcset` and `sizes` for responsive images
3. **Optimize Touch Interactions:** Use `touch-action: manipulation` to prevent double-tap delay
4. **Avoid vh Units:** Use `dvh` (dynamic viewport height) or avoid height constraints on mobile
5. **CSS-in-Motion:** Keep animations under 300ms on mobile for smooth feel

---

## Troubleshooting

### Common Issues

**Issue:** Content extends beyond viewport width (horizontal scroll)

- **Check:** Width constraints, padding, margin on mobile
- **Fix:** Use `max-w-full`, `overflow-hidden`, or adjust padding

**Issue:** Tab bar covers content

- **Check:** Bottom margin/padding on main content
- **Fix:** Add `pb-[60px]` or `pb-[calc(60px+env(safe-area-inset-bottom))]`

**Issue:** Form inputs zoom on iOS

- **Check:** Font size < 16px
- **Fix:** Set `font-size: 16px` on inputs, use `font-size: 14px` on placeholder

**Issue:** Safe area insets not working

- **Check:** CSS syntax, fallback values
- **Fix:** Use `env(safe-area-inset-*, fallback)` with fallback values

**Issue:** Touch targets too small

- **Check:** Button/input heights, padding
- **Fix:** Minimum 44px height, adequate padding on all sides

---

## Resources

- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [CSS env() Function](https://developer.mozilla.org/en-US/docs/Web/CSS/env)
- [WCAG Touch Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size-enhanced)
- [iOS Safe Area Guide](https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/adaptivity-and-layout/)
- [Android Design Guide](https://developer.android.com/design)

---

## Contributing

When adding new responsive features:

1. **Test on real devices** - especially iPhones with notches
2. **Follow mobile-first approach** - base styles for 0-479px, then enhance
3. **Use Tailwind utilities** - prefer `md:`, `lg:` over custom media queries
4. **Document breakpoint usage** - add comments explaining why certain breakpoints are used
5. **Check accessibility** - verify touch targets, contrast, focus states
6. **Monitor performance** - watch for CSS size growth, animation jank

---

**Next Steps:** Phase 2 implementation will add tab-based navigation and split-view components for mobile.
