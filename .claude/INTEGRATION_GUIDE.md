# Frontend-Backend Integration Guide

**Last Updated:** December 22, 2025
**Status:** Production Ready

---

## 🔗 Overview

The Bluebonnet application is a **full-stack** system with:
- **Backend:** Express.js REST API (bluebonnet-dev/)
- **Frontend:** SvelteKit SPA (bluebonnet-svelte/)
- **Database:** PostgreSQL (shared)

These communicate via standard HTTP/REST APIs.

---

## 🔄 Integration Architecture

```
┌──────────────────────────────────┐
│   SvelteKit Frontend              │
│   (bluebonnet-svelte/)            │
│                                   │
│  - Svelte Components              │
│  - TypeScript                     │
│  - Reactive Stores                │
│  - HTTP Client (src/lib/services) │
└──────────────────┬────────────────┘
                   │
         HTTP REST API Calls
         (JSON format)
                   │
┌──────────────────▼────────────────┐
│   Express.js Backend               │
│   (bluebonnet-dev/)                │
│                                   │
│  - API Routes                      │
│  - Controllers (business logic)    │
│  - Models (Sequelize ORM)          │
│  - Middleware (auth, validation)   │
└──────────────────┬────────────────┘
                   │
              SQL Queries
                   │
┌──────────────────▼────────────────┐
│   PostgreSQL Database              │
│   (Shared data store)              │
└────────────────────────────────────┘
```

---

## 🚀 Running Both Systems

### Option 1: Docker (Recommended)
```bash
# Terminal 1: Start backend + database
cd bluebonnet-dev
docker-compose up --build

# Terminal 2: Start frontend
cd ../bluebonnet-svelte
npm install
npm run dev
```

**Ports:**
- Backend: `http://localhost:3500` (Docker) or `http://localhost:3000` (local)
- Frontend: `http://localhost:3001`
- Database: `localhost:5432` (internal only)

### Option 2: Local Development
```bash
# Terminal 1: Backend
cd bluebonnet-dev
npm install
npm run db:sync
npm run db:seed-airports
npm run dev
# Runs on http://localhost:3000

# Terminal 2: Frontend
cd bluebonnet-svelte
npm install
npm run dev
# Runs on http://localhost:3001
```

### Option 3: Frontend Only (for UI development)
```bash
# Terminal 1: Backend still running separately
cd bluebonnet-dev
npm run dev

# Terminal 2: Frontend
cd bluebonnet-svelte
npm run dev

# Frontend automatically proxies to backend (see svelte.config.js)
```

---

## 📡 API Communication

### Frontend API Client

**File:** `bluebonnet-svelte/src/lib/services/api.ts`

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// All requests go through this client
export const api = {
  async fetch(path: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    // Error handling and response transformation
    return response.json();
  },

  get(path: string) { /* ... */ },
  post(path: string, data: any) { /* ... */ },
  put(path: string, data: any) { /* ... */ },
  delete(path: string) { /* ... */ }
};
```

### Making Requests in Components

```svelte
<script lang="ts">
  import { api } from '$lib/services/api';

  let loading = false;
  let trips = [];

  onMount(async () => {
    loading = true;
    try {
      const response = await api.get('/trips');
      trips = response.data;
    } catch (error) {
      console.error('Failed to load trips:', error.message);
    } finally {
      loading = false;
    }
  });
</script>
```

---

## 🔐 Authentication Flow

### How Sessions Work

```
1. User Logs In (frontend)
   └─ POST /api/auth/login
      {email: "user@example.com", password: "..."}

2. Backend Processes Login
   ├─ Finds user
   ├─ Verifies password (bcrypt)
   ├─ Creates session
   ├─ Sets httpOnly cookie
   └─ Returns user info

3. Frontend Stores User Data
   ├─ authStore.set(user)
   ├─ Cookie automatically sent on future requests
   └─ Redirects to /dashboard

