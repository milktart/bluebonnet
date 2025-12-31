# 📚 Bluebonnet Travel Planner - Documentation

Welcome! This directory contains all documentation for the Bluebonnet travel planning application.

---

## 🚀 Quick Start - Choose Your Path

### I want to...
- **[Get Started Developing](./GETTING_STARTED.md)** - Local setup (10 min)
- **[Understand the Architecture](./ARCHITECTURE/README.md)** - How the system works (20 min)
- **[Work on a Feature](./FEATURES/)** - Feature-specific guides
- **[Add/Update Code](./PATTERNS/)** - Design patterns & best practices
- **[Deploy to Production](./DEPLOYMENT/README.md)** - Deployment checklist
- **[Debug an Issue](./TROUBLESHOOTING/)** - Common problems & solutions
- **[Learn Svelte](./LEARNING_RESOURCES/SVELTE_BASICS.md)** - Phase 1 framework
- **[Understand Modernization](./MODERNIZATION/README.md)** - Phase 1, 2, 3 roadmap

---

## 👥 Documentation by Role

### 👤 New Developer?
**Start here (30 minutes total):**
1. [Getting Started](./GETTING_STARTED.md) - Local setup
2. [Development Workflow](./DEVELOPMENT.md) - Daily commands
3. [Architecture Overview](./ARCHITECTURE/README.md) - System overview
4. Pick a [Feature](./FEATURES/) to work on

### 👨‍💻 Backend Engineer?
- [Backend Architecture](./ARCHITECTURE/BACKEND/README.md)
- [Database Schema](./ARCHITECTURE/BACKEND/DATABASE_SCHEMA.md)
- [Features](./FEATURES/)
- [CRUD Pattern](./PATTERNS/CRUD_PATTERN.md)
- [Testing](./TESTING/README.md)

### 🎨 Frontend Engineer (Phase 1 - Svelte)?
- [Phase 1 Overview](./MODERNIZATION/PHASE_1_OVERVIEW.md)
- [Svelte Basics](./LEARNING_RESOURCES/SVELTE_BASICS.md)
- [Phase 1 Setup Guide](./MODERNIZATION/PHASE_1_SVELTE_SETUP.md)
- [Components](./COMPONENTS/)
- [Patterns](./PATTERNS/)

### 🚀 DevOps/Operations?
- [Deployment Guide](./DEPLOYMENT/README.md)
- [Environment Setup](./DEPLOYMENT/ENVIRONMENT_CONFIG.md)
- [Docker Setup](./DEPLOYMENT/DOCKER_SETUP.md)
- [Troubleshooting](./TROUBLESHOOTING/DEPLOYMENT_ISSUES.md)

### 📊 Tech Lead/Architect?
- [Modernization Roadmap](./MODERNIZATION/README.md)
- [Architecture Overview](./ARCHITECTURE/README.md)
- [Decisions](./DECISIONS/README.md)
- [Testing Strategy](./TESTING/README.md)
- [Component Checklist](./COMPONENTS/COMPONENT_CHECKLIST.md)

---

## 📖 Full Documentation Structure

