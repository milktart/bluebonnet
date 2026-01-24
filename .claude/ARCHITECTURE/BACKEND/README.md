# 🔧 Backend Architecture

Express.js backend handling API endpoints, business logic, and database operations.

---

## Quick Links

- **[Database Schema](./DATABASE_SCHEMA.md)** - Tables and relationships
- **[Controllers](./CONTROLLERS.md)** - Request handlers (coming)
- **[Models](./MODELS.md)** - Database models (coming)
- **[Services](./SERVICES.md)** - Business logic layer (coming)
- **[Middleware](./MIDDLEWARE.md)** - Middleware patterns (coming)
- **[Authentication](./AUTHENTICATION.md)** - Auth system (coming)
- **[Error Handling](./ERROR_HANDLING.md)** - Error patterns (coming)

---

## Overview

Backend provides REST API for frontend to communicate with database.

### Tech Stack

- **Framework:** Express.js
- **Database:** PostgreSQL + Sequelize ORM
- **Cache:** Redis
- **Authentication:** Passport.js
- **Validation:** Express-validator

### Architecture

```
Request (from Frontend)
    ↓
Routes (routes/*.js)
    ↓
Middleware (authentication, validation)
    ↓
Controllers (controllers/*.js)
    ↓
Services (services/*.js) [Future: Phase 2]
    ↓
Models (models/*.js - Sequelize)
    ↓
Database (PostgreSQL)
    ↓
Response (JSON) back to Frontend
```

---

## Key Components

### Routes (`routes/`)

Maps URLs to controllers.

**Example:**

```javascript
// routes/flights.js
router.post('/flights', ensureAuthenticated, validateFlight(), flightController.createFlight);
```

**Key Routes:**

- `/auth` - Authentication
- `/trips` - Trip management
- `/flights`, `/hotels`, `/events`, etc. - Travel items
- `/companions` - Companion management
- `/vouchers` - Voucher system
- `/api/v1/*` - Public API endpoints

### Controllers (`controllers/`)

Handles request processing and business logic.

**Current Controllers:**

- `authController.js` - Login, registration
- `tripController.js` - Trip CRUD (60KB - being refactored)
- `flightController.js` - Flight CRUD
- `hotelController.js` - Hotel CRUD
- `eventController.js` - Event CRUD
- `carRentalController.js` - Car rental CRUD
- `transportationController.js` - Transportation CRUD
- `companionController.js` - Companion management
- `voucherController.js` - Voucher management
- `accountController.js` - User account (27KB)

**Example Controller:**

```javascript
exports.createFlight = async (req, res) => {
  try {
    // 1. Validate trip ownership
    const trip = await Trip.findByPk(tripId);
    if (!trip || trip.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // 2. Validate data
    const { airline, flightNumber, origin, destination } = req.body;
    if (!airline || !origin) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // 3. Geocode locations
    const originCoords = await geocodeLocation(origin);
    const destCoords = await geocodeLocation(destination);

    // 4. Create flight
    const flight = await Flight.create({
      tripId,
      airline,
      flightNumber,
      origin,
      originLat: originCoords.lat,
      originLng: originCoords.lng,
      // ... other fields
    });

    // 5. Return response
    if (req.get('X-Async-Request') === 'true') {
      return res.json({ success: true, data: flight });
    } else {
      res.redirect(`/trips/${tripId}`);
    }
  } catch (error) {
    logger.error('Error creating flight:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
```

### Models (`models/`)

Sequelize ORM models representing database tables.

**Current Models:**

- `User.js` - User accounts
- `Trip.js` - Trips (core entity)
- `Flight.js` - Flights
- `Hotel.js` - Hotels
- `Event.js` - Events
- `CarRental.js` - Car rentals
- `Transportation.js` - Ground transportation
- `TravelCompanion.js` - Companion profiles
- `TripCompanion.js` - Trip membership
- `Voucher.js` - Travel vouchers
- `VoucherAttachment.js` - Voucher usage tracking
- `Notification.js` - User notifications

**Example Model:**

```javascript
// models/Flight.js
module.exports = (sequelize, DataTypes) => {
  const Flight = sequelize.define('Flight', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    airline: DataTypes.STRING,
    flightNumber: DataTypes.STRING,
    origin: DataTypes.STRING,
    originLat: DataTypes.DECIMAL(10, 8),
    originLng: DataTypes.DECIMAL(11, 8),
    destination: DataTypes.STRING,
    destinationLat: DataTypes.DECIMAL(10, 8),
    destinationLng: DataTypes.DECIMAL(11, 8),
    departureDateTime: DataTypes.DATE,
    arrivalDateTime: DataTypes.DATE,
    // ... other fields
  });

  Flight.associate = (models) => {
    Flight.belongsTo(models.Trip, { foreignKey: 'tripId', onDelete: 'CASCADE' });
    Flight.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return Flight;
};
```

