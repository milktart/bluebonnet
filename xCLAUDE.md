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
docker-compose up
```
- App accessible at http://localhost:3500
- PostgreSQL at localhost:5432
- Database automatically syncs on startup
- Volume mounts allow hot-reload during development

### Database Operations

**Run database migrations (sync schema):**
```bash
npm run migrate
```
Uses Sequelize's `sync({alter: true})` to update schema without data loss.

**Note:** The application automatically runs `db.sequelize.sync({ alter: true })` on startup (see server.js:84), so manual migration is rarely needed. However, some custom constraints are applied post-sync (e.g., making `events.tripId` nullable - see server.js:87-95).

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
- Rate limiting: 1 second between requests to respect API usage policies
- No API key required (free service)
- Used for map features to display locations

**Airport/Airline Service** (`services/airportService.js`):
- Local data service using JSON files (`data/airports.json`, `data/airlines.json`)
- Provides airport lookup by IATA code
- Airline lookup and flight number parsing
- Search functionality for airports by name/city
- No external API required - all data is local

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

- **Database sync on startup**: Server automatically runs `alter: true` sync, which modifies tables to match models without dropping data
- **Port configuration**: Default 3000 (local) or 3500 (Docker), configurable via PORT env var
- **Timezone handling**: All dates stored in GMT-0 to ensure consistent time handling across timezones
- **Flash messages**: Available in all views via `res.locals` (success_msg, error_msg, error)
- **Static files**: Served from `public/` directory
- **Method override**: Supports `_method` query parameter for PUT/DELETE in forms
- **Client-side features** (`public/js/`):
  - `map.js`: Interactive maps using geocoding service to display locations
  - `calendar.js`: Date picker and calendar functionality for trip planning
  - `datetime-formatter.js`: Timezone-aware date/time formatting
  - `main.js`: General UI interactions and form handling

## Environment Variables

Required variables in `.env`:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - PostgreSQL connection
- `SESSION_SECRET` - Express session secret
- `NODE_ENV` - Environment mode (development/production)

Optional variables:
- `PORT` - Server port (defaults to 3000)

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