4. All Future Requests
   ├─ Frontend: Includes cookies automatically (fetch)
   ├─ Backend: Validates session middleware
   └─ Database: Queries filtered by user ID

5. Logout
   └─ POST /api/auth/logout
      └─ Backend: Destroys session, clears cookie
```

### Protected Routes

**Frontend Protection:**
```typescript
// src/routes/+layout.ts
export async function load({ fetch }) {
  const response = await fetch('/api/auth/me');
  if (!response.ok) {
    redirect(303, '/login');
  }
  return { user: response.json() };
}
```

**Backend Protection:**
```javascript
// routes/api.js
router.get('/trips', ensureAuthenticated, async (req, res) => {
  // req.user contains authenticated user
  const trips = await Trip.findAll({
    where: { userId: req.user.id }  // Always filter by user
  });
  res.json({ success: true, data: trips });
});
```

---

## 📊 Data Flow Examples

### Creating a Trip

```
1. User fills form in TripForm.svelte
   ├─ name: "Paris Adventure"
   ├─ departureDate: "2025-06-01"
   └─ returnDate: "2025-06-10"

2. Form validation (frontend)
   └─ Check required fields, date format, etc.

3. Submit to backend
   └─ POST /api/trips
      {
        "name": "Paris Adventure",
        "departureDate": "2025-06-01",
        "returnDate": "2025-06-10",
        "purpose": "leisure"
      }

4. Backend Process
   ├─ tripController.createTrip()
   ├─ Validate input
   ├─ Check user permissions
   ├─ Trip.create()
   ├─ Database INSERT
   └─ Return created trip

5. Response to Frontend
   {
     "success": true,
     "data": {
       "id": "uuid-1234",
       "userId": "user-uuid",
       "name": "Paris Adventure",
       "departureDate": "2025-06-01",
       "returnDate": "2025-06-10",
       "purpose": "leisure",
       "createdAt": "2025-12-22T..."
     }
   }

6. Frontend State Update
   ├─ Close modal
   ├─ Update tripStore
   └─ Re-render dashboard

7. User sees new trip in list
```

### Editing a Flight

```
1. User clicks "Edit" on flight card
   └─ Opens FlightForm.svelte with flight data

2. User modifies departure time
   └─ Form updates local state (instant UI update)

3. User clicks "Save"
   └─ PUT /api/flights/{flight-id}
      {
        "departureTime": "14:30",
        "origin": "CDG",
        "destination": "JFK"
      }

4. Backend validates and updates
   ├─ Check user owns this flight's trip
   ├─ Validate new data
   ├─ flight.update()
   └─ Return updated flight

5. Frontend updates store and closes form
```

---

## 🔗 API Endpoints Reference

### Authentication
```
POST /api/auth/login
  Request:  { email, password }
  Response: { success, data: { id, email, firstName, lastName } }

GET /api/auth/me
  Response: { success, data: { user object } }

POST /api/auth/logout
  Response: { success }

POST /api/auth/register
  Request:  { email, password, firstName, lastName }
  Response: { success, data: { user object } }
```

### Trips (Complete CRUD)
```
GET /api/trips
  Response: { success, data: [ { trips array } ] }

GET /api/trips/{id}
  Response: { success, data: { trip object with all items } }

POST /api/trips
  Request:  { name, departureDate, returnDate, purpose, isConfirmed }
  Response: { success, data: { created trip } }

PUT /api/trips/{id}
  Request:  { name, departureDate, returnDate, purpose, isConfirmed }
  Response: { success, data: { updated trip } }

DELETE /api/trips/{id}
  Response: { success }
```

### Travel Items (same pattern for all types)
```
GET /api/trips/{id}/flights
  Response: [ flights in this trip ]

POST /api/trips/{id}/flights
  Request:  { origin, destination, departureDateTime, ... }
  Response: { created flight }

PUT /api/flights/{id}
  Request:  { origin, destination, ... }
  Response: { updated flight }

DELETE /api/flights/{id}
  Response: { success }