```
.claude/
├── README.md                    ← You are here
├── INDEX.md                     ← Searchable index
├── GETTING_STARTED.md           ← Onboarding guide
├── DEVELOPMENT.md               ← Daily workflow
├── GLOSSARY.md                  ← Terminology
├── CHANGELOG.md                 ← Version history
│
├── ARCHITECTURE/                ← System design
│   ├── README.md                   (overview)
│   ├── CURRENT_STATE.md            (current tech stack)
│   ├── BACKEND/                    (Express controllers, models)
│   ├── FRONTEND/                   (Vanilla JS → Svelte)
│   ├── DATA_MODEL/                 (Entities & relationships)
│   └── INTEGRATIONS/               (External services)
│
├── FEATURES/                    ← Feature guides
│   ├── README.md                   (all features overview)
│   ├── TRIP_MANAGEMENT.md          (trips CRUD)
│   ├── FLIGHT_MANAGEMENT.md        (flights CRUD)
│   ├── HOTEL_MANAGEMENT.md         (hotels CRUD)
│   ├── EVENTS_MANAGEMENT.md        (events CRUD)
│   ├── CAR_RENTALS.md              (car rentals CRUD)
│   ├── TRANSPORTATION.md           (transportation CRUD)
│   ├── TRAVEL_COMPANIONS.md        (companion system)
│   ├── VOUCHERS.md                 (voucher system)
│   ├── CALENDAR_VIEW.md            (calendar/timeline)
│   └── MAPS.md                     (location features)
│
├── PATTERNS/                    ← Design patterns
│   ├── README.md                   (patterns overview)
│   ├── CRUD_PATTERN.md             (full CRUD flow)
│   ├── FORM_PATTERN.md             (form submission)
│   ├── ASYNC_PATTERNS.md           (AJAX patterns)
│   ├── COMPONENT_PATTERN.md        (component architecture)
│   ├── ERROR_HANDLING.md           (error patterns)
│   ├── VALIDATION_PATTERN.md       (validation patterns)
│   ├── STATE_MANAGEMENT.md         (current + Svelte)
│   ├── TESTING_PATTERN.md          (testing patterns)
│   ├── API_PATTERNS.md             (API patterns)
│   ├── UX_PATTERNS.md              (UX decisions)
│   └── WHEN_TO_USE_PATTERNS.md     (pattern selection)
│
├── COMPONENTS/                  ← Component library
│   ├── README.md                   (components overview)
│   ├── FORM_COMPONENTS.md          (form specs)
│   ├── LAYOUT_COMPONENTS.md        (layout specs)
│   ├── DATA_COMPONENTS.md          (data display)
│   ├── MODAL_COMPONENTS.md         (modals/dialogs)
│   ├── STYLING_GUIDE.md            (styling standards)
│   ├── REUSABILITY_GUIDE.md        (reusable patterns)
│   ├── COMPONENT_CHECKLIST.md      (creation checklist)
│   └── EJS_GUIDELINES.md           (EJS best practices)
│
├── MODERNIZATION/               ← Phase 1, 2, 3
│   ├── README.md                   (overview)
│   ├── PHASE_1_OVERVIEW.md         (Phase 1 intro)
│   ├── PHASE_1_SVELTE_SETUP.md     (Svelte setup)
│   ├── PHASE_1_MIGRATION_GUIDE.md  (feature migration)
│   ├── PHASE_1_API_CLIENT.md       (API patterns)
│   ├── PHASE_1_STORES.md           (Svelte stores)
│   ├── PHASE_1_COMPONENTS.md       (building components)
│   ├── PHASE_1_FORMS.md            (Svelte forms)
│   ├── PHASE_1_ROUTING.md          (SvelteKit routing)
│   ├── MIGRATION_CHECKLIST.md      (migration tasks)
│   ├── PHASE_2_OVERVIEW.md         (Phase 2 intro - stub)
│   ├── PHASE_2_BACKEND_REFACTOR.md (backend refactor - stub)
│   └── PHASE_2_DATABASE_MIGRATION.md (DB migration - stub)
│
├── TESTING/                     ← Testing guide
│   ├── README.md                   (testing overview)
│   ├── STRATEGY.md                 (testing strategy)
│   ├── UNIT_TESTING.md             (unit tests)
│   ├── INTEGRATION_TESTING.md      (integration tests)
│   ├── COMPONENT_TESTING.md        (component tests)
│   └── COVERAGE_GOALS.md           (coverage targets)
│
├── DEPLOYMENT/                  ← Operations
│   ├── README.md                   (deployment overview)
│   ├── LOCAL_DEVELOPMENT.md        (local setup)
│   ├── DOCKER_SETUP.md             (Docker guide)
│   ├── ENVIRONMENT_CONFIG.md       (environment vars)
│   ├── PRODUCTION_DEPLOYMENT.md    (production checklist)
│   ├── CI_CD.md                    (GitHub Actions)
│   ├── MONITORING.md               (monitoring setup)
│   └── TROUBLESHOOTING.md          (deployment issues)
│
├── DECISIONS/                   ← Architecture decisions
│   ├── README.md                   (ADR overview)
│   ├── ADR_001_EXPRESS.md          (why Express)
│   ├── ADR_002_EJS.md              (why EJS)
│   ├── ADR_003_SEQUELIZE.md        (why Sequelize)
│   ├── ADR_004_POSTGRES_REDIS.md   (why PostgreSQL+Redis)
│   ├── ADR_005_SVELTE.md           (why Svelte - NEW)
│   ├── ADR_006_SVELTEKIT.md        (why SvelteKit - future)
│   └── FUTURE_MIGRATIONS.md        (potential evolution)
│
├── TROUBLESHOOTING/             ← Problem solving
│   ├── README.md                   (troubleshooting index)
│   ├── DEBUG_GUIDE.md              (debugging methods)
│   ├── SETUP_ISSUES.md             (setup problems)
│   ├── DATABASE_ISSUES.md          (database problems)
│   ├── FORM_ISSUES.md              (form problems)
│   ├── ASYNC_OPERATIONS.md         (AJAX problems)
│   ├── PERFORMANCE_ISSUES.md       (performance problems)
│   └── DEPLOYMENT_ISSUES.md        (production issues)
│
└── LEARNING_RESOURCES/          ← Framework learning
    ├── README.md                   (resources overview)
    ├── SVELTE_BASICS.md            (Svelte quick ref)
    ├── SVELTEKIT_BASICS.md         (SvelteKit quick ref)
    ├── TYPESCRIPT_GUIDELINES.md    (TypeScript best practices)
    ├── DATABASE_BASICS.md          (database concepts)
    └── EXTERNAL_RESOURCES.md       (official docs links)
```

