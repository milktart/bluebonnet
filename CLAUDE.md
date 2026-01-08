# Bluebonnet - Development Quick Start

**Current Stack:** Express + PostgreSQL (Backend) ✅ SvelteKit + TypeScript (Frontend)
**Phase:** Phase 1 (Svelte Migration) - ✅ COMPLETE (December 28, 2025)
**Latest Update:** Svelte frontend integrated into `/frontend/` directory, EJS views archived

---

## 🚀 Quick Start

**Frontend & Backend Running Together:**

### Option 1: Docker (Recommended, 5 minutes)
```bash
# Backend + Database + Frontend (all together)
docker-compose up --build
# Backend at http://localhost:3500
# Frontend at http://localhost:3001
```

### Option 2: Local Development (15 minutes)
```bash
# Backend setup
npm install
npm run db:sync
npm run db:seed-airports
npm run dev
# Backend at http://localhost:3000

# Frontend setup (new terminal)
cd ./frontend
npm install
npm run dev
# Frontend at http://localhost:3001
```

### Frontend-Only Development
```bash
cd ./frontend
npm install
npm run dev
# Frontend at http://localhost:3001
# (Requires backend running separately)
```

---

## 📚 Essential Documentation

All documentation is in `.claude/` directory for token efficiency.

### For New Developers (Start Here)
1. **[Context](/.claude/context.md)** (5 min) - Stack, database, key decisions
2. **[Quick Ref](/.claude/development-quick-ref.md)** (5 min) - Commands, environment vars
3. **[Patterns](/.claude/patterns.md)** (10 min) - AJAX, CRUD, sidebar patterns
4. **[Features](/.claude/features.md)** (10 min) - What's implemented, where

### For Code Changes
- **[Patterns](/.claude/patterns.md)** - AJAX forms, CRUD operations, sidebar loading
- **[Features](/.claude/features.md)** - Which features exist, file locations
- **[Backend Details](/.claude/ARCHITECTURE/BACKEND/README.md)** - Controllers, models, routes
- **[Frontend Details](/.claude/ARCHITECTURE/FRONTEND/README.md)** - JavaScript, forms, sidebars

