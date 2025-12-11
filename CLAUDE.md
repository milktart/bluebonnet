# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bluebonnet is a comprehensive travel planning application built with Node.js, Express, and PostgreSQL. Users can create trips and manage all travel components including flights, hotels, car rentals, transportation, and events. The application also includes a travel vouchers/credits system for tracking and attributing travel documents to specific trip segments.

## Development Commands

### Running the Application

**Local development (requires PostgreSQL running):**
```bash
npm run dev
```
Server runs on port 3000 with nodemon for auto-reload on file changes.

**Production:**
```bash
npm start
```

**Docker Compose (recommended for fresh setups):**
```bash
docker-compose up --build
```
- App accessible at http://localhost:3500
- PostgreSQL at localhost:5432
- Redis at localhost:6379
- **Database automatically initializes on first run** (creates tables and seeds airports)
- Volume mounts allow hot-reload during development
- No manual setup required - everything is automated via `docker-entrypoint.sh`

### Database Operations

**Docker (automatic):**
When using Docker Compose, the `docker-entrypoint.sh` script automatically:
1. Waits for PostgreSQL to be ready
2. Checks if database needs initialization
3. Creates all tables via `db:sync` if needed
4. Seeds airport data if the airports table is empty
5. Starts the application

**Local development (manual):**
```bash
npm run db:sync          # Create/update database tables
npm run db:seed-airports # Seed airport data from data/airports.json
```

Uses Sequelize's `sync({alter: true})` to update schema without data loss.

### Styling

**Development (watch mode):**
```bash
npm run build-css
```
Watches `public/css/input.css` and outputs to `public/css/style.css` using Tailwind CSS.

**Production (minified):**
```bash
npm run build-css-prod
```
Run this before deployment to generate minified CSS.

## Architecture

### MVC Structure

The application follows an MVC pattern with clear separation:

**Models** (`models/`):
- Define Sequelize ORM schemas with associations
- Central hub is `models/index.js` which initializes Sequelize and imports all models
- Key associations defined in each model's `associate` method:
  - User → Trip (one-to-many)
  - User → TravelCompanion (one-to-many for created companions)
  - Trip → Flights, Hotels, Transportation, CarRentals, Events (one-to-many with CASCADE delete)
  - Trip ↔ TravelCompanion (many-to-many via TripCompanion junction table)

**Controllers** (`controllers/`):
- Handle business logic and request processing
- Controllers like `tripController.js` manage CRUD operations for their respective resources
- All controllers expect authenticated users via middleware

**Routes** (`routes/`):
- Define URL endpoints and map to controllers
- Apply middleware (authentication, validation) to routes
- Key routes: `/auth`, `/account`, `/trips`, `/companions`, `/flights`, `/hotels`, `/transportation`, `/car-rentals`, `/events`

**Middleware** (`middleware/`):
- `auth.js`: Authentication guards (`ensureAuthenticated`, `forwardAuthenticated`)
- `validation.js`: Express-validator chains for form validation
  - Validates registration, login, and trip creation
  - Returns validation errors as flash messages

**Views** (`views/`):
- EJS templates for server-side rendering
- Partials in `views/partials/` for reusable components
- Trip-specific views in `views/trips/`

### Authentication System

Authentication uses **Passport.js** with local strategy:
- Configuration in `config/passport.js`
- Uses bcrypt for password hashing
- Session-based authentication with express-session
- Middleware (`middleware/auth.js`):
  - `ensureAuthenticated`: Protects routes requiring login
  - `forwardAuthenticated`: Redirects logged-in users away from auth pages

### Public API Endpoints

The following API endpoints are intentionally **public** (no authentication required):

- **`/api/v1/airports/search`** - Airport autocomplete search
- **`/api/v1/airports/:iata`** - Airport details by IATA code

**Rationale**: These endpoints are required for flight form autocomplete functionality before users create trips. They provide read-only access to airport reference data.

**Security**:
- Rate limited to prevent abuse (searchLimiter middleware)
- No sensitive data exposed (public airport information only)
- No write operations permitted