---

## 🔑 Key Concepts

### Travel Item Types
- **Flight** - Commercial flights with departure/arrival times
- **Hotel** - Accommodations with check-in/check-out dates
- **Event** - Activities, attractions, meetings
- **Transportation** - Ground transportation (taxi, shuttle, etc.)
- **Car Rental** - Vehicle rentals for trip duration

### Core Systems
- **Authentication** - Passport.js local strategy
- **Trip Management** - Create, edit, share trips
- **Travel Companions** - Invite people, manage permissions
- **Vouchers** - Track travel credits and upgrade vouchers
- **Calendar** - Timeline view of trip activities
- **Maps** - Location visualization on map

### Technology Stack (Current)
- **Backend:** Express.js + Node.js
- **Frontend:** Vanilla JavaScript + EJS templates (→ Svelte in Phase 1)
- **Database:** PostgreSQL + Sequelize ORM
- **Caching:** Redis
- **DevOps:** Docker + Docker Compose

### Technology Stack (Phase 1 Target)
- **Backend:** Express.js + Node.js (same)
- **Frontend:** Svelte + SvelteKit (replacing vanilla JS + EJS)
- **Database:** PostgreSQL + Sequelize ORM (same)
- **Caching:** Redis (same)
- **DevOps:** Docker + Docker Compose (same)

### Technology Stack (Phase 2 Target - Optional)
- **Backend:** Full SvelteKit (merging Express + Svelte)
- **Database:** PostgreSQL + Prisma ORM (optional)
- **Everything else:** Same

---

## 📊 Modernization Phases

### Phase 1: Svelte + SvelteKit Frontend (Weeks 1-12)
- Keep existing Express backend
- Add SvelteKit frontend alongside
- Migrate features one-by-one to Svelte
- Result: Both frontends working, backend unchanged
- **Start date:** TBD
- **See:** [Phase 1 Overview](./MODERNIZATION/PHASE_1_OVERVIEW.md)

### Phase 2: Backend Refactoring (Weeks 13-16)
- Extract service layer from controllers
- Refactor large controllers (60KB → 15KB)
- Introduce TypeScript throughout
- Increase test coverage to 60%+
- Result: Cleaner, more testable backend
- **Start date:** After Phase 1 complete
- **See:** [Phase 2 Overview](./MODERNIZATION/PHASE_2_OVERVIEW.md)

