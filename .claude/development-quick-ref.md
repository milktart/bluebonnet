# Development Quick Reference

Commands, environment variables, and debugging tips.

---

## Quick Start

### Docker (Recommended, ~5 minutes)

```bash
docker-compose up --build
# App at http://localhost:3500
# Database auto-initializes
```

### Local Development (~15 minutes)

```bash
npm install
npm run db:sync              # Create/update tables
npm run db:seed-airports     # Load airport data
npm run dev                  # Start server (port 3000)
# App at http://localhost:3000
```

---

## Common Commands

### Running

```bash
npm run dev              # Local development (port 3000, auto-reload)
npm start               # Production
docker-compose up       # Docker development (port 3500)
docker-compose up -d    # Docker detached mode
docker-compose down     # Stop Docker
```

### Database

```bash
npm run db:sync              # Create/update schema (safe, uses alter: true)
npm run db:seed-airports     # Import 7,000 airports from data/airports.json
npx sequelize-cli migration:generate --name migration_name  # Create migration
```

### Building

```bash
npm run build-css           # Watch Tailwind (dev)
npm run build-css-prod      # Minify CSS (prod)
npm run build               # Full build
```

### Testing

```bash
npm test                # Run all tests
npm run test:watch     # Watch mode (re-run on change)
npm run test:coverage  # Coverage report
npm run test:unit      # Unit tests only
npm run test:integration # Integration tests only
```

### Code Quality

```bash
npm run lint           # Check style (ESLint)
npm run format         # Auto-format (Prettier)
npm run format:check   # Check if formatted
```

---

## Environment Variables

**Create `.env` file in project root:**

### Required

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bluebonnet
DB_USER=postgres
DB_PASSWORD=yourpassword
SESSION_SECRET=your-secret-key-here
NODE_ENV=development
PORT=3000
```

### Optional (with defaults)

```env
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org
GEOCODING_TIMEOUT=10000
GEOCODING_RATE_LIMIT=1000

LOG_LEVEL=info
SLOW_REQUEST_THRESHOLD=3000
```

### Docker Environment

Docker uses variables from `docker-compose.yml` and `.env.docker` (if exists).

---

## Port Configuration

| Service    | Local | Docker |
| ---------- | ----- | ------ |
| App        | 3000  | 3500   |
| PostgreSQL | 5432  | 5432   |
| Redis      | 6379  | 6379   |

---

## File Structure (Key)

```
bluebonnet-dev/
├── controllers/          # Request handlers
├── models/              # Database models
├── routes/              # URL endpoints
├── middleware/          # Auth, validation
├── services/            # Business logic (future)
├── views/               # EJS templates
├── public/
│   ├── js/              # Client-side JavaScript
│   ├── css/             # Styling
│   └── dist/            # Built assets
├── data/                # Static data (airports.json, airlines.json)
├── config/              # Configuration
├── tests/               # Test suite
├── .claude/             # Documentation
├── docker-compose.yml   # Docker config
├── .env                 # Environment variables
└── server.js            # Main entry point
```

---

## Common Issues & Solutions

### Database won't initialize

```bash
# 1. Check PostgreSQL is running (Docker or local)
# 2. Check environment variables in .env
# 3. Manual fix:
npm run db:sync
npm run db:seed-airports
```

### Port already in use

```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Or change PORT in .env
PORT=3001 npm run dev
```

### Redis connection failed

```bash
# 1. Check Redis is running
# 2. Disable Redis in .env
REDIS_ENABLED=false

# 3. Or check Redis status
redis-cli ping
```

### Form submission not working

1. Check browser DevTools (F12)
   - Console tab for JavaScript errors
   - Network tab for API requests
2. Check form has correct ID: `addFlightForm`, `editFlightForm`, etc.
3. Check `setupAsyncFormSubmission()` is called
4. Check X-Async-Request header is sent

### Sidebar not loading

1. Check Network tab for 404 on sidebar URL
2. Check route exists: `/trips/:tripId/sidebar`
3. Check `loadSidebarContent()` is called with correct URL
4. Check server logs for errors

---

## Debugging Tips

### Browser Console (F12)

```javascript
// Check global state
console.log('tripId:', window.tripId);
console.log('tripData:', window.tripData);

// Check functions exist
console.log('editItem:', typeof editItem);
console.log('loadSidebarContent:', typeof loadSidebarContent);

// Check form
const form = document.getElementById('addFlightForm');
console.log('Form:', form);
console.log('Form action:', form.action);
console.log('Form method:', form.method);
```

### Server Logs

```bash
# Start with debug logging
LOG_LEVEL=debug npm run dev

