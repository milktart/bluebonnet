# JavaScript Modules Documentation

This directory contains consolidated, optimized JavaScript modules using ES6 module syntax.

## Module Organization

### Core Modules

- **`maps.js`** - Consolidated map functionality (replaces map.js, trip-map.js, trip-view-map.js)
- **`notifications.js`** - Unified notification system
- **`companions.js`** - Consolidated companion management (replaces companion-selector.js, companions-manager.js, item-companions-loader.js)

### Supporting Modules

- **`datetime-formatter.js`** - Date/time formatting utilities
- **`time-input-formatter.js`** - Time input handling
- **`sidebar-loader.js`** - Sidebar content loading
- **`async-form-handler.js`** - Async form submission
- **`trip-view-utils.js`** - Trip view utilities
- **`voucher-sidebar-manager.js`** - Voucher management
- **`trips-list.js`** - Trip list functionality
- **`main.js`** - Global utilities

## Using ES6 Modules

### Option 1: Import in Module Scripts (Recommended for new code)

```html
<script type="module">
  import { initializeMap } from '/js/maps.js';
  import { initializeNotifications } from '/js/notifications.js';
  import { CompanionSelector, ItemCompanionLoader } from '/js/companions.js';

  // Use the imported functions/classes
  document.addEventListener('DOMContentLoaded', () => {
    initializeNotifications('notification-panel', 'notification-bell');

    const selector = new CompanionSelector();
    // ...
  });
</script>
```

### Option 2: Global Functions (Current approach, backward compatible)

All modules export to the global `window` object for backward compatibility:

```html
<script src="/js/maps.js?v=<%= assetVersion %>"></script>
<script src="/js/notifications.js?v=<%= assetVersion %>"></script>
<script src="/js/companions.js?v=<%= assetVersion %>"></script>

<script>
  // Functions are available globally
  initializeNotifications('notification-panel', 'notification-bell');
  initializeMap(tripData);
  new CompanionSelector();
</script>
```

## Module Exports

### maps.js

```javascript
// Functions
export {
  initializeMap,
  initOverviewMap,
  highlightMapMarker,
  unhighlightMapMarker,
  calculateDistance,
  getPointAtDistance,
};

// Also available as window.initializeMap, etc.
```

### notifications.js

```javascript
// Functions
export {
  toggleNotificationCenter,
  loadNotifications,
  markNotificationAsRead,
  deleteNotification,
  handleCompanionAction,
  handleTripAction,
  initializeNotifications,
};

// Also available as window.initializeNotifications, etc.
```

### companions.js

```javascript
// Classes
export class CompanionSelector {}
export class CompanionManager {}
export class ItemCompanionLoader {}

// Functions
export { initCompanionSelector, initCompanionManager, initializeItemCompanions };

// Also available as:
// window.CompanionSelector, window.CompanionManager, etc.
```

## Migration Guide

### Before (Multiple Files)

```html
<script src="/js/map.js"></script>
<script src="/js/trip-map.js"></script>
<script src="/js/trip-view-map.js"></script>
<script src="/js/companion-selector.js"></script>
<script src="/js/companions-manager.js"></script>
<script src="/js/item-companions-loader.js"></script>
```

### After (Consolidated)

```html
<script src="/js/maps.js?v=<%= assetVersion %>"></script>
<script src="/js/companions.js?v=<%= assetVersion %>"></script>
```

## Benefits

1. **Reduced HTTP Requests**: 3 map files → 1, 3 companion files → 1
2. **Better Code Organization**: Related functionality grouped together
3. **Eliminated Duplication**: Shared utilities consolidated
4. **Modern Syntax**: ES6 modules with import/export
5. **Backward Compatible**: Still works with existing global function calls
6. **Cache-Busting**: Version parameter ensures fresh code after updates

## Future Improvements

When a bundler (e.g., esbuild) is added:

- Tree-shaking will remove unused exports
- Code splitting by route will reduce initial load
- Minification will further reduce file sizes
- Source maps for easier debugging

## Performance Impact

**Phase 1 Optimizations:**

- Eliminated ~400 lines of duplicate code
- Reduced from 13 JS files to 10 (-23%)
- Better browser caching with version control
- Foundation for future bundling optimizations

**Projected with Phase 2 (Bundler + Minification):**

- Expected 60-70% total JavaScript size reduction
- Code splitting for faster initial page loads
- Modern compression (gzip/brotli)
