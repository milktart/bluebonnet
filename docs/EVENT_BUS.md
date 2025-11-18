# Event Bus Pattern

**Phase 4 - Frontend Modernization**
**Status:** ✅ COMPLETED
**Date:** 2025-11-18

---

## Overview

The Event Bus is a lightweight pub/sub (publish-subscribe) pattern implementation for client-side component communication. It decouples components, reduces global namespace pollution, and enables reactive state management.

### Key Benefits

✅ **Decoupling:** Components don't need to know about each other
✅ **Reactive Updates:** Automatic UI updates when state changes
✅ **Centralized Events:** All application events in one place
✅ **Easy Testing:** Mock event emissions and subscriptions
✅ **No Global Pollution:** Replaces scattered `window.*` functions
✅ **Type Safety:** Centralized event type registry

---

## Architecture

### Event Bus vs Other Patterns

The application now uses three complementary event systems:

| System               | Purpose                              | Scope       |
| -------------------- | ------------------------------------ | ----------- |
| **Event Bus**        | Component-to-component communication | Client-side |
| **Event Delegation** | DOM event handling (clicks, submits) | DOM only    |
| **Socket.IO**        | Server-to-client real-time updates   | Network     |

### How It Works

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  Component  │         │  Event Bus  │         │  Component  │
│      A      │         │             │         │      B      │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │  emit('trip:updated') │                       │
       ├──────────────────────►│                       │
       │                       │                       │
       │                       │  handler(data)        │
       │                       ├──────────────────────►│
       │                       │                       │
       │                       │                       │
```

Components communicate through the Event Bus without direct dependencies.

---

## Usage

### Basic API

#### Import Event Bus

```javascript
import eventBus, { EventTypes } from './eventBus.js';
```

#### Subscribe to Events

```javascript
// Subscribe to an event
const unsubscribe = eventBus.on(EventTypes.NOTIFICATION_RECEIVED, (notification) => {
  console.log('New notification:', notification);
  updateUI(notification);
});

// Unsubscribe when done
unsubscribe();
```

#### Emit Events

```javascript
// Emit an event with data
eventBus.emit(EventTypes.TRIP_UPDATED, {
  tripId: '123',
  name: 'Summer Vacation',
  updatedAt: new Date(),
});
```

#### One-Time Subscriptions

```javascript
// Subscribe once, then auto-unsubscribe
eventBus.once(EventTypes.SIDEBAR_OPENED, (data) => {
  console.log('Sidebar opened:', data);
  // This handler will only fire once
});
```

---

## Standard Event Types

All application events are defined in `EventTypes` to prevent typos and enable autocomplete.

### Sidebar Events

```javascript
EventTypes.SIDEBAR_OPENED; // Sidebar opened with content
EventTypes.SIDEBAR_CLOSED; // Sidebar closed
EventTypes.SIDEBAR_CONTENT_LOADED; // Content loaded into sidebar
EventTypes.SIDEBAR_HISTORY_CHANGED; // Sidebar navigation history changed
```

**Example:**

```javascript
eventBus.on(EventTypes.SIDEBAR_OPENED, ({ url }) => {
  console.log('Sidebar opened with URL:', url);
});
```

### Notification Events

```javascript
EventTypes.NOTIFICATION_RECEIVED; // New notification from server
EventTypes.NOTIFICATION_READ; // Notification marked as read
EventTypes.NOTIFICATION_DELETED; // Notification deleted
EventTypes.NOTIFICATION_COUNT_CHANGED; // Unread count changed
```

**Example:**

```javascript
eventBus.on(EventTypes.NOTIFICATION_RECEIVED, (notification) => {
  // Show toast notification
  showToast(notification.message);

  // Update badge
  updateNotificationBadge();
});
```

### Trip Events

```javascript
EventTypes.TRIP_CREATED; // New trip created
EventTypes.TRIP_UPDATED; // Trip information updated
EventTypes.TRIP_DELETED; // Trip deleted
EventTypes.TRIP_SELECTED; // User selected a trip
```

**Example:**

```javascript
eventBus.on(EventTypes.TRIP_UPDATED, ({ tripId, name }) => {
  // Update trip in sidebar list
  updateTripInList(tripId, name);

  // Refresh map markers
  refreshMapMarkers();
});
```

### Item Events

For flights, hotels, transportation, car rentals, events:

```javascript
EventTypes.ITEM_CREATED; // New item added to trip
EventTypes.ITEM_UPDATED; // Item information updated
EventTypes.ITEM_DELETED; // Item removed from trip
```

**Example:**

```javascript
eventBus.on(EventTypes.ITEM_CREATED, ({ type, tripId, item }) => {
  if (type === 'flight') {
    addFlightToMap(item);
  }

  // Refresh trip timeline
  refreshTimeline(tripId);
});
```

### Socket Events

```javascript
EventTypes.SOCKET_CONNECTED; // WebSocket connected
EventTypes.SOCKET_DISCONNECTED; // WebSocket disconnected
EventTypes.SOCKET_RECONNECTED; // WebSocket reconnected
EventTypes.SOCKET_ERROR; // WebSocket error occurred
```

**Example:**

```javascript
eventBus.on(EventTypes.SOCKET_CONNECTED, ({ socketId }) => {
  console.log('Connected to server:', socketId);
  showConnectionStatus('online');
});

