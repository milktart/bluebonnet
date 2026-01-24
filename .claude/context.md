# Bluebonnet Context

**Current Stack:** Express + EJS + Vanilla JS + PostgreSQL
**Phase:** 0 (Stabilization) → Phase 1 (Svelte Migration, Q1 2026)

---

## Core Stack

**Backend:** Express.js (Node.js)
**Frontend:** EJS templates + Vanilla JavaScript
**Database:** PostgreSQL + Sequelize ORM
**Cache:** Redis
**DevOps:** Docker + Docker Compose

---

## Database Schema (Key Entities)

```
User (1) ─→ (many) Trip
User (1) ─→ (many) TravelCompanion [as creator]
User (1) ─→ (1) TravelCompanion [as profile, optional]

Trip (1)
├─→ (many) Flight
├─→ (many) Hotel
├─→ (many) Event
├─→ (many) CarRental
├─→ (many) Transportation
├─→ (many) TravelCompanion [via TripCompanion]
└─→ (many) Voucher

TravelCompanion ←→ Trip [many-to-many via TripCompanion]
TripCompanion [junction: tracks canEdit, addedBy]

Voucher (1)
└─→ (many) VoucherAttachment [links to flights/items, assigns to companions]
```

**Key Design:** All child items CASCADE DELETE when parent Trip deleted.

---

## File Organization

### Backend (`controllers/`, `models/`, `routes/`)

- **Controllers:** `authController.js`, `tripController.js` (60KB!), `flightController.js`, `hotelController.js`, `eventController.js`, `carRentalController.js`, `transportationController.js`, `companionController.js`, `voucherController.js`, `accountController.js`
- **Models:** User, Trip, Flight, Hotel, Event, CarRental, Transportation, TravelCompanion, TripCompanion, Voucher, VoucherAttachment, Notification
- **Routes:** `/auth`, `/trips`, `/flights`, `/hotels`, `/events`, `/car-rentals`, `/transportation`, `/companions`, `/vouchers`, `/api/v1/*`
- **Middleware:** `auth.js` (ensureAuthenticated, forwardAuthenticated), `validation.js` (form validators)

### Frontend (`views/`, `public/js/`)

- **Views:** EJS templates in `views/`
  - Main: `dashboard.ejs`, `trips/trip-view.ejs`, `account/`.
  - Partials: `flight-form.ejs`, `hotel-form.ejs`, `event-form.ejs`, etc.
- **JavaScript:** Modular files in `public/js/`
  - Core: `sidebar-loader.js`, `async-form-handler.js`, `trip-view-sidebar.js`, `main.js`
  - Utils: `form-utilities.js`, `datetime-formatter.js`, `airport-autocomplete.js`, `maps.js`, `calendar.js`
  - Event system: `event-delegation.js`, `eventBus.js`

### Data (`data/`)

- `airports.json` - 7,000+ airports (seeded to DB on startup)
- `airlines.json` - Airline codes and names

---

## Features (All Active)

| Feature            | CRUD | Status | Notes                                  |
| ------------------ | ---- | ------ | -------------------------------------- |
| **Trip**           | ✅   | Active | Create, view, edit, delete trips       |
| **Flight**         | ✅   | Active | Flights with timezone inference        |
| **Hotel**          | ✅   | Active | Accommodations with check-in/out       |
| **Event**          | ✅   | Active | Activities & attractions               |
| **Car Rental**     | ✅   | Active | Vehicle rentals                        |
| **Transportation** | ✅   | Active | Ground transport (taxi, shuttle, etc.) |
| **Companions**     | ✅   | Active | Invite people, set permissions         |
| **Vouchers**       | ✅   | Active | Track travel credits/upgrades          |
| **Calendar**       | ✅   | Active | Timeline view of trip items            |
| **Maps**           | ✅   | Active | Location visualization                 |

**Special:** All items are optional (can create standalone). Trip items CAN be attached to a trip.

---

## Key Technical Decisions

1. **UUID Primary Keys** - All tables use UUID v4 for IDs
2. **UTC Storage** - All dates stored in UTC (GMT-0), timezone info stored separately
3. **CASCADE DELETE** - Deleting trip deletes all its items
4. **No Alerts/Confirms** - All CRUD operations silent (no confirm dialogs)
5. **AJAX Pattern** - Frontend uses `X-Async-Request` header for async operations
6. **Three-Sidebar Layout** - Dashboard and trip view use floating sidebars (primary, secondary, tertiary)

---

## Common Patterns

### AJAX Request Detection (Backend)

```javascript
const isAsyncRequest = req.get('X-Async-Request') === 'true';
if (isAsyncRequest) {
  return res.json({ success: true, data: item });
} else {
  res.redirect(`/trips/${tripId}`);
}
```

### Form Submission (Frontend)

1. User fills form in sidebar
2. JavaScript intercepts submit (X-Async-Request header added)
3. Backend validates, creates/updates item
4. Returns JSON response
5. Frontend silently refreshes sidebars/maps (no notifications)

### Sidebar Navigation

1. Click "Add Item" or "Edit Item"
2. `loadSidebarContent(url)` fetches form via AJAX
3. Form loads into secondary sidebar
4. Form submission calls `setupAsyncFormSubmission()`
5. On success, `refreshTripView()` or `refreshDashboardSidebar()` updates UI

---

## Important Notes

- **Timezone Handling:** Flights stored with `originTimezone` / `destinationTimezone` (e.g., "America/New_York")
- **Date Format (Display):** "DD MMM YYYY" (e.g., "15 Oct 2025")
- **Time Format (Display):** "HH:MM" 24-hour (e.g., "14:30")
- **Port:** 3000 (local), 3500 (Docker)
- **Database Init:** Docker auto-initializes DB on first run
- **Logging:** Winston logger (never console.log)
- **Cache:** Redis for sessions, airport data caching
- **Authentication:** Passport.js local strategy (email/password)

---

## Environment Variables (Key)

**Required:**

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bluebonnet
DB_USER=postgres
DB_PASSWORD=...
SESSION_SECRET=...
NODE_ENV=development
```

**Optional (with defaults):**

- `PORT=3000` - Server port
- `REDIS_ENABLED=true` - Enable Redis
- `REDIS_HOST=localhost`, `REDIS_PORT=6379`
- `NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org` - Geocoding API
- `LOG_LEVEL=info` - Winston log level

---

## Phase 1 Plan (Svelte Migration)

**Timeline:** Q1 2026, ~12 weeks

**Approach:**

1. Keep Express backend unchanged
2. Add SvelteKit frontend alongside EJS
3. Migrate features one-by-one to Svelte
4. Eventually replace EJS entirely
5. Keep using Express backend as API

**Result:** Modern, component-based frontend, proven backend

---

## Quick Links

- **Development:** See `.claude/development-quick-ref.md`
- **Patterns:** See `.claude/patterns.md`
- **Features:** See `.claude/features.md`
- **Architecture:** See `.claude/ARCHITECTURE/BACKEND/README.md` or `FRONTEND/README.md`
- **Data Model:** See `.claude/ARCHITECTURE/DATA_MODEL/README.md`

---

**Last Updated:** 2025-12-18
**Version:** 1.0 (Consolidated from 10+ docs)
**Size:** ~3 KB (vs 44 KB original)