POST /api/flights  (standalone)
  Request:  { origin, destination, ... }
  Response: { created flight, not attached to trip }
```

### Companions
```
GET /api/trips/{id}/companions
  Response: [ companions for this trip ]

POST /api/trips/{id}/companions
  Request:  { email, permission: "view" | "edit" }
  Response: { created invitation }

DELETE /api/companions/{id}
  Response: { success }
```

### Vouchers
```
GET /api/trips/{id}/vouchers
  Response: [ vouchers for this trip ]

POST /api/vouchers
  Request:  { tripId, code, discount, category }
  Response: { created voucher }

PUT /api/vouchers/{id}
  Request:  { code, discount, category }
  Response: { updated voucher }

DELETE /api/vouchers/{id}
  Response: { success }
```

---

## 🛠️ Environment Configuration

### Frontend (bluebonnet-svelte/.env)
```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Bluebonnet
```

### Backend (bluebonnet-dev/.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bluebonnet
DB_USER=postgres
DB_PASSWORD=your-password

SESSION_SECRET=your-random-secret
NODE_ENV=development
PORT=3000

REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379

LOG_LEVEL=info
```

### Docker (docker-compose.yml)
```yaml
services:
  backend:
    # Express server
    ports:
      - "3500:3000"  # Exposed to host

  frontend:
    # SvelteKit dev server
    ports:
      - "3001:3001"

  postgres:
    # Database
    ports:
      - "5432:5432"  # Only for development

  redis:
    # Session store
    ports: [] # Internal only
```

---

## 🐛 Debugging Integration Issues

### Frontend Can't Connect to Backend

**Symptoms:**
- Network errors in browser console
- "Failed to fetch" messages
- CORS errors

**Solutions:**
```javascript
// Check API URL
console.log(import.meta.env.VITE_API_URL);

// Test backend is running
fetch('http://localhost:3000/api/auth/me')
  .then(r => console.log(r))
  .catch(e => console.error('Backend unreachable:', e));

// Check CORS headers
// In bluebonnet-dev server.js:
const corsOptions = {
  origin: 'http://localhost:3001',  // Frontend URL
  credentials: true                  // Include cookies
};
app.use(cors(corsOptions));
```

### Database Connection Issues

**Symptoms:**
- "connect ECONNREFUSED 127.0.0.1:5432"
- Database queries timing out

**Solutions:**
```bash
# Check if PostgreSQL is running
psql -U postgres -d bluebonnet

# Check database exists
psql -l | grep bluebonnet

# Reset database
npm run db:sync

# Seed initial data
npm run db:seed-airports
```

### Authentication Issues

**Symptoms:**
- Login works but next page shows 401
- Session expires immediately

**Solutions:**
```javascript
// Check session middleware is applied
// In bluebonnet-dev/server.js:
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,  // true in production
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Check passport is configured
app.use(passport.initialize());
app.use(passport.session());
```

---

## 📝 Adding New Endpoints

### 1. Create Backend Endpoint

**File:** `bluebonnet-dev/routes/api/v1/flights.js`
```javascript
router.post('/flights/:id/duplicate', ensureAuthenticated, async (req, res) => {
  try {
    const flight = await Flight.findByPk(req.params.id);
    const duplicate = await Flight.create({
      ...flight.dataValues,
      id: undefined,  // Generate new ID
      createdAt: undefined
    });
    res.json({ success: true, data: duplicate });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### 2. Call from Frontend Component

**File:** `bluebonnet-svelte/src/lib/components/FlightForm.svelte`
```svelte
<script lang="ts">
  async function handleDuplicate(flightId: string) {
    try {
      const response = await api.post(`/flights/${flightId}/duplicate`, {});
      // Handle success
      trips = trips.map(t => ({
        ...t,
        flights: [...t.flights, response.data]
      }));
    } catch (error) {
      alert('Failed to duplicate flight: ' + error.message);
    }
  }
</script>