eventBus.on(EventTypes.SOCKET_DISCONNECTED, ({ reason }) => {
  console.log('Disconnected:', reason);
  showConnectionStatus('offline');
});
```

### UI Events

```javascript
EventTypes.MODAL_OPENED; // Modal dialog opened
EventTypes.MODAL_CLOSED; // Modal dialog closed
EventTypes.TOAST_SHOWN; // Toast notification shown
EventTypes.LOADING_STARTED; // Loading indicator started
EventTypes.LOADING_FINISHED; // Loading indicator finished
```

**Example:**

```javascript
eventBus.on(EventTypes.LOADING_STARTED, ({ operation }) => {
  showSpinner(operation);
});

eventBus.on(EventTypes.LOADING_FINISHED, ({ operation }) => {
  hideSpinner(operation);
});
```

### Data Sync Events

```javascript
EventTypes.DATA_SYNCED; // Data successfully synced
EventTypes.DATA_SYNC_FAILED; // Data sync failed
EventTypes.DATA_INVALIDATED; // Cached data invalidated
```

---

## Current Integrations

### 1. Sidebar Loader (`public/js/sidebar-loader.js`)

**Emits:**

- `SIDEBAR_OPENED` - When sidebar opens with content
- `SIDEBAR_CLOSED` - When sidebar closes
- `SIDEBAR_CONTENT_LOADED` - When content finishes loading
- `SIDEBAR_HISTORY_CHANGED` - When navigation history changes

**Example Usage:**

```javascript
// Listen for sidebar events
eventBus.on(EventTypes.SIDEBAR_OPENED, ({ url }) => {
  // Track analytics
  trackPageView(url);
});

eventBus.on(EventTypes.SIDEBAR_CONTENT_LOADED, ({ url, fullWidth }) => {
  // Initialize any widgets in the loaded content
  if (fullWidth) {
    adjustLayoutForFullWidth();
  }
});
```

### 2. Notification System (`public/js/notifications.js`)

**Emits:**

- `NOTIFICATION_RECEIVED` - New notification from WebSocket
- `NOTIFICATION_READ` - User marked notification as read
- `NOTIFICATION_DELETED` - User deleted notification
- `NOTIFICATION_COUNT_CHANGED` - Unread count updated

**Example Usage:**

```javascript
// Update multiple UI components when notification count changes
eventBus.on(EventTypes.NOTIFICATION_COUNT_CHANGED, ({ count }) => {
  // Update nav badge
  updateNavBadge(count);

  // Update dashboard badge
  updateDashboardBadge(count);

  // Update document title
  if (count > 0) {
    document.title = `(${count}) Bluebonnet Travel`;
  } else {
    document.title = 'Bluebonnet Travel';
  }
});
```

### 3. Socket Client (`public/js/socket-client.js`)

**Emits:**

- `SOCKET_CONNECTED` - WebSocket connection established
- `SOCKET_DISCONNECTED` - WebSocket connection lost
- `SOCKET_RECONNECTED` - WebSocket reconnected after disconnect
- `SOCKET_ERROR` - WebSocket error occurred

**Example Usage:**

```javascript
// Show connection status indicator
eventBus.on(EventTypes.SOCKET_CONNECTED, () => {
  document.getElementById('connection-status').className = 'online';
  document.getElementById('connection-status').textContent = 'Connected';
});

