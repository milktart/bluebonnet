# 🔌 External Integrations

Third-party services and external APIs used by Bluebonnet.

---

## Services Overview

| Service          | Purpose            | Type            | Status |
| ---------------- | ------------------ | --------------- | ------ |
| **Nominatim**    | Location geocoding | Free API        | Active |
| **Airport Data** | Airport info       | Local JSON + DB | Active |
| **Redis**        | Caching            | In-memory store | Active |

---

## Nominatim API (Geocoding)

### Purpose

Converts address/location names to latitude/longitude coordinates.

**Examples:**

- "JFK Airport" → (40.6413, -73.7781)
- "Eiffel Tower, Paris" → (48.8584, 2.2945)

### Service Details

- **Provider:** OpenStreetMap
- **URL:** https://nominatim.openstreetmap.org
- **Auth:** None required (public API)
- **Rate Limit:** 1 request per second (configurable)

### Implementation

**File:** `services/geocodingService.js`

**Features:**

- In-memory caching (reduces API calls)
- Configurable rate limiting
- Timeout handling

**Configuration:**

```env
NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org
GEOCODING_TIMEOUT=10000
GEOCODING_RATE_LIMIT=1000
```

### Usage

```javascript
const { geocode } = require('./services/geocodingService');

const result = await geocode('Eiffel Tower, Paris');
// Returns: { lat: 48.8584, lng: 2.2945 }
```

### Limitations

- Free service (slower than paid)
- Rate limited to 1/second
- No authentication required but terms of service apply
- Should implement proper User-Agent header

---

## Airport Service

### Purpose

Provides airport information (names, IATA codes, coordinates, timezones).

**Examples:**

- "JFK" → "John F. Kennedy International Airport"
- "LHR" → "London Heathrow"

### Implementation

**File:** `services/airportService.js`

**Data Sources:**

- PostgreSQL: Main airport database
- JSON: `data/airports.json` (seeding data)
- Redis: Cached airport lookups

### Features

- IATA code lookup
- Airport search by name/city
- Timezone information
- Coordinates (lat/lng)

### Usage

```javascript
const airportService = require('./services/airportService');

// Get airport by IATA
const airport = await airportService.getAirport('JFK');
// Returns: { iata: 'JFK', name: 'John F. Kennedy ...', timezone: 'America/New_York', ... }

// Search airports
const results = await airportService.searchAirports('new york');
// Returns: [{ iata: 'JFK', name: 'John F. Kennedy ...' }, ...]
```

### Airline Information

**File:** `services/airportService.js`

Gets airline name from flight number:

```javascript
const airline = airportService.getAirlineNameFromFlightNumber('UA123');
// Returns: 'United Airlines'
```

**Data Source:** `data/airlines.json` (static)

---

## Redis Cache

### Purpose

In-memory data store for caching and session storage.

### Configuration

```env
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Optional
REDIS_DB=0       # Database number
```

### Usage

**Session Storage:**

```javascript
// Sessions stored in Redis automatically
// via connect-redis middleware
```

**Manual Caching:**

```javascript
const redis = require('redis');
const client = redis.createClient();

// Set cache
await client.set('airport:JFK', JSON.stringify(data), { EX: 86400 });

// Get cache
const data = await client.get('airport:JFK');
```

### Cache Keys Pattern

- `airport:{iata}` - Airport data
- `search:airports:{query}` - Search results
- `session:*` - User sessions

### Benefits

- Faster response times
- Reduced database queries
- Session persistence
- Can be cleared easily

---

## Integration Patterns

### API Error Handling

```javascript
try {
  const result = await geocode(address);
} catch (error) {
  logger.error('Geocoding error:', error);
  // Fallback behavior
  return null; // or previous value
}
```

### Rate Limiting

```javascript
// Nominatim limited to 1/second
await new Promise((resolve) => setTimeout(resolve, 1000));
const result = await geocode(address);
```

### Caching Pattern

```javascript
// Check cache first
let data = await cache.get(key);

// If not in cache, fetch
if (!data) {
  data = await externalService.fetch(params);
  await cache.set(key, data, TTL);
}

return data;
```

---

## Future Integrations (Planned)

### Phase 2+

- [ ] Real-time weather API
- [ ] Currency exchange rates
- [ ] Hotel/flight booking APIs
- [ ] Email service (SendGrid, etc.)
- [ ] SMS notifications (Twilio, etc.)
- [ ] Error tracking (Sentry, etc.)

---

## Monitoring & Health Checks

### Checking Service Health

```javascript
// Check if Nominatim is responding
const isHealthy = await checkNominatimHealth();

// Check if Redis is available
const redisHealthy = await redis.ping();
```

### Logging

All integration calls logged:

```
[INFO] Nominatim request: Eiffel Tower, Paris
[INFO] Nominatim response: 48.8584, 2.2945 (123ms)
[WARN] Nominatim rate limit approaching
[ERROR] Nominatim timeout (> 10s)
```

---

## Costs

### Current

- **Nominatim:** Free (public API)
- **Redis:** Free (self-hosted)
- **Airport data:** Free (public JSON)
- **Airlines data:** Free (static data)

### Estimated Monthly Costs

- $0 (all free services)

### Scaling Costs (Future)

- Nominatim: Free tier (rate-limited)
- Redis: $12-30/month (managed service)
- Weather API: $10-100/month
- Email service: $10-100/month

---

## Related Documentation

- **[Geocoding Service](./GEOCODING.md)** (coming)
- **[Airport Service](./AIRPORT_SERVICE.md)** (coming)
- **[Architecture Overview](../README.md)** - System design
- **[Integration Testing](../../TESTING/INTEGRATION_TESTING.md)** - Testing integrations

---

**Last Updated:** 2025-12-17
**Status:** All integrations active and tested
