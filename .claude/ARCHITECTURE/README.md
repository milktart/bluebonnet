# 🏗️ Architecture Documentation

Complete documentation of how Bluebonnet is organized and how systems interact.

---

## Quick Navigation

- **[Current State](./CURRENT_STATE.md)** - How the system works now (Express + EJS + Vanilla JS)
- **[Backend](./BACKEND/README.md)** - Controllers, models, routes, services
- **[Frontend](./FRONTEND/README.md)** - JavaScript, Svelte, styling, interactions
- **[Data Model](./DATA_MODEL/README.md)** - Entities, relationships, database
- **[Integrations](./INTEGRATIONS/README.md)** - External services, APIs

---

## High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PHASE 1 (Current Work)                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐           ┌──────────────────┐        │
│  │   SvelteKit      │           │  Express.js      │        │
│  │   Frontend       │◄──────────►│  Backend         │        │
│  │   (New - Svelte) │  JSON API  │  (Existing)      │        │
│  └──────────────────┘           └──────────────────┘        │
│                                         │                   │
│                                         ▼                   │
│                                   ┌──────────────┐          │
│                                   │  PostgreSQL  │          │
│                                   │  Database    │          │
│                                   └──────────────┘          │
│                                         │                   │
│                                         ▼                   │
│                                   ┌──────────────┐          │
│                                   │   Redis      │          │
│                                   │   Cache      │          │
│                                   └──────────────┘          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Current Stack (Phase 1 Target)

- **Frontend:** Svelte + SvelteKit
- **Backend:** Express.js + Node.js
- **Database:** PostgreSQL + Sequelize ORM
- **Cache:** Redis
- **API:** RESTful JSON API

---

## Component Breakdown

### Frontend Layer (Replacing EJS + Vanilla JS)

**Svelte Components:**

- Page components (`+page.svelte`)
- Form components (FlightForm, HotelForm, etc.)
- Layout components (Sidebars, PageLayout)
- Data components (Tables, Cards)

**State Management:**

- Svelte Stores (authStore, tripStore, uiStore)
- Reactive bindings
- Store subscriptions

**Communication:**

- API service layer
- Fetch requests with auth headers
- Error handling

See: [Frontend Architecture](./FRONTEND/README.md)

### Backend Layer (Express + Controllers)

**Route Handlers:**

- Auth routes (`/api/auth`)
- Trip routes (`/api/trips`)
- Item routes (`/api/flights`, `/api/hotels`, etc.)

**Controllers:**

- Authentication
- Trip management
- Resource CRUD (flights, hotels, etc.)
- Companion management

**Services:**

- Business logic
- Database queries
- Validation
- External API calls (geocoding, etc.)

See: [Backend Architecture](./BACKEND/README.md)

### Data Model

**Core Entities:**

- User
- Trip
- Flight, Hotel, Event, Transportation, CarRental
- TravelCompanion
- Voucher
- And relationships between them

See: [Data Model](./DATA_MODEL/README.md)

### External Integrations

- **Nominatim API** - Geocoding (OpenStreetMap)
- **Airport Data** - Local JSON + PostgreSQL
- **Redis** - Caching layer

See: [Integrations](./INTEGRATIONS/README.md)

---

## Data Flow Example: Creating a Flight

### User clicks "Add Flight" in Svelte Frontend

1. **UI (Svelte Component):**
   - User fills flight form
   - Svelte component collects data
   - Component calls API service

2. **API Client (src/lib/services/api.ts):**
   - Serializes form data to JSON
   - Adds auth headers
   - Makes POST request to `/api/trips/:tripId/flights`

3. **Backend Route (routes/flights.js):**
   - Receives request
   - Routes to `flightController.createFlight()`

4. **Controller (controllers/flightController.js):**
   - Validates trip ownership
   - Calls `flightService.createFlight()`
   - Returns JSON response

5. **Service (services/flightService.js - Future):**
   - Validates data
   - Geocodes origin/destination
   - Handles timezone conversion
   - Calls database model