eventBus.on(EventTypes.SOCKET_DISCONNECTED, () => {
  document.getElementById('connection-status').className = 'offline';
  document.getElementById('connection-status').textContent = 'Disconnected';
});
```

---

## Advanced Features

### Debug Mode

Enable debug mode to see all event emissions and subscriptions in the console:

```javascript
// Enable debug mode
eventBus.setDebugMode(true);

// Disable debug mode
eventBus.setDebugMode(false);
```

**Output:**

```
📡 EventBus: Subscribed to "notification:received"
📡 EventBus: Emitting "notification:received" { message: "New trip invitation" }
```

### Inspect Event Bus

```javascript
// Get all registered event names
console.log(eventBus.getEventNames());
// ['sidebar:opened', 'notification:received', 'socket:connected', ...]

// Get subscriber count for an event
console.log(eventBus.getSubscriberCount(EventTypes.NOTIFICATION_RECEIVED));
// 3

// Get debug info (all events with subscriber counts)
console.log(eventBus.getDebugInfo());
// { 'sidebar:opened': 2, 'notification:received': 3, ... }
```

### Clear Handlers

```javascript
// Clear all handlers for a specific event
eventBus.clear(EventTypes.NOTIFICATION_RECEIVED);

// Clear ALL handlers (use with caution!)
eventBus.clear();
```

---

## Best Practices

### 1. Always Use EventTypes Constants

❌ **Bad:**

```javascript
eventBus.emit('notification-received', data); // Typo-prone
```

✅ **Good:**

```javascript
eventBus.emit(EventTypes.NOTIFICATION_RECEIVED, data); // Type-safe
```

### 2. Unsubscribe When Done

```javascript
class NotificationWidget {
  constructor() {
    // Store unsubscribe function
    this.unsubscribe = eventBus.on(EventTypes.NOTIFICATION_RECEIVED, (data) => {
      this.handleNotification(data);
    });
  }

  destroy() {
    // Clean up subscription
    this.unsubscribe();
  }
}
```

### 3. Use Descriptive Event Data

❌ **Bad:**

```javascript
eventBus.emit(EventTypes.TRIP_UPDATED, tripId); // Just an ID
```

✅ **Good:**

```javascript
eventBus.emit(EventTypes.TRIP_UPDATED, {
  tripId: '123',
  name: 'Summer Vacation',
  startDate: '2025-06-01',
  updatedFields: ['name', 'startDate'],
});
```

### 4. Handle Errors in Subscribers

```javascript
eventBus.on(EventTypes.NOTIFICATION_RECEIVED, (notification) => {
  try {
    updateUI(notification);
    playNotificationSound();
  } catch (error) {
    console.error('Error handling notification:', error);
    // Event bus will continue to other handlers
  }
});
```

### 5. Avoid Circular Dependencies

❌ **Bad:**

```javascript
// Component A
eventBus.on(EventTypes.TRIP_UPDATED, () => {
  eventBus.emit(EventTypes.SIDEBAR_OPENED); // Triggers Component B
});

// Component B
eventBus.on(EventTypes.SIDEBAR_OPENED, () => {
  eventBus.emit(EventTypes.TRIP_UPDATED); // Triggers Component A
});
// Infinite loop!
```

✅ **Good:**

```javascript
// Use flags or conditions to prevent loops
eventBus.on(EventTypes.TRIP_UPDATED, (data) => {
  if (!data.fromSidebar) {
    eventBus.emit(EventTypes.SIDEBAR_OPENED, { fromTripUpdate: true });
  }
});
```

---

## Migration Guide

### Replacing Global Functions

**Before:**

```javascript
// sidebar-loader.js
window.loadSidebarContent = function (url) {
  // Load content...
};

// another-component.js
window.loadSidebarContent('/trips/123');
```

**After:**

```javascript
// sidebar-loader.js
function loadSidebarContent(url) {
  // Load content...
  eventBus.emit(EventTypes.SIDEBAR_CONTENT_LOADED, { url });
}

// another-component.js
eventBus.on(EventTypes.SIDEBAR_CONTENT_LOADED, ({ url }) => {
  console.log('Sidebar loaded:', url);
});
```

### Replacing Custom Events

**Before:**

```javascript
// Emit custom DOM event
document.dispatchEvent(
  new CustomEvent('notificationReceived', {
    detail: notification,
  })
);

// Listen for custom DOM event
document.addEventListener('notificationReceived', (e) => {
  console.log(e.detail);
});
```

**After:**

```javascript
// Emit event bus event
eventBus.emit(EventTypes.NOTIFICATION_RECEIVED, notification);

// Listen for event bus event
eventBus.on(EventTypes.NOTIFICATION_RECEIVED, (notification) => {
  console.log(notification);
});
```

---

## Testing

### Unit Testing

```javascript
import eventBus, { EventTypes } from './eventBus.js';

describe('Event Bus', () => {
  beforeEach(() => {
    // Clear all handlers before each test
    eventBus.clear();
  });

  it('should emit and receive events', () => {
    let received = null;

    eventBus.on(EventTypes.TRIP_CREATED, (data) => {
      received = data;
    });

    eventBus.emit(EventTypes.TRIP_CREATED, { tripId: '123' });

    expect(received).toEqual({ tripId: '123' });
  });

  it('should unsubscribe correctly', () => {
    let count = 0;

    const unsubscribe = eventBus.on(EventTypes.TRIP_CREATED, () => {
      count++;
    });

    eventBus.emit(EventTypes.TRIP_CREATED, {});
    expect(count).toBe(1);

    unsubscribe();
    eventBus.emit(EventTypes.TRIP_CREATED, {});
    expect(count).toBe(1); // Still 1, not 2
  });
});
```

### Integration Testing

```javascript
// Test component integration via event bus
describe('Notification Integration', () => {
  it('should update badge when notification is received', async () => {
    // Emit notification event
    eventBus.emit(EventTypes.NOTIFICATION_RECEIVED, {
      id: '123',
      message: 'Test notification',
    });

    // Wait for UI updates
    await waitFor(() => {
      const badge = document.getElementById('notification-badge');
      expect(badge.style.display).toBe('flex');
    });
  });
});
```

---

## Performance Considerations

### Memory Management

- Event Bus keeps references to all handler functions
- Always unsubscribe when components are destroyed
- Use `once()` for one-time handlers

### Event Frequency

For high-frequency events (e.g., scroll, mousemove):

```javascript
// Debounce high-frequency events
import { debounce } from './utils.js';

const handleScroll = debounce((data) => {
  // Handle scroll event
}, 100);

eventBus.on(EventTypes.MAP_BOUNDS_CHANGED, handleScroll);
```

### Subscriber Count

- Monitor subscriber counts in development
- Too many subscribers might indicate architectural issues

```javascript
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    console.log('Event Bus Debug Info:', eventBus.getDebugInfo());
  }, 10000);
}
```

---

## Future Enhancements

### Potential Additions

1. **Event Filtering:** Subscribe to events with conditions

   ```javascript
   eventBus.on(EventTypes.TRIP_UPDATED, (data) => data.tripId === '123', handler);
   ```

2. **Priority Handlers:** Execute handlers in specific order

   ```javascript
   eventBus.on(EventTypes.TRIP_UPDATED, handler, { priority: 10 });
   ```

3. **Event History:** Record recent events for debugging

   ```javascript
   eventBus.getHistory(EventTypes.NOTIFICATION_RECEIVED);
   ```

4. **Async Handlers:** Wait for all handlers to complete
   ```javascript
   await eventBus.emitAsync(EventTypes.DATA_SYNCED);
   ```

---

## Files

### Created

- `public/js/eventBus.js` - Event Bus implementation

### Modified

- `public/js/sidebar-loader.js` - Integrated event bus
- `public/js/notifications.js` - Integrated event bus
- `public/js/socket-client.js` - Integrated event bus

---

## Conclusion

The Event Bus pattern provides a clean, maintainable way to handle component communication in the Bluebonnet Travel application. It decouples components, reduces global namespace pollution, and enables reactive state management.

**Phase 4 Event Bus Implementation: 100% Complete** ✅

---

## Additional Resources

- [Pub/Sub Pattern](https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern)
- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)
- [JavaScript Event Bus](https://javascript.info/dispatch-events)