### Database Configuration

Database connection configured in `config/database.js`:
- Supports `development` and `production` environments
- Development: standard PostgreSQL connection
- Production: includes SSL with timezone handling (GMT-0)
- All configuration pulled from environment variables

### External Services

**Geocoding Service** (`services/geocodingService.js`):
- Uses OpenStreetMap's Nominatim API for location-to-coordinates conversion
- In-memory cache to reduce API calls and improve performance
- Rate limiting: 1 second between requests (configurable via `GEOCODING_RATE_LIMIT`)
- No API key required (free service)
- Used for map features to display locations
- Configuration via environment variables:
  - `NOMINATIM_BASE_URL` - API base URL (default: https://nominatim.openstreetmap.org)
  - `GEOCODING_TIMEOUT` - Request timeout in ms (default: 10000)
  - `GEOCODING_RATE_LIMIT` - Minimum ms between requests (default: 1000)

**Airport/Airline Service** (`services/airportService.js`):
- Local data service using PostgreSQL database and JSON files
- Airports automatically seeded from `data/airports.json` on first container startup
- Airlines loaded from `data/airlines.json` (static data)
- Provides airport lookup by IATA code with Redis caching
- Search functionality for airports by name/city/code
- No external API required - all data is local
- Cache automatically cleared when airports are seeded

### Key Data Flow

1. User authenticates via Passport (session stored)
2. Routes check authentication via `ensureAuthenticated` middleware
3. Controllers interact with Sequelize models
4. Models query PostgreSQL database
5. Data passed to EJS views for rendering
6. Flash messages used for user feedback

### Model Relationships

All models use UUIDs as primary keys. The Trip model is central:

```
User (1) → (many) Trip
User (1) → (many) TravelCompanion (as creator)
User (1) → (1) TravelCompanion (as companionProfile, optional)

Trip (1) → (many) Flight
Trip (1) → (many) Hotel
Trip (1) → (many) Transportation
Trip (1) → (many) CarRental
Trip (1) → (many) Event
Trip (many) ↔ (many) TravelCompanion (via TripCompanion junction table)

TripCompanion junction table tracks:
- Which companions are on which trips
- Edit permissions (canEdit) per companion per trip
- Who added the companion (addedBy)
```

All child resources cascade delete when parent Trip is deleted.

### Travel Companions System

The application includes a travel companions feature that allows users to:
- Create companion profiles with name, email, and phone
- Add companions to trips with configurable edit permissions
- Companions can optionally link their profile to a user account (via `userId` field)
- Each trip tracks which companions are invited through the `TripCompanion` junction table
- Trip owners control whether companions can edit trip details via the `canEdit` flag
- Trips have a `defaultCompanionEditPermission` setting applied to newly added companions

## Important Notes

- **Database initialization**: Docker containers automatically initialize database on first run via `docker-entrypoint.sh`
- **Port configuration**: Default 3000 (local) or 3500 (Docker), configurable via PORT env var
- **Timezone handling**: All dates stored in GMT-0 to ensure consistent time handling across timezones
- **Flash messages**: Available in all views via `res.locals` (success_msg, error_msg, error)
- **Static files**: Served from `public/` directory
- **Method override**: Supports `_method` query parameter for PUT/DELETE in forms
- **Logging**: All server-side code uses Winston logger (no console.log statements)
- **Constants**: Time calculations use centralized constants from `utils/constants.js`
- **Client-side features** (`public/js/`):
  - `maps.js`: Consolidated map implementation (replaces old map.js, trip-map.js files)
  - `calendar.js`: Date picker and calendar functionality for trip planning
  - `datetime-formatter.js`: Timezone-aware date/time formatting
  - `main.js`: General UI interactions and form handling

## Environment Variables

Required variables in `.env`:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - PostgreSQL connection
- `SESSION_SECRET` - Express session secret (strong random value in production)
- `NODE_ENV` - Environment mode (development/production)

Optional variables:
- `PORT` - Server port (defaults to 3000)
- `NOMINATIM_BASE_URL` - Geocoding API URL (defaults to OpenStreetMap Nominatim)
- `GEOCODING_TIMEOUT` - Geocoding request timeout in ms (default: 10000)
- `GEOCODING_RATE_LIMIT` - Min ms between geocoding requests (default: 1000)
- `SLOW_REQUEST_THRESHOLD` - Log requests slower than X ms (default: 3000)
- `REDIS_ENABLED` - Enable Redis caching (default: false in dev, true in production)
- `REDIS_HOST` - Redis server hostname (default: localhost)
- `REDIS_PORT` - Redis server port (default: 6379)
- `REDIS_PASSWORD` - Redis authentication password (default: none)
- `REDIS_DB` - Redis database number (default: 0)
- `SESSION_MAX_AGE` - Session cookie max age in ms (default: 24 hours)
- `POOL_ACQUIRE_TIMEOUT` - Database pool connection acquire timeout in ms (default: 30000)
- `POOL_IDLE_TIMEOUT` - Database pool connection idle timeout in ms (default: 10000)
- `SOCKET_PING_TIMEOUT` - WebSocket ping timeout in ms (default: 60000)
- `SOCKET_PING_INTERVAL` - WebSocket ping interval in ms (default: 25000)
- `CORS_ORIGIN` - CORS origin for WebSocket connections (default: request origin)
- `MAP_TILE_URL` - Map tile provider URL (default: ArcGIS World Light Gray Base)
- `LOG_LEVEL` - Winston logger verbosity level (default: info, options: error, warn, info, debug)

## UI/Formatting Standards

### Date & Time Display
- **Date format**: Always display dates as `DD MMM YYYY` (e.g., "15 Oct 2025")
- **Time format**: Always display times in 24-hour format as `HH:MM` (e.g., "14:30")
- **Never use**: AM/PM designators or seconds in time displays
- **Input fields**: Date and time inputs should always show a selector/picker interface

### Form Elements
- **Select dropdown fields**: Always apply classes `appearance-none bg-white`

### Three-Sidebar Layout Architecture

Both the dashboard (`views/dashboard.ejs`) and trip detail page (`views/trips/trip-view.ejs`) use a consistent three-sidebar layout pattern with sidebars floating left: primary → secondary → tertiary.

**Sidebar Behavior Rules:**
- **Primary sidebar**: Always visible, fixed width
- **Secondary sidebar**: Appears on-demand only; width matches primary sidebar (narrow) in existing implementations
- **Tertiary sidebar**: Appears on-demand only; consumes remainder of visible area
- **Spacing**: Uniform padding/margin on all sides and between containers
- **Width transition**: If secondary sidebar is full-width and tertiary opens, secondary transitions to narrow width

**AJAX Loading Pattern:**
- All three sidebars load asynchronously via AJAX
- Initial load and subsequent data refreshes use identical JavaScript code
- Reference implementation: `public/js/sidebar-loader.js`


## Travel Vouchers & Credits System

The application includes a comprehensive travel vouchers/credits tracking system for managing travel documents, upgrade vouchers, gift cards, and other redeemable credits.

### Core Capabilities

- **Voucher Management**: Create and track vouchers with status updates as they're used
- **Voucher Attribution**: Attach vouchers to flights and other trip segments with full lifecycle tracking
- **Passenger Assignment**: Assign vouchers to the trip owner or specific travel companions
- **Multi-Segment Application**: Apply single vouchers to multiple flight segments (e.g., upgrade voucher across layover flights, travel credits across reservation legs)
- **Flexible Voucher Types**: Support various types including travel credits, upgrade vouchers, airline gift cards, restaurant gift cards, etc.

### Implementation

- Routes: `routes/vouchers.js`
- Views: `views/partials/voucher-details-*.ejs`, `views/partials/vouchers-sidebar.ejs`
- The voucher system integrates with the Flight model to track which vouchers were used for redemption

### Data Model Relationships

Vouchers relate to flights and companions through association attributes, allowing:
- Multiple vouchers per flight segment
- Single voucher across multiple segments
- Passenger-specific redemption tracking

## Testing Policy

### When to Write Tests

**ALWAYS write tests when:**
- Creating new services, controllers, or utilities
- Adding new API endpoints
- Implementing business logic or data transformations
- Fixing bugs (write test that reproduces bug first, then fix)
- Modifying existing functionality

**Tests are REQUIRED for:**
- All service layer code (`services/**/*.js`)
- All utility functions (`utils/**/*.js`)
- All API endpoints (`routes/api/**/*.js`)
- Complex controller logic

**Tests are OPTIONAL but encouraged for:**
- Simple CRUD controllers (if covered by integration tests)
- View rendering logic
- Static content

### Test Structure

**Unit Tests** (`tests/unit/`):
- Test individual functions/methods in isolation
- Mock external dependencies (database, APIs, etc.)
- Fast execution (< 100ms per test)
- File naming: `{moduleName}.test.js`

**Integration Tests** (`tests/integration/`):
- Test complete request/response cycles
- Use real database (test environment)
- Test API endpoints end-to-end
- File naming: `{feature}.test.js`

### Coverage Requirements

Current thresholds (as of latest update):
```javascript
{
  branches: 9%,
  functions: 25%,
  lines: 14%,
  statements: 14%
}
```

**Target thresholds** (gradually increase as tests are added):
```javascript
{
  branches: 60%,
  functions: 60%,
  lines: 60%,
  statements: 60%
}
```

**When adding new code:**
1. New service files should have ≥80% coverage
2. New utility files should have ≥90% coverage
3. New API endpoints should have ≥70% coverage

### Writing Tests - Examples

**Unit Test Example** (`tests/unit/utils/constants.test.js`):
```javascript
const { MS_PER_HOUR, MS_PER_DAY } = require('../../../utils/constants');

describe('Time Constants', () => {
  it('should have correct MS_PER_HOUR value', () => {
    expect(MS_PER_HOUR).toBe(3600000);
  });

  it('should have correct MS_PER_DAY value', () => {
    expect(MS_PER_DAY).toBe(86400000);
  });
});
```

**Service Test Example** (`tests/unit/services/myService.test.js`):
```javascript
const myService = require('../../../services/myService');
const db = require('../../../models');

// Mock database
jest.mock('../../../models', () => ({
  MyModel: {
    findAll: jest.fn(),
    create: jest.fn(),
  },
}));

describe('MyService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getItems', () => {
    it('should return all items', async () => {
      const mockItems = [{ id: 1, name: 'Test' }];
      db.MyModel.findAll.mockResolvedValue(mockItems);

      const result = await myService.getItems();

      expect(result).toEqual(mockItems);
      expect(db.MyModel.findAll).toHaveBeenCalledTimes(1);
    });
  });
});
```

**Integration Test Example** (`tests/integration/myEndpoint.test.js`):
```javascript
const request = require('supertest');
const app = require('../../server');
const { sequelize } = require('../../models');

describe('My Endpoint - Integration', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/v1/items', () => {
    it('should return items list', async () => {
      const response = await request(app)
        .get('/api/v1/items')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/unit/utils/constants.test.js

# Run with coverage
npm run test:coverage

# Run in watch mode (for TDD)
npm run test:watch

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

### Test-Driven Development (TDD)

For complex features, follow TDD:
1. Write failing test first
2. Write minimum code to pass test
3. Refactor while keeping tests green
4. Repeat

### Pre-Commit Requirements

Before committing code:
- [ ] All tests pass (`npm test`)
- [ ] No decrease in coverage percentages
- [ ] New code has corresponding tests
- [ ] Tests are readable and maintainable

### CI/CD Integration

All pull requests must:
- Pass lint checks (`npm run lint`)
- Pass all tests (`npm test`)
- Meet minimum coverage thresholds
- Pass format checks (`npm run format:check`)

Tests run automatically in GitHub Actions on:
- Every push to main/develop
- Every pull request
- trip items are independant items and do not require to be attached to a trip. Attaching to a trip is optional.
- all changes to existing functionality and new features added should follow the architechture guidelines set out in claude.md