6. **Model (models/Flight.js):**
   - Creates database record
   - Returns created flight object

7. **Response Back to Frontend:**
   - JSON sent back to API client
   - Svelte store updated
   - Component reactively updates
   - UI reflects new flight

### Result:

- Flight created in database
- User sees flight in trip
- No page reload
- Real-time UI update

See: [CRUD Pattern](../PATTERNS/CRUD_PATTERN.md)

---

## Request Flow Diagram

```
Frontend (Svelte)
    ↓
    └─→ Form submission
         ↓
         └─→ API Client (api.ts)
              ↓
              └─→ fetch() with headers
                   ↓
                   └─→ Backend Route Handler
                        ↓
                        └─→ Controller
                             ↓
                             └─→ Service (validates, geocodes, etc.)
                                  ↓
                                  └─→ Model (Sequelize)
                                       ↓
                                       └─→ PostgreSQL
                                            ↓
                                            Database record created
                                            ↓
                                            ← JSON response

Frontend
    ↓
    ← API response received
    └─→ Store updated
         ↓
         └─→ Component reactively re-renders
              ↓
              └─→ UI updated
```

---

## Directory Structure

### Backend (Express)

```
controllers/        ← Route handlers
├── helpers/        ← Shared utilities (geocoding, redirects)
models/             ← Sequelize models
services/           ← Business logic (future)
routes/             ← Express routes
middleware/         ← Authentication, validation
utils/              ← General utilities
```

### Frontend (Svelte)

```
src/
├── routes/         ← Page components (+page.svelte)
├── lib/
│   ├── components/ ← Reusable components
│   ├── stores/     ← Svelte stores
│   ├── services/   ← API client
│   └── utils/      ← Utilities
├── app.svelte      ← Root layout
└── app.css         ← Global styles
```

### Database

```
PostgreSQL
├── users
├── trips
├── flights
├── hotels
├── events
├── transportation
├── car_rentals
├── travel_companions
├── trip_companions
├── vouchers
└── ...
```

---

## Key Architectural Decisions

### Why Express?

- Lightweight, flexible
- Large ecosystem
- Easy to integrate with Svelte
- Good for API development

See: [ADR 001](../DECISIONS/ADR_001_EXPRESS.md)

### Why Svelte (Phase 1)?

- Smallest bundle size
- Best developer experience
- Reactive by default
- Great for travel planning UI

See: [ADR 005](../DECISIONS/ADR_005_SVELTE.md)

### Why PostgreSQL?

- Robust, reliable
- Great for relational data
- Good for travel data (trips, items, relationships)

See: [ADR 004](../DECISIONS/ADR_004_POSTGRES_REDIS.md)

---

## Getting Started

### New Developer?

1. Read [Current State](./CURRENT_STATE.md) - 10 min
2. Read [Backend Overview](./BACKEND/README.md) - 10 min
3. Read [Frontend Overview](./FRONTEND/README.md) - 10 min
4. Read specific [Data Model](./DATA_MODEL/README.md) section for feature you're working on

### Making a Change?

1. Check [Patterns Documentation](../PATTERNS/) for your use case
2. Follow pattern for backend and frontend
3. Check [Testing Guide](../TESTING/) for test coverage

### New to Svelte?

1. [Svelte Basics](../LEARNING_RESOURCES/SVELTE_BASICS.md) - Quick reference
2. [Phase 1 Setup](../MODERNIZATION/PHASE_1_SVELTE_SETUP.md) - Getting started
3. [Building Components](../MODERNIZATION/PHASE_1_COMPONENTS.md) - Component patterns

---

## Related Documentation

- **[Patterns](../PATTERNS/README.md)** - Design patterns used throughout
- **[Components](../COMPONENTS/README.md)** - Component specifications
- **[Features](../FEATURES/README.md)** - Feature-specific guides
- **[Modernization](../MODERNIZATION/README.md)** - Phase 1, 2, 3 roadmap
- **[Troubleshooting](../TROUBLESHOOTING/README.md)** - Common issues

---

**Last Updated:** 2025-12-17