<button on:click={() => handleDuplicate(flight.id)}>
  Duplicate
</button>
```

---

## 🔄 State Synchronization

### Frontend Store Pattern

```typescript
// src/lib/stores/tripStore.ts
import { writable } from 'svelte/store';
import { api } from './services/api';

export const tripStore = writable({
  trips: [],
  selectedTrip: null,
  loading: false,
  error: null
});

export async function loadTrips() {
  tripStore.update(s => ({ ...s, loading: true }));
  try {
    const response = await api.get('/trips');
    tripStore.update(s => ({
      ...s,
      trips: response.data,
      error: null
    }));
  } catch (error) {
    tripStore.update(s => ({
      ...s,
      error: error.message
    }));
  } finally {
    tripStore.update(s => ({ ...s, loading: false }));
  }
}
```

### Using Store in Components

```svelte
<script lang="ts">
  import { tripStore, loadTrips } from '$lib/stores';

  onMount(() => loadTrips());

  let trips = $tripStore.trips;
</script>

{#if $tripStore.loading}
  <Loading />
{:else if $tripStore.error}
  <Alert type="error">{$tripStore.error}</Alert>
{:else}
  {#each $tripStore.trips as trip}
    <TripCard {trip} />
  {/each}
{/if}
```

---

## ✅ Validation

### Frontend Validation (UX)
```typescript
// Immediate user feedback
if (!tripName.trim()) {
  error = 'Trip name is required';
  return; // Don't send request
}

if (departureDate > returnDate) {
  error = 'Return date must be after departure';
  return;
}
```

### Backend Validation (Security)
```javascript
// Never trust frontend validation
const { name, departureDate, returnDate } = req.body;

if (!name || !name.trim()) {
  return res.status(400).json({
    success: false,
    error: 'Name is required'
  });
}

if (new Date(returnDate) < new Date(departureDate)) {
  return res.status(400).json({
    success: false,
    error: 'Invalid date range'
  });
}

// Proceed with creation
```

---

## 🚀 Deployment Considerations

### Same Origin Requirement
- Frontend and backend should be on same domain (or CORS configured)
- Cookies work with `credentials: true` in fetch

### Production Setup
```
Domain: example.com
├─ Frontend: example.com/ (SvelteKit built/deployed)
├─ API: example.com/api/* (Express routes)
└─ Database: Private network (not exposed)
```

### Docker Deployment
```bash
# Build containers
docker-compose build

# Run
docker-compose up

# Backend at localhost:3500
# Frontend at localhost:3001
```

---

## 📊 Testing Integration

### E2E Test Example
```typescript
// bluebonnet-svelte/src/tests/integration.test.ts
describe('Trip Creation Flow', () => {
  it('should create trip via UI', async () => {
    // 1. Navigate to dashboard
    await page.goto('/dashboard');

    // 2. Click new trip
    await page.click('button:has-text("New Trip")');

    // 3. Fill form
    await page.fill('input[name="name"]', 'Paris Trip');
    await page.fill('input[name="departureDate"]', '2025-06-01');
    await page.fill('input[name="returnDate"]', '2025-06-10');

    // 4. Mock API response
    await page.route('/api/trips', async route => {
      await route.abort('Trip created', { status: 201 });
    });

    // 5. Submit
    await page.click('button:has-text("Save")');

    // 6. Verify success
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Paris Trip')).toBeVisible();
  });
});
```

---

## 📞 Support & Debugging

**Check logs:**
```bash
# Frontend console
# Open DevTools (F12) → Console tab

# Backend logs
npm run dev 2>&1 | tee backend.log

# Database
psql -U postgres -d bluebonnet -c "SELECT * FROM trips;"
```

**Common issues:**
- Port already in use: `lsof -i :3000`
- Database not initialized: `npm run db:sync`
- Missing environment variables: Check `.env` files
- CORS errors: Check backend CORS config

---

**Status:** Integration tested and production-ready
**Confidence:** High - daily usage verified