### Phase 3: Optional Full Stack (Future)
- Merge SvelteKit + Express into unified SvelteKit app
- Optional: Migrate to Prisma ORM
- Optional: Migrate to different database
- Result: Single unified codebase
- **See:** [ADR 006](./DECISIONS/ADR_006_SVELTEKIT.md)

---

## ⚡ Token Efficiency

This new documentation structure is designed for **token efficiency**:

| Scenario | Old (CLAUDE.md) | New (.claude/) | Savings |
|----------|-----------------|---------------|---------|
| Add form field | 8,000 tokens | 2,000 tokens | 75% ↓ |
| Debug sidebar | 8,000 tokens | 2,500 tokens | 69% ↓ |
| Local setup | 8,000 tokens | 1,500 tokens | 81% ↓ |
| Deploy to prod | 8,000 tokens | 3,000 tokens | 63% ↓ |
| Write unit test | 8,000 tokens | 2,500 tokens | 69% ↓ |

**Key principle:** Load only the docs you need, not the entire 35KB reference.

---

## 🔗 Cross-Documentation Navigation

Each document includes:
- **Context links** - Prerequisite reading
- **See also** - Related topics
- **Next steps** - Suggested next document

Example flow:
1. New dev reads [Getting Started](./GETTING_STARTED.md)
2. Then reads [Development](./DEVELOPMENT.md)
3. Then reads [Architecture Overview](./ARCHITECTURE/README.md)
4. Then reads specific [Feature](./FEATURES/) guide
5. Then reads relevant [Pattern](./PATTERNS/)
6. Then reads [Component](./COMPONENTS/) if needed

---

## 📝 How to Use This Documentation

### For Code Changes
1. Find relevant doc in [FEATURES/](./FEATURES/) or [PATTERNS/](./PATTERNS/)
2. Follow code examples
3. Update docs if you learn something new

### For Debugging
1. Start with [TROUBLESHOOTING/README.md](./TROUBLESHOOTING/)
2. Find your issue type
3. Follow debug steps

### For New Features
1. Read relevant [Feature](./FEATURES/) guide
2. Follow [CRUD Pattern](./PATTERNS/CRUD_PATTERN.md)
3. Check [Component Checklist](./COMPONENTS/COMPONENT_CHECKLIST.md)
4. Write tests per [Testing Guide](./TESTING/)

### For Learning
1. New to Svelte? Read [Svelte Basics](./LEARNING_RESOURCES/SVELTE_BASICS.md)
2. New to SvelteKit? Read [SvelteKit Basics](./LEARNING_RESOURCES/SVELTEKIT_BASICS.md)
3. Questions on TypeScript? Read [TypeScript Guidelines](./LEARNING_RESOURCES/TYPESCRIPT_GUIDELINES.md)

---

## 📈 Current Status

**Phase:** Phase 0 - Documentation Restructuring
**Progress:** In Progress

**Last Update:** 2025-12-17
**See:** [CHANGELOG.md](./CHANGELOG.md) for full history

---

## 🆘 Getting Help

**Problem?** Check [TROUBLESHOOTING/README.md](./TROUBLESHOOTING/)

**Question about code?** Check relevant [FEATURES/](./FEATURES/) or [PATTERNS/](./PATTERNS/) doc

**Need to learn framework?** Check [LEARNING_RESOURCES/](./LEARNING_RESOURCES/)

**Want to understand decision?** Check [DECISIONS/](./DECISIONS/)

---

## ✍️ Contributing to Docs

**When you learn something:**
1. Find or create relevant doc
2. Add example or clarification
3. Link to related docs
4. Update [INDEX.md](./INDEX.md)

**Keep in mind:**
- Docs should be 2-5KB (avoid 35KB monoliths)
- Include code examples
- Link liberally between docs
- Update CHANGELOG.md when major changes made

---

## 📞 Questions?

- Check [INDEX.md](./INDEX.md) for searchable index
- Browse [TROUBLESHOOTING/](./TROUBLESHOOTING/)
- Read [LEARNING_RESOURCES/](./LEARNING_RESOURCES/)
- Check [GLOSSARY.md](./GLOSSARY.md) for terminology

---

**Happy coding! 🚀**

*For complete list of docs, see [INDEX.md](./INDEX.md)*