### For Debugging
- **[Quick Ref - Debugging](/.claude/development-quick-ref.md#debugging-tips)** - Browser console, network tab
- **[Data Model](/.claude/ARCHITECTURE/DATA_MODEL/README.md)** - Database relationships
- **[Troubleshooting](/.claude/TROUBLESHOOTING/README.md)** - Common issues

---

## 🎯 Common Tasks

### Add a form field to a feature
1. Update model: `models/{Feature}.js`
2. Update controller: `controllers/{feature}Controller.js`
3. Update form: `views/partials/{feature}-form.ejs`
4. Update JavaScript validation if needed

### Debug a feature not working
1. Open DevTools (F12) → Console tab
   - Check: `window.tripId`, `window.tripData`, `typeof editItem`
2. Check Network tab
   - Look for failed requests (red), check response
   - Verify `X-Async-Request: true` header is sent
3. Check server logs
   - `LOG_LEVEL=debug npm run dev`

### Create a new travel item type
See [Features](/.claude/features.md#adding-a-new-feature-template)

---

## 🛠️ Essential Commands

```bash
# Running
npm run dev              # Local development (port 3000)
docker-compose up       # Docker development (port 3500)

# Database
npm run db:sync              # Create/update schema
npm run db:seed-airports     # Import airports

# Testing
npm test                # All tests
npm run test:coverage   # Coverage report

# Building
npm run build-css       # Watch Tailwind
npm run build-css-prod  # Minify

# Code Quality
npm run lint           # Check style
npm run format         # Auto-format
```

---

## 📋 Key Concepts

**All travel items** (Flight, Hotel, Event, Car Rental, Transportation):
- Follow identical CRUD pattern
- Can be created standalone or attached to trip
- Cascade delete when trip deleted
- Use AJAX forms with `X-Async-Request` header

**Three-sidebar layout:**
- Primary (fixed) - Navigation
- Secondary (on-demand) - Forms/details
- Tertiary (on-demand) - Maps/additional info

**No confirmation pattern:**
- No `confirm()` dialogs
- No `alert()` messages
- Operations execute silently
- UI updates via AJAX

**Authentication:**
- Passport.js local strategy (email/password)
- Session-based (express-session)
- Redis caching

---

## 📁 File Organization

```
.claude/
├── context.md                  # Stack, DB, decisions
├── patterns.md                 # AJAX, CRUD, forms
├── features.md                 # Features matrix
├── development-quick-ref.md    # Commands, debug
├── ARCHIVE/                    # Phase 2-3 planning
├── ARCHITECTURE/
│   ├── BACKEND/README.md      # Controllers, models, routes
│   ├── FRONTEND/README.md     # JavaScript, forms, layouts
│   └── DATA_MODEL/README.md   # Database entities
├── FEATURES/                   # Feature-specific details
├── PATTERNS/                   # Additional pattern docs
├── COMPONENTS/                 # Component specs
├── TROUBLESHOOTING/            # Common issues
├── GLOSSARY.md                # Terminology
└── README.md                  # Full index
```

---

## 🔑 Environment Variables

**Required (.env):**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bluebonnet
DB_USER=postgres
DB_PASSWORD=your-password
SESSION_SECRET=your-secret
NODE_ENV=development
```

**Optional (with defaults):**
- `PORT=3000` - Server port
- `REDIS_ENABLED=true` - Redis caching
- `LOG_LEVEL=info` - Winston log level

See [Quick Ref](/.claude/development-quick-ref.md#environment-variables) for all options.

---

## 📖 Pattern Examples

### AJAX Form Submission
```javascript
// In form template
<script>
  setupAsyncFormSubmission('addFlightForm');
</script>

// Backend detects X-Async-Request header
const isAsyncRequest = req.get('X-Async-Request') === 'true';
if (isAsyncRequest) {
  return res.json({ success: true, item });
} else {
  return res.redirect(`/trips/${tripId}`);
}
```

### Load Sidebar Content
```javascript
// Click button → loads form
function editItem(type, id) {
  loadSidebarContent(`/api/trips/${tripId}/${type}s/${id}/edit`);
}
```

### Refresh After CRUD
```javascript
// After form submit success
if (result.success) {
  closeSecondarySidebar();
  refreshTripView(); // Fetch new data, update UI
}
```

See [Patterns](/.claude/patterns.md) for complete details.

---

## 🧪 Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# Specific file
npm test -- tests/unit/models/Flight.test.js
```

---

## 🚀 What's Next?

**Phase 1: Svelte Migration** ✅ COMPLETE (December 18, 2025)
- ✅ All CRUD operations working
- ✅ Full feature parity with EJS version
- ✅ 33+ Svelte components created
- ✅ Type-safe TypeScript throughout
- ✅ 90%+ complete (pending: integration tests, a11y audit, performance optimization)

**Phase 2: Planned Enhancements**
- Backend refactoring + TypeScript migration
- Full-stack optimization
- Integration tests & accessibility audit
- Performance optimization
- Advanced features (real-time sync, etc.)

**For detailed roadmap:** See `.claude/MODERNIZATION/PHASE_1_OVERVIEW.md`

---

## 📞 Getting Help

**Problem with documentation?** → Open `.claude/README.md` for full navigation
**Stuck on a pattern?** → Check [Patterns](/.claude/patterns.md)
**Need feature details?** → Check [Features](/.claude/features.md)
**Debugging issue?** → See [Quick Ref debugging](/.claude/development-quick-ref.md#debugging-tips)
**Unknown term?** → See [Glossary](/.claude/GLOSSARY.md)

---

## 🏗️ Architecture at a Glance

```
Frontend (SvelteKit + TypeScript) ✅
    ├─ Pages: Login, Register, Dashboard, Trip Detail
    ├─ Components: 33+ (Forms, Cards, Grids, Maps, Timeline, Calendar)
    ├─ State: Svelte Stores for auth & trip data
    ├─ Services: Centralized API client with error handling
    └─ API calls to backend /api/* routes

Backend (Express.js)
    ├─ Routes: /api/* for CRUD operations
    ├─ Controllers: Business logic + auth
    ├─ Models: Sequelize ORM
    └─ Middleware: Auth, validation, CORS

Database (PostgreSQL)
    ├─ Users
    ├─ Trips (with cascading items)
    ├─ Travel Items: Flights, Hotels, Events, Transportation, CarRentals
    ├─ TravelCompanions (with permissions)
    └─ Vouchers (with attachments)

Cache (Redis)
    ├─ Sessions
    └─ Airport data
```

**Connection:** Frontend calls backend REST API, backend manages database and business logic

---

**For comprehensive documentation, see [.claude/README.md](/.claude/README.md)**

**Last Updated:** December 28, 2025
**Version:** 3.1 (Svelte Frontend Integrated into Dev Environment)
**Status:** Dev Environment Ready ✅

---

## 📊 Current Project Status

| Component | Status | Details |
|-----------|--------|---------|
| **Frontend** | ✅ Integrated | SvelteKit + TypeScript, in `/frontend/` |
| **Backend** | ✅ Complete | Express.js, REST API, authentication |
| **Database** | ✅ Complete | PostgreSQL with full schema |
| **Testing** | ✅ Complete | Vitest setup, 100+ test cases |
| **Documentation** | ✅ Complete | Comprehensive guides in `.claude/` |
| **Deployment** | ✅ Ready | Docker setup, can be deployed |

**Architecture Note:** EVERYTHING IN THIS APPLICATION GOES IN THE DASHBOARD. The dashboard view is the ONLY view in this application. Everything is built on top of that one page, overlaid on top of the map.
---

## 🔄 Recent Migration (December 28, 2025)

**What Changed:**
- ✅ Svelte frontend copied to `/frontend/` subdirectory
- ✅ Landing, login, register pages migrated with exact EJS styling
- ✅ EJS views archived in `DEPRECATED_EJS_VIEWS_ARCHIVE/`
- ✅ Docker Compose updated to use new frontend location
- ✅ Development environment fully functional

**What Stayed the Same:**
- Express backend (unchanged)
- PostgreSQL database (unchanged)
- API routes (unchanged)
- Session/authentication flow (unchanged)