# Check specific error
# Look for "Error creating flight:" messages
# Check "Authorization check failed" for permission issues
```

### Network Tab (DevTools)

1. Click form submit button
2. Check Network tab for POST request
3. Verify:
   - Request headers include `X-Async-Request: true`
   - Request body has correct fields
   - Response status is 200 (not 400/403/500)
   - Response body has `{ success: true }`

---

## Database Queries (Debugging)

### Check models are loaded

```javascript
// In server.js or node REPL
const db = require('./models');
console.log(Object.keys(db)); // Should see Flight, Hotel, etc.
```

### Query data directly

```bash
# Connect to PostgreSQL
psql -U postgres -d bluebonnet -h localhost

# In psql
\dt                          # List tables
SELECT * FROM "Flights";     # Query flights
SELECT * FROM "Trips";       # Query trips
\q                           # Exit
```

### Check migrations

```bash
npx sequelize-cli db:migrate:status
# Shows which migrations have run
```

---

## Git Workflow

### Before committing

```bash
npm test                    # All tests pass
npm run test:coverage       # Check coverage
npm run lint               # No style errors
npm run format             # Auto-format code
```

### Commit message format

```
feat: Add flight form validation
fix: Correct sidebar close bug
docs: Update feature documentation
refactor: Extract form utilities
test: Add flight controller tests
```

### Branch naming

```
feature/flight-form          # New feature
fix/sidebar-scroll-bug      # Bug fix
docs/api-documentation      # Documentation
refactor/extract-services   # Refactoring
```

---

## API Testing

### Using curl

```bash
# Create flight
curl -X POST http://localhost:3000/api/trips/trip-id/flights \
  -H "Content-Type: application/json" \
  -H "X-Async-Request: true" \
  -d '{
    "airline": "United",
    "flightNumber": "UA123",
    "origin": "JFK",
    "destination": "LAX"
  }'

# Get flights
curl http://localhost:3000/api/trips/trip-id/flights

# Update flight
curl -X PUT http://localhost:3000/api/flights/flight-id \
  -H "Content-Type: application/json" \
  -H "X-Async-Request: true" \
  -d '{ "airline": "American" }'

# Delete flight
curl -X DELETE http://localhost:3000/api/flights/flight-id \
  -H "X-Async-Request: true"
```

### Using Postman

1. Create workspace "Bluebonnet"
2. Add environment variables:
   - `baseUrl` = `http://localhost:3000`
   - `tripId` = `<trip-id>`
   - `token` = `<auth-token>` (if needed)
3. Create requests for each endpoint
4. Test both with and without `X-Async-Request` header

---

## Performance Optimization

### Browser Performance

1. Open DevTools (F12)
2. Go to Performance tab
3. Click Record
4. Perform action
5. Stop recording
6. Analyze timeline

### Database Queries

1. Enable query logging: `LOG_LEVEL=debug`
2. Look for slow queries
3. Add indexes to frequently queried columns
4. Use `.include()` for eager loading (avoid N+1)

### Bundle Size

```bash
npm run build               # Build assets
ls -lh public/dist/         # Check sizes
```

---

## Restarting Services

### Node Server

```bash
# Ctrl+C to stop
npm run dev        # Restart
```

### PostgreSQL (Docker)

```bash
docker-compose down
docker-compose up database postgres  # Just the database
```

### Redis (Docker)

```bash
docker-compose down
docker-compose up redis    # Just Redis
```

### Full reset

```bash
docker-compose down
docker volume rm bluebonnet-postgres  # Delete DB data
docker-compose up --build
```

---

## Code Conventions

- **No console.log** - Use Winston logger instead
- **No alert() or confirm()** - Silent AJAX operations
- **Always validate on backend** - Never trust client
- **Check ownership** - Verify user owns trip/item
- **Use X-Async-Request header** - Differentiate AJAX from form submission
- **ISO date format** - Store dates as ISO strings in UTC
- **Cascade delete** - Deleting trip deletes all items

---

## Documentation

- **Context:** See `context.md`
- **Patterns:** See `patterns.md`
- **Features:** See `features.md`
- **Detailed:** See `.claude/ARCHITECTURE/` or `.claude/FEATURES/`
- **Archive:** See `.claude/ARCHIVE/` for Phase 2-3 planning

---

**Last Updated:** 2025-12-18
**Version:** 1.0 (Consolidated from DEVELOPMENT.md + TROUBLESHOOTING/SETUP_ISSUES.md)
**Size:** ~2 KB (vs 8+ KB original)
