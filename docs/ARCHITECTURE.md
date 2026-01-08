# Bluebonnet Architecture Overview

**Last Updated:** December 30, 2025
**Status:** Phase 1 Complete - Svelte Migration
**Stack:** Express.js (Backend) + SvelteKit (Frontend) + PostgreSQL (Database)

---

## Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [Backend Structure](#backend-structure)
3. [Frontend Structure](#frontend-structure)
4. [Database Layer](#database-layer)
5. [API Conventions](#api-conventions)
6. [Authentication Flow](#authentication-flow)
7. [Data Flow Examples](#data-flow-examples)
8. [Deployment Architecture](#deployment-architecture)

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Browser (Frontend)                    │
│         SvelteKit + TypeScript (Port 3001)              │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Routes: /, /login, /register, /dashboard           │ │
│  │ State: Svelte Stores (auth, trip, ui)              │ │
│  │ Components: 45+ reusable UI components             │ │
│  │ Styling: Tailwind CSS v4 (utility-first)           │ │
│  └────────────────────────────────────────────────────┘ │
└────────────────────┬─────────────────────────────────────┘
                     │ REST API (JSON)
                     │ Session Cookies
                     ↓
┌──────────────────────────────────────────────────────────┐
│                 Backend (Express.js)                     │
│            Port 3000 (local) / 3500 (docker)            │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Routes: /auth, /api/v1/* (REST endpoints)         │ │
│  │ Controllers: Business logic handlers               │ │
│  │ Services: Data access & business operations        │ │
│  │ Models: Sequelize ORM (PostgreSQL)                │ │
│  │ Middleware: Auth, logging, error handling          │ │
│  └────────────────────────────────────────────────────┘ │
└────────────────────┬─────────────────────────────────────┘
                     │ SQL Queries
                     ↓
┌──────────────────────────────────────────────────────────┐
│              PostgreSQL Database                         │
│              Port 5432                                   │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Users, Trips, Travel Items, Companions, Vouchers  │ │
│  │ UUID PKs, Cascading deletes, 20+ indexes          │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
                     │ Cache lookups
                     ↓
┌──────────────────────────────────────────────────────────┐
│              Redis Cache (Optional)                      │
│              Port 6379                                   │
│  Airports, trips, companions (TTL: 1min-24h)           │
└──────────────────────────────────────────────────────────┘
```

---

## Backend Structure

### Directory Organization

```
├── config/              # Configuration files
│   ├── database.js      # Sequelize config (dev/test/prod)
│   └── passport.js      # Authentication strategy
├── controllers/         # HTTP request handlers
│   ├── tripController.js
│   ├── flightController.js
│   ├── authController.js
│   └── ...
├── models/              # Sequelize ORM models
│   ├── User.js
│   ├── Trip.js
│   ├── Flight.js, Hotel.js, Event.js
│   └── ...
├── services/            # Business logic & data access
│   ├── BaseService.js (common CRUD)
│   ├── TripService.js
│   ├── CacheService.js
│   └── ...
├── middleware/          # Express middleware
│   ├── auth.js (ensureAuthenticated)
│   ├── errorHandler.js (error classes)
│   ├── requestLogger.js (Winston logging)
│   └── validation.js
├── routes/              # API endpoints
│   ├── index.js (main routes)
│   ├── auth.js (login/register)
│   └── api/v1/         # REST API v1
│       ├── trips.js
│       ├── flights.js
│       ├── ...
│       └── index.js (route aggregator)
├── utils/               # Helper utilities
│   ├── apiResponse.js (standardized responses)
│   ├── logger.js (Winston logger)
│   ├── dateFormatter.js
│   └── ...
├── migrations/          # Database schema changes
└── server.js            # Main entry point
```

### Request Flow

Every backend request follows this path:

```
Request
  ↓
Middleware Stack (auth, validation, logging)
  ↓
Route Handler (/routes/api/v1/*)
  ↓
Controller (validates, orchestrates)
  ↓
Service (business logic, caching)
  ↓
Model (database query via Sequelize)
  ↓
Database (PostgreSQL)
  ↓
Response (apiResponse.success/error)
```

### Key Patterns

**Service Layer Pattern:**

- Controllers delegate to services
- Services handle business logic and caching
- Models are thin data access layers
- BaseService provides common CRUD operations

**Error Handling:**

- Custom error classes (ValidationError, AuthenticationError, etc.)
- Middleware catches and formats errors
- Standardized error response format

**Caching:**

- CacheService wraps Redis operations
- TTL configuration per data type
- Manual invalidation on data changes

**Logging:**

- Winston logger with levels (error, warn, info, debug)
- Request logger middleware tracks all HTTP operations
- Includes timing, status codes, user IDs

---

## Frontend Structure

### Directory Organization

```
frontend/
├── src/
│   ├── routes/               # SvelteKit pages
│   │   ├── +layout.svelte   # Root layout (auth wrapper)
│   │   ├── +page.svelte     # Landing page
│   │   ├── login/
│   │   ├── register/
│   │   ├── dashboard/       # Main app page (2913 lines)
│   │   │   ├── +page.svelte (monolithic - TO BE SPLIT)
│   │   │   ├── +page.server.ts (data loading)
│   │   │   └── +layout.server.ts (auth check)
│   │   └── logout/
│   │
│   ├── lib/
│   │   ├── components/      # 45 reusable Svelte components
│   │   │   ├── Forms (TripForm, FlightForm, etc.)
│   │   │   ├── Layouts (MapLayout, three-sidebar)
│   │   │   ├── Cards (TripCard, CompanionIndicators)
│   │   │   └── Utilities (Alert, Modal, Loading)
│   │   │
│   │   ├── stores/          # Svelte stores (state management)
│   │   │   ├── authStore.ts (user, session)
│   │   │   ├── tripStore.ts (trips, items, companions)
│   │   │   └── uiStore.ts (sidebars, modals)
│   │   │
│   │   ├── services/        # API client
│   │   │   └── api.ts (centralized HTTP client)
│   │   │       ├── tripsApi
│   │   │       ├── flightsApi
│   │   │       └── ... (all CRUD operations)
│   │   │
│   │   ├── utils/           # Helper functions
│   │   │   ├── dateFormatter.ts
│   │   │   ├── timezoneHelper.ts
│   │   │   └── ...
│   │   │
│   │   └── styles/          # CSS modules
│   │       ├── form-styles.css
│   │       └── ...
│   │
│   ├── app.css              # Global Tailwind + form styles
│   └── hooks.server.ts      # Server hooks (auth verification)
│
└── svelte.config.js         # SvelteKit config
```

### Page Routes

**Public Routes:**

- `/` - Landing page
- `/login` - Login form
- `/register` - Registration form

**Protected Routes:**

- `/dashboard` - Main application (all features on one page overlaid on map)
  - Three-sidebar layout system
  - All CRUD operations for items
  - Trip management
  - Companion management
  - Voucher management

**Note:** Architecture principle states "everything is dashboard" - all features are accessed from the single `/dashboard` route, overlaid on a Leaflet map with three-sidebar system.

### State Management Pattern

Three Svelte Stores manage all application state:

**authStore:**

```typescript
{
  user: User | null,
  isAuthenticated: boolean,
  loading: boolean,
  error: string | null
}
```

- Persisted to localStorage
- Auto-restored on app mount
- Handles login/logout

**tripStore:**

```typescript
{
  currentTrip: Trip | null,
  trips: Trip[],
  flights: Flight[],
  hotels: Hotel[],
  events: Event[],
  // ... other item types
  companions: TravelCompanion[],
  loading: boolean,
  error: string | null
}
```

- Stores all trips and items
- Actions for CRUD operations
- Maintains both single current trip and list

**uiStore:**

```typescript
{
  sidebarOpen: boolean,
  secondarySidebarOpen: boolean,
  tertiarySidebarOpen: boolean,
  activeTab: string,
  selectedItem: string | null,
  notification: string | null
}
```

- Sidebar visibility states
- Tab management
- Notifications with auto-clear

### Component Hierarchy

- `+layout.svelte` (root, auth wrapper, global styles)
  - Routes (landing, login, register, dashboard)
  - `+page.svelte` (main dashboard - 2913 lines)
    - MapLayout (three-sidebar container)
      - MapVisualization (Leaflet map)
      - Primary Sidebar (trips list)
      - Secondary Sidebar (forms)
      - Tertiary Sidebar (details/maps)

### API Client Pattern

Centralized `api.ts` service with:

- Dynamic URL resolution (Docker, local, remote)
- Automatic credential handling
- Consistent error mapping
- Session-based auth (no JWT tokens)
- Namespaced API functions

```typescript
// Usage
const trips = await tripsApi.list({ filter: 'upcoming' });
const trip = await tripsApi.get(tripId);
const newTrip = await tripsApi.create({ name, departureDate });
await tripsApi.update(tripId, { name });
await tripsApi.delete(tripId);
```

---

## Database Layer

### Entity Relationships

```
User
├─ 1:N → Trips (cascade delete)
├─ 1:N → TravelCompanions (created by)
└─ M:N ← TravelCompanions (linked account)

Trip
├─ 1:N → Flights (cascade delete)
├─ 1:N → Hotels (cascade delete)
├─ 1:N → Events (cascade delete)
├─ 1:N → Transportation (cascade delete)
├─ 1:N → CarRentals (cascade delete)
├─ M:N → TravelCompanions (via TripCompanion)
└─ 1:N → Vouchers (cascade delete)

TravelCompanion
├─ M:N → Trips (via TripCompanion)
└─ 1:N → ItemCompanions (cascade delete)

Travel Items (Flights, Hotels, Events, etc.)
└─ M:N → TravelCompanions (via ItemCompanion)
```

### Key Features

- **UUID Primary Keys:** All tables use UUID v4 for IDs
- **Automatic Timestamps:** createdAt, updatedAt on all tables
- **Cascade Deletes:** Deleting parent automatically deletes children
- **Optional FK:** Travel items can exist without a trip (userId nullable)
- **Polymorphic Relationships:** ItemCompanion uses itemType enum to reference different item tables
- **Timezone Support:** Location-specific timezone fields with UTC storage

### Indexes

Performance-critical indexes on:

- User.email (unique)
- TravelCompanion.email (unique)
- TripCompanion(tripId, companionId)
- ItemCompanion(itemType, itemId)
- Status fields for filtering
- Foreign key columns

---

## API Conventions

### Response Format

All API responses follow a standard format:

**Success Response:**

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation description"
}
```

**Paginated Response:**

```json
{
  "success": true,
  "data": [ ... ],
  "message": "...",
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "totalItems": 100,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Error description",
  "errors": [{ "field": "email", "message": "Invalid email format" }]
}
```

### HTTP Status Codes

- `200 OK` - Successful GET/PUT
- `201 Created` - Successful POST
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Constraint violation (e.g., duplicate email)
- `500 Internal Server Error` - Unexpected error

### Endpoint Patterns

**RESTful Endpoints:**

```
GET    /api/v1/{resource}              - List all
GET    /api/v1/{resource}?page=1       - Paginated list
GET    /api/v1/{resource}/search?q=... - Search
GET    /api/v1/{resource}/{id}         - Get one
POST   /api/v1/{resource}              - Create
PUT    /api/v1/{resource}/{id}         - Update
DELETE /api/v1/{resource}/{id}         - Delete
```

**Query Parameters:**

- `filter` - Filter results (upcoming/past/all for trips)
- `page` - Page number (1-based)
- `limit` - Items per page
- `q` - Search query

---

## Authentication Flow

### Session-Based Authentication

1. **Login:** User submits email + password
2. **Passport.js:** LocalStrategy finds user, validates password via bcrypt
3. **Session:** User ID stored in session (Redis in prod, memory in dev)
4. **Cookie:** httpOnly secure cookie sent to client
5. **Subsequent Requests:** Cookie automatically included, deserialized to req.user
6. **Middleware:** ensureAuthenticated checks req.user, redirects if not authenticated

### Protected Routes

All `/api/v1/*` endpoints use `ensureAuthenticated` middleware:

```javascript
router.use(ensureAuthenticated);
```

Frontend checks authentication via:

- `+layout.server.ts` - Server-side auth check before page load
- `hooks.server.ts` - Global session validation
- `authStore` - Client-side state management

### Logout

- POST `/auth/logout` - Destroys session
- Client clears authStore
- Redirects to `/login`

---

## Data Flow Examples

### Creating a Trip

```
Frontend                          Backend                  Database
├─ User clicks "Create Trip"
├─ Form submission
│  (Content-Type: application/json)
│                                 POST /api/v1/trips
│                                 ├─ Verify auth
│                                 ├─ Validate input
│                                 ├─ Controller routes to service
│                                 │
│                                 Service layer:
│                                 ├─ tripService.createTrip()
│                                 ├─ Invalidate user cache
│                                 │
│                                 Model layer:
│                                 └─ Trip.create()
│                                                          ├─ INSERT into trips
│                                                          ├─ Return new row
│                                 ├─ Respond with Trip object
│ Response received
├─ tripStore.addTrip()
└─ UI updates with new trip
```

### Fetching Trip Details

```
Frontend                          Backend                  Cache/Database
├─ User clicks trip
├─ Dispatch tripsApi.get(tripId)
│                                 GET /api/v1/trips/:id
│                                 ├─ Verify auth
│                                 ├─ Service gets trip
│                                 │
│                                 CacheService:
│                                 ├─ Check cache for trip:123
│                                                          ❌ Cache miss
│                                 ├─ Query database
│                                                          ├─ SELECT * FROM trips
│                                                          ├─ SELECT * FROM flights
│                                                          ├─ SELECT * FROM companions
│                                                          └─ Return combined data
│                                 ├─ Cache result (5min TTL)
│ Response received
├─ tripStore.setCurrentTrip()
└─ Dashboard renders with items
```

---

## Deployment Architecture

### Local Development

```
Frontend (npm run dev)
  ↓ localhost:3001
Backend (npm run dev)
  ↓ localhost:3000
PostgreSQL
  ↓ localhost:5432
```

### Docker Compose

```
docker-compose up --build

Services:
  - backend (port 3500)
  - frontend (port 3001)
  - postgres (port 5432)
  - redis (port 6379, optional)
```

### Production Considerations

- **Frontend:** Build and serve via CDN or static host
- **Backend:** Serve API endpoints, handle sessions via Redis
- **Database:** Managed PostgreSQL service (AWS RDS, etc.)
- **Cache:** Redis for sessions and data caching
- **HTTPS:** Required for secure cookies
- **CORS:** Configured for frontend domain

---

## Key Files Reference

| File                                          | Purpose                            |
| --------------------------------------------- | ---------------------------------- |
| `/server.js`                                  | Main entry point, middleware setup |
| `/types.ts`                                   | TypeScript type definitions        |
| `/config/passport.js`                         | Authentication strategy            |
| `/config/database.js`                         | Database configuration             |
| `/middleware/auth.js`                         | Authentication guards              |
| `/routes/api/v1/trips.js`                     | Trip API endpoints (example)       |
| `/controllers/tripController.js`              | Trip business logic                |
| `/services/TripService.js`                    | Trip data access                   |
| `/models/Trip.js`                             | Trip model definition              |
| `/frontend/src/routes/dashboard/+page.svelte` | Main dashboard (to be split)       |
| `/frontend/src/lib/stores/tripStore.ts`       | Trip state management              |
| `/frontend/src/lib/services/api.ts`           | API client                         |

---

## Getting Started as New Developer

1. Read [`CLAUDE.md`](../CLAUDE.md) for quick start commands
2. Check this file for architecture overview
3. Review [`patterns.md`](../.claude/patterns.md) for common code patterns
4. Explore `/models` to understand data structures
5. Check `/services` to understand business logic
6. Review `/frontend/src/lib/stores` for state management

---

## Next Steps (Modernization)

See `/home/home/.claude/plans/gentle-twirling-codd.md` for detailed modernization plan:

- **Week 1:** Quick wins (cleanup, documentation)
- **Weeks 2-4:** Dashboard decomposition (split 2913-line component)
- **Weeks 5-8:** Backend enhancements (TypeScript, OpenAPI, validation)