### Middleware (`middleware/`)

Processes requests before reaching controllers.

**Current Middleware:**

- `auth.js` - Authentication guards
  - `ensureAuthenticated` - Protects routes
  - `forwardAuthenticated` - Redirects logged-in users
- `validation.js` - Express-validator chains
  - `validateRegistration()`
  - `validateLogin()`
  - `validateTrip()`

**Example Middleware:**

```javascript
// middleware/auth.js
exports.ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/login');
};
```

---

## Request/Response Flow

### Create Flight Example

```
1. Frontend (Svelte Component)
   - User fills flight form
   - Submits with X-Async-Request header

2. Request Reaches Backend
   POST /api/trips/:tripId/flights
   Headers: { X-Async-Request: true }
   Body: { airline: "UA", flightNumber: "123", ... }

3. Route Handler
   routes/flights.js receives POST request

4. Middleware (In Order)
   - ensureAuthenticated checks req.isAuthenticated()
   - validateFlight() validates form data

5. Controller Method
   flightController.createFlight() executes

6. Controller Logic
   - Verify trip ownership
   - Geocode origin/destination
   - Call Flight.create()

7. Model Operation
   Sequelize saves to PostgreSQL

8. Response Sent Back
   { success: true, data: { id, airline, ... } }

9. Frontend Receives
   Response handler updates UI
```

---

## Key Patterns

### AJAX Request Detection

```javascript
const isAsyncRequest = req.get('X-Async-Request') === 'true';

if (isAsyncRequest) {
  return res.json({ success: true, data: item });
} else {
  res.redirect(`/trips/${tripId}`);
}
```

### Error Handling

```javascript
try {
  // operation
} catch (error) {
  logger.error('Error:', error);
  if (isAsyncRequest) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
  req.flash('error_msg', error.message);
  res.redirect('back');
}
```

### Authorization Check

```javascript
const trip = await Trip.findByPk(tripId);
if (!trip || trip.userId !== req.user.id) {
  return res.status(403).json({ error: 'Unauthorized' });
}
```

---

## Helper Functions (`controllers/helpers/`)

Reusable utilities for controllers.

**Current Helpers:**

- `resourceController.js`
  - `verifyTripOwnership()` - Check trip ownership
  - `geocodeIfChanged()` - Geocode location
  - `redirectAfterSuccess()` - Standard redirect
  - `redirectAfterError()` - Error redirect

See: [Controller Helpers README](../../controllers/helpers/README.md)

---

## Database Connection

Configuration in `config/database.js`:

```javascript
// config/database.js
module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
  },
  // ... production config
};
```

---

## Environment Setup

Required environment variables:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bluebonnet
DB_USER=postgres
DB_PASSWORD=password
SESSION_SECRET=random-secret
NODE_ENV=development
PORT=3000
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## Development Workflow

### Adding a New Endpoint

1. **Create Model** (if needed)
   - `models/MyItem.js`

2. **Create Migration** (if schema change)
   - `npx sequelize-cli migration:generate --name create-my-item`

3. **Create Controller**
   - `controllers/myItemController.js`

4. **Create Routes**
   - `routes/myItems.js`

5. **Register Routes**
   - Add to `server.js`

6. **Test**
   - `npm test`
   - Manual testing with curl/Postman

---

## Performance Considerations

### Queries

- Use `.include()` for eager loading (avoid N+1)
- Use `.select()` to limit columns
- Use indexes on frequently queried columns

### Caching

- Redis for session data
- Passport sessions
- Airport data caching

### Optimization

- Lazy load companions/vouchers
- Paginate large result sets
- Compress responses

---

## Logging

Winston logger configured in `server.js`:

```javascript
// Log levels
logger.error('Error message'); // Errors
logger.warn('Warning message'); // Warnings
logger.info('Info message'); // Info
logger.debug('Debug message'); // Debug
```

**Never use** `console.log()` (use logger instead)

---

## Related Documentation

- **[Models Guide](./MODELS.md)** - Model details (coming)
- **[Controllers Guide](./CONTROLLERS.md)** - Controller patterns (coming)
- **[Services Guide](./SERVICES.md)** - Service layer (Phase 2)
- **[Authentication](./AUTHENTICATION.md)** - Auth system (coming)
- **[CRUD Pattern](../../PATTERNS/CRUD_PATTERN.md)** - Full flow
- **[API Patterns](../../PATTERNS/API_PATTERNS.md)** - Response formats

---

**Last Updated:** 2025-12-17
**Current Focus:** Phase 1 frontend, keeping backend stable
**Next Phase:** Service layer extraction (Phase 2)
