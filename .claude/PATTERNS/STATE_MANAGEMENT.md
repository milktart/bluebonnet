# 🎯 State Management Pattern

Current and future state management approaches in Bluebonnet.

---

## Current State (Express + EJS + Vanilla JS)

### Server-Side State
**Express Session:**
- User authentication state
- Session stored in Redis
- Available via `req.session`
- Includes user ID, login info

```javascript
// In auth middleware
if (req.session.userId) {
  // User is logged in
}
```

### Client-Side State
**Global Variables:**
```javascript
// In window scope
window.tripId = '<%= trip.id %>';
window.tripData = <%- JSON.stringify(trip) %>;
window.sidebarState = {
  secondaryOpen: false,
  tertiaryOpen: false,
  history: []
};
```

**Limitations:**
- Global scope pollution
- No reactivity (manual updates)
- Difficult to debug
- Hard to test
- State synchronization issues

---

## Phase 1 State (Svelte + SvelteKit)

### Svelte Stores

**authStore.ts** - Authentication state
```typescript
import { writable } from 'svelte/store';

export const authStore = writable({
  user: null,
  isAuthenticated: false,
  token: null,
  loading: false,
  error: null
});

// Usage in components
import { authStore } from '$lib/stores/authStore';
<p>User: {$authStore.user.name}</p>
```

**tripStore.ts** - Trip and travel items
```typescript
export const tripStore = writable({
  currentTrip: null,
  trips: [],
  flights: [],
  hotels: [],
  events: [],
  carRentals: [],
  transportation: [],
  companions: [],
  vouchers: [],
  loading: false,
  error: null
});
```

**uiStore.ts** - UI state
```typescript
export const uiStore = writable({
  sidebarOpen: false,
  secondarySidebarOpen: false,
  tertiarySidebarOpen: false,
  activeTab: 'overview',
  loading: false,
  selectedItem: null,
  editMode: false,
  error: null
});
```

### Advantages of Svelte Stores
- **Reactive** - Automatic UI updates when store changes
- **Simple API** - `writable()`, `readable()`, `derived()`
- **Derived stores** - Computed state (`$derived()`)
- **Persistence** - Built-in localStorage integration
- **Debugging** - Store Devtools available
- **Scoped** - No global pollution

### Store Patterns

**Subscribing in Components:**
```svelte
<script lang="ts">
  import { tripStore } from '$lib/stores/tripStore';

  // Auto-subscribe (reactive)
  $: trips = $tripStore.trips;

  // Or manually subscribe
  tripStore.subscribe(data => {
    console.log('Trip store updated:', data);
  });
</script>
```

**Updating Stores:**
```typescript
// In store actions
export function loadTrips() {
  tripStore.update(state => {
    return {
      ...state,
      loading: true
    };
  });
}

// Or directly (if writable)
tripStore.set({ trips: [] });
```

---

## Phase 2 State (TypeScript Services)

### Service Layer with State
```typescript
// services/tripService.ts
import { tripStore } from '$lib/stores/tripStore';

export async function fetchTrips() {
  tripStore.update(state => ({ ...state, loading: true }));

  try {
    const trips = await apiClient.get('/api/trips');
    tripStore.update(state => ({
      ...state,
      trips,
      loading: false
    }));
  } catch (error) {
    tripStore.update(state => ({
      ...state,
      error,
      loading: false
    }));
  }
}
```

### Benefits
- Centralized async logic
- Consistent error handling
- Loading state management
- Cache invalidation handling

---

## State Synchronization Strategies

### Option A: Optimistic Updates (Phase 1)
```typescript
// Assume success immediately
tripStore.update(state => ({
  ...state,
  flights: [...state.flights, newFlight]
}));

// Send to server
apiClient.post('/api/flights', newFlight)
  .catch(error => {
    // Revert on error
    tripStore.update(state => ({
      ...state,
      flights: state.flights.filter(f => f.id !== newFlight.id)
    }));
  });
```

### Option B: Pessimistic Updates (Current)
```typescript
// Wait for server response
const response = await apiClient.post('/api/flights', newFlight);

// Update only after success
if (response.ok) {
  tripStore.update(state => ({
    ...state,
    flights: [...state.flights, response.flight]
  }));
}
```

### Option C: Real-Time Sync (Phase 3)
```typescript
// WebSocket-based synchronization
socket.on('item:created', (item) => {
  tripStore.update(state => ({
    ...state,
    [itemType + 's']: [...state[itemType + 's'], item]
  }));
});
```

---

## Derived State (Computed Properties)

### Svelte `derived()` Stores
```typescript
import { derived } from 'svelte/store';
import { tripStore } from './tripStore';

// Computed: Total flight cost
export const totalFlightCost = derived(
  tripStore,
  $tripStore => {
    return $tripStore.flights.reduce((sum, f) => sum + (f.cost || 0), 0);
  }
);

// Usage in component
<p>Total: ${$totalFlightCost}</p>
```

### Benefits
- Memoized computations
- Automatic updates when source changes
- Performance optimization
- Separation of concerns

---

## State Persistence

### localStorage Integration
```typescript
// Persist specific stores to localStorage
function persistedStore<T>(key: string, initialValue: T) {
  const stored = localStorage.getItem(key);
  const state = stored ? JSON.parse(stored) : initialValue;

  const store = writable(state);

  store.subscribe(value => {
    localStorage.setItem(key, JSON.stringify(value));
  });

  return store;
}

export const preferencesStore = persistedStore('preferences', {
  theme: 'light',
  notifications: true
});
```

### Use Cases
- User preferences
- Recently viewed trips
- Form drafts
- Search history

---

## Testing State Management

### Unit Tests
```typescript
import { get } from 'svelte/store';
import { tripStore } from './tripStore';

test('tripStore updates correctly', () => {
  const initialState = get(tripStore);
  expect(initialState.trips).toEqual([]);

  // Update store
  tripStore.update(state => ({
    ...state,
    trips: [{ id: '1', name: 'My Trip' }]
  }));

  const updatedState = get(tripStore);
  expect(updatedState.trips).toHaveLength(1);
});
```

### Component Tests
```typescript
import { render, screen } from '@testing-library/svelte';
import { tripStore } from './tripStore';
import TripList from './TripList.svelte';

test('renders trips from store', async () => {
  tripStore.set({
    trips: [{ id: '1', name: 'My Trip' }]
  });

  render(TripList);
  expect(screen.getByText('My Trip')).toBeInTheDocument();
});
```

---

## Anti-Patterns to Avoid

### ❌ Direct DOM Manipulation
```typescript
// WRONG - Don't do this
document.querySelector('.trip-name').textContent = trip.name;
```

### ✅ Store-Based Updates
```typescript
// RIGHT - Use stores
tripStore.update(state => ({
  ...state,
  currentTrip: trip
}));
```

---

### ❌ Global Variables
```typescript
// WRONG
window.tripId = '123';
```

### ✅ Store-Based State
```typescript
// RIGHT
tripStore.update(state => ({
  ...state,
  currentTrip: { id: '123' }
}));
```

---

## Related Documentation

- **[AJAX Patterns](./AJAX_PATTERNS.md)** - API communication
- **[Error Handling](./ERROR_HANDLING.md)** - Error state management
- **[Svelte Stores](../LEARNING_RESOURCES/SVELTEKIT_BASICS.md#stores)** - Svelte reference

---

**Last Updated:** 2025-12-17
**Phase 1 Target:** Svelte Stores with service layer
