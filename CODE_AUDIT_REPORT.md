# BLUEBONNET CODE AUDIT - COMPREHENSIVE REPORT

**Date**: November 20, 2025  
**Thoroughness Level**: Very Thorough  
**Repository**: /home/user/bluebonnet

---

## EXECUTIVE SUMMARY

This audit identified **7 unused files** (~1,600+ lines of dead code), **3 categories of hardcoded values**, and **duplicate code patterns** across the codebase. The duplicate files are remnants from a previous consolidation effort documented in `/home/user/bluebonnet/public/js/README.md`.

**Critical Issues Found**: 7 files should be deleted immediately  
**Medium Issues**: Hardcoded timeouts and database configuration  
**Low Issues**: Duplicate error response patterns, console.log statements

---

## PART 1: UNUSED FILES - DELETE THESE IMMEDIATELY

### Backup Files (3 files)

#### 1. `/home/user/bluebonnet/views/trips/trip.ejs.backup`

- **Type**: EJS Template Backup
- **Size**: ~6.5 KB
- **Last Modified**: November 20, 2025
- **Status**: COMPLETELY UNUSED
- **Verification**: Not referenced in any active files
- **Recommendation**: DELETE - Old backup of current trip.ejs template

#### 2. `/home/user/bluebonnet/views/account/vouchers.ejs.backup`

- **Type**: EJS Template Backup
- **Size**: ~2.5 KB
- **Last Modified**: November 20, 2025
- **Status**: COMPLETELY UNUSED
- **Verification**: Not referenced in any active files
- **Recommendation**: DELETE - Old backup of current vouchers.ejs template

#### 3. `/home/user/bluebonnet/data/airports.json.backup`

- **Type**: JSON Data Backup
- **Size**: Significant (estimated 200+ KB)
- **Status**: COMPLETELY UNUSED
- **Reason**: System migrated to PostgreSQL database; JSON file is no longer used
- **Verification**: Airport data now sourced from database in models/Airport.js
- **Recommendation**: DELETE - Legacy backup no longer needed

---

### Duplicate JavaScript Files (4 files) - CONSOLIDATION REMNANTS

These 4 files contain code that has already been consolidated into other files according to `/home/user/bluebonnet/public/js/README.md`. They are NOT LOADED in any templates and duplicate functionality in newer consolidated modules.

#### 4. `/home/user/bluebonnet/public/js/trip-view-map.js` (131 lines)

**Status**: DEAD CODE - Duplicate of maps.js functionality

**Duplicated Functions**:

```javascript
// Line 8-20: calculateDistance()
// DUPLICATE: Also in maps.js line 602-620
// Calculates distance between two geographic coordinates

// Line 22-26: getPointAtDistance()
// DUPLICATE: Also in maps.js line 623-630
// Interpolates point along path at given percentage

// Line 28-109: highlightMapMarker()
// DUPLICATE: Also in maps.js line 634-724
// Animates marker movement along flight path

// Line 111-130: unhighlightMapMarker()
// DUPLICATE: Also in maps.js line 726-764
// Clears marker animation
```

**Why It's Dead Code**:

- `/home/user/bluebonnet/public/js/README.md` line 9 explicitly states: `maps.js "Combines map.js, trip-map.js, and trip-view-map.js"`
- NOT loaded in any EJS templates (verified with grep)
- Global variables it depends on (`activeAnimations`, `currentMap`, `mapInitialized`) are defined in trip.ejs, not this file
- maps.js already exports all these functions (verified in module.exports at line 770-786)
- Consolidation was documented on line 593 of maps.js: `// INTERACTIVE MAP ANIMATIONS (from trip-view-map.js)`

**File Verification**:

```bash
$ grep -r "trip-view-map\.js" /home/user/bluebonnet/views --include="*.ejs"
# Returns nothing - file is not loaded anywhere
```

**Recommendation**: DELETE this file; maps.js contains all functionality

---

#### 5. `/home/user/bluebonnet/public/js/item-companions-loader.js` (359 lines)

**Status**: DEAD CODE - Duplicate of companions.js functionality

**Duplicated Functions**:

```javascript
// Line 18: loadItemCompanions()
// DUPLICATE: Now in companions.js via ItemCompanionLoader class

// Line 58: displayItemCompanions()
// DUPLICATE: Now in companions.js via ItemCompanionLoader class

// Line 98: removeCompanionFromItem()
// DUPLICATE: Now in companions.js via ItemCompanionLoader class

// Line 157: updateCompanionIdsForSubmission()
// DUPLICATE: Now in companions.js via ItemCompanionLoader class

// Line 178: initializeItemCompanions()
// DUPLICATE: Now in companions.js via ItemCompanionLoader class

// Line 207: initializeCompanionSearch()
// DUPLICATE: Now in companions.js via ItemCompanionLoader class

// Line 285: addCompanionToItem()
// DUPLICATE: Now in companions.js via ItemCompanionLoader class
```

**Why It's Dead Code**:

- `/home/user/bluebonnet/public/js/README.md` line 3 explicitly states: `companions.js "Combines companion-selector.js, companions-manager.js, and item-companions-loader.js"`
- NOT loaded in any EJS templates (verified with grep)
- companions.js contains full ItemCompanionLoader class (line 674) with identical functionality
- Consolidation was a deliberate refactoring documented in the README

**Recommendation**: DELETE this file; companions.js contains all functionality

---

#### 6. `/home/user/bluebonnet/public/js/companion-selector.js` (359 lines)

**Status**: DEAD CODE - Duplicate of companions.js functionality

**Duplicated Classes/Functions**:

```javascript
// Line 1: class CompanionSelector
// DUPLICATE: Exported from companions.js as export class CompanionSelector

// Line 352: initCompanionSelector()
// DUPLICATE: Available in companions.js
```

**Why It's Dead Code**:

- NOT loaded in any EJS templates (verified with grep)
- Same consolidation documented in `/home/user/bluebonnet/public/js/README.md`
- companions.js has export class CompanionSelector with full implementation

**File Verification**:

```bash
$ grep -r "companion-selector\.js" /home/user/bluebonnet --include="*.ejs" --include="*.js" --exclude-dir=node_modules
# Returns nothing - file is not loaded anywhere
```

**Recommendation**: DELETE this file; companions.js contains all functionality

---

#### 7. `/home/user/bluebonnet/public/js/companions-manager.js` (283 lines)

**Status**: DEAD CODE - Duplicate of companions.js functionality

**Duplicated Classes/Functions**:

```javascript
// Entire file duplicates CompanionManager class
// DUPLICATE: Exported from companions.js as export class CompanionManager
```

**Why It's Dead Code**:

- NOT loaded in any EJS templates
- Part of documented consolidation in `/home/user/bluebonnet/public/js/README.md`
- companions.js has export class CompanionManager with full implementation

**Recommendation**: DELETE this file; companions.js contains all functionality

---

## PART 2: HARDCODED VALUES ANALYSIS

### Category A: Database Configuration (Repeated 3 Times)

**File**: `/home/user/bluebonnet/config/database.js`

**Issue 1: Database Host Defaults**

```javascript
// Line 8 (development)
host: process.env.DB_HOST || 'localhost',

// Line 27 (test)
host: process.env.DB_HOST || 'localhost',

// Line 47 (production)
host: process.env.DB_HOST || 'localhost',
```

**Problem**: `'localhost'` string repeated 3 times - violates DRY principle  
**Recommendation**: Extract to constant at top of file

**Issue 2: Database Port Defaults**

```javascript
// Line 9 (development)
port: process.env.DB_PORT || 5432,

// Line 28 (test)
port: process.env.DB_PORT || 5432,

// Line 47 (production)
port: process.env.DB_PORT || 5432,
```

**Problem**: Port `5432` repeated 3 times  
**Recommendation**: Extract to constant

**Issue 3: Pool Acquire Timeout - HARDCODED**

```javascript
// Line 19 (development)
acquire: 30000,

// Line 38 (test)
acquire: 30000,

// Line 68 (production)
acquire: 30000,
```

**Problem**: 30-second timeout is hardcoded and repeated 3 times  
**Status**: NOT configurable via environment variable  
**Impact**: Cannot tune for different deployment environments  
**Recommendation**: Make configurable via `POOL_ACQUIRE_TIMEOUT` env var with default 30000

**Suggested Fix**:

```javascript
// At top of database.js
const DB_HOST_DEFAULT = 'localhost';
const DB_PORT_DEFAULT = 5432;
const POOL_ACQUIRE_TIMEOUT = parseInt(process.env.POOL_ACQUIRE_TIMEOUT, 10) || 30000;

// Then use in all 3 configs
host: process.env.DB_HOST || DB_HOST_DEFAULT,
port: process.env.DB_PORT || DB_PORT_DEFAULT,
acquire: POOL_ACQUIRE_TIMEOUT,
```

---

### Category B: WebSocket Configuration

**File**: `/home/user/bluebonnet/services/socketService.js:37-38`

```javascript
io = new Server(server, {
  cors: { ... },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,      // HARDCODED - 60 seconds
  pingInterval: 25000,     // HARDCODED - 25 seconds
  allowUpgrades: true,
});
```

**Problem**: Socket timeout values are hardcoded  
**Status**: NOT configurable via environment variables  
**Impact**: Cannot tune for different network conditions or deployment environments

**Recommendation**: Make configurable:

```javascript
const SOCKET_PING_TIMEOUT = parseInt(process.env.SOCKET_PING_TIMEOUT, 10) || 60000;
const SOCKET_PING_INTERVAL = parseInt(process.env.SOCKET_PING_INTERVAL, 10) || 25000;

io = new Server(server, {
  cors: { ... },
  transports: ['websocket', 'polling'],
  pingTimeout: SOCKET_PING_TIMEOUT,
  pingInterval: SOCKET_PING_INTERVAL,
  allowUpgrades: true,
});
```

---

### Category C: Geocoding Service (PROPERLY CONFIGURED)

**File**: `/home/user/bluebonnet/services/geocodingService.js:6-8`

```javascript
const NOMINATIM_BASE_URL = process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org';
const GEOCODING_TIMEOUT = parseInt(process.env.GEOCODING_TIMEOUT, 10) || 10000;
const MIN_REQUEST_INTERVAL = parseInt(process.env.GEOCODING_RATE_LIMIT, 10) || 1000;
```

**Status**: GOOD - Already using environment variables with sensible defaults  
**No Action Required**

---

### Category D: Redis Configuration (PROPERLY CONFIGURED)

**File**: `/home/user/bluebonnet/utils/redis.js:13`

```javascript
host: process.env.REDIS_HOST || 'localhost',
```

**Status**: GOOD - Already using environment variable  
**No Action Required**

---

### Category E: Server Port (PROPERLY CONFIGURED)

**File**: `/home/user/bluebonnet/server.js:273`

```javascript
const PORT = process.env.PORT || 3000;
```

**Status**: GOOD - Already using environment variable  
**No Action Required**

---

## PART 3: DUPLICATE CODE PATTERNS

### Pattern 1: Error Response Format (Multiple Controllers)

**Issue**: Repeated error response pattern across all controllers

**Example from** `/home/user/bluebonnet/controllers/notificationController.js:34`:

```javascript
return res.status(500).json({
  success: false,
  error: 'Error message here',
});
```

**Locations** (>30 instances):

- `/home/user/bluebonnet/controllers/notificationController.js` - 7 instances
- `/home/user/bluebonnet/controllers/tripInvitationController.js` - 4 instances
- `/home/user/bluebonnet/controllers/hotelController.js` - Multiple instances
- `/home/user/bluebonnet/controllers/voucherController.js` - Multiple instances
- Other controllers follow same pattern

**Recommendation**: Use helper function (or enhance existing `/home/user/bluebonnet/utils/apiResponse.js`):

```javascript
const sendError = (res, statusCode, errorMessage) => {
  res.status(statusCode).json({
    success: false,
    error: errorMessage,
  });
};

// Usage in controllers
sendError(res, 500, 'Error deleting hotel');
```

---

### Pattern 2: HTTP Status Code Constants

**Issue**: Hardcoded status codes scattered throughout controllers

**Found**:

- `res.status(500)` - Server error (most common)
- `res.status(403)` - Forbidden
- `res.status(400)` - Bad request
- `res.status(404)` - Not found

**Recommendation**: Create HTTP status constant in utils:

```javascript
// utils/httpStatus.js
module.exports = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVER_ERROR: 500,
};
```

---

### Pattern 3: Redirect Patterns (ALREADY OPTIMIZED)

**File**: `/home/user/bluebonnet/controllers/tripController.js`

**Status**: GOOD - Already using helper functions from `resourceController.js`

- `redirectAfterSuccess()` - standardized success redirects
- `redirectAfterError()` - standardized error redirects

**No Action Required**

---

## PART 4: CONSOLE.LOG STATEMENTS

**Total Count in Frontend**: 79 console.log statements

**Files with Most Statements**:

1. `/home/user/bluebonnet/public/js/eventBus.js` - Debug logging (intentional)
2. `/home/user/bluebonnet/public/js/datetime-formatter.js` - Development debugging
3. `/home/user/bluebonnet/public/js/async-form-handler.js` - Form debugging
4. `/home/user/bluebonnet/public/js/companions.js` - Multiple debug statements
5. `/home/user/bluebonnet/public/js/item-companions-loader.js` - Debug statements
6. `/home/user/bluebonnet/public/js/common-handlers.js` - Status messages

**Backend Status**: EXCELLENT

- All backend code correctly uses Winston logger
- No console.log statements found in controllers, services, or middleware
- Follows CLAUDE.md requirement perfectly

**Frontend Note**: These console.log statements are development/debugging code. While frontend console.log is acceptable, consider:

1. Wrapping in debug mode flags for production
2. Using consistent debug format across files
3. Removing before final production build

---

## PART 5: OTHER CODE QUALITY OBSERVATIONS

### Good Practices Found

1. **Resource Controller Pattern** ✓
   - `/home/user/bluebonnet/controllers/helpers/resourceController.js`
   - Properly DRY'd up common CRUD patterns
   - Used consistently across controllers

2. **Logging Architecture** ✓
   - Winston logger used throughout backend
   - Consistent logging calls
   - Appropriate log levels

3. **Constants Management** ✓
   - `/home/user/bluebonnet/utils/constants.js` for time calculations
   - Proper use of constants for MS_PER_HOUR, MS_PER_DAY, etc.

4. **Environment Variable Usage** ✓
   - Proper defaults for all env-configurable values
   - Services (geocoding, Redis) well-configured

5. **Model Architecture** ✓
   - Clear MVC separation
   - Proper use of Sequelize models
   - Good association patterns

---

### Areas for Code Quality Improvement

1. **Move Database Config to Constant**
   - Extract repeated 'localhost' and 5432 defaults

2. **Externalize WebSocket Timeouts**
   - Make pingTimeout and pingInterval environment-configurable

3. **HTTP Status Code Constants**
   - Create unified status code enum for all controllers

4. **Local Require Statement**
   - `/home/user/bluebonnet/controllers/flightController.js:551`
   - Move models require to top-level imports (currently inside function)

5. **Database Pool Configuration**
   - Extract pool config to DRY constant (currently repeated 3x)

---

## SUMMARY TABLE

| Issue Type                | Count | Severity | Action      | Files Affected       |
| ------------------------- | ----- | -------- | ----------- | -------------------- |
| Backup Files              | 3     | HIGH     | DELETE      | 3 files              |
| Duplicate JS Files        | 4     | HIGH     | DELETE      | 4 files              |
| Hardcoded Pool Timeout    | 3     | MEDIUM   | EXTERNALIZE | database.js          |
| Hardcoded Socket Timeouts | 2     | MEDIUM   | EXTERNALIZE | socketService.js     |
| Repeated DB Defaults      | 6     | LOW      | CONSOLIDATE | database.js          |
| Error Response Patterns   | 30+   | LOW      | REFACTOR    | Multiple controllers |
| Console.log Statements    | 79    | LOW      | MONITOR     | Frontend JS          |

---

## CLEANUP CHECKLIST

### Phase 1: Immediate Cleanup (Delete Unused Files)

- [ ] Delete `/home/user/bluebonnet/views/trips/trip.ejs.backup`
- [ ] Delete `/home/user/bluebonnet/views/account/vouchers.ejs.backup`
- [ ] Delete `/home/user/bluebonnet/data/airports.json.backup`
- [ ] Delete `/home/user/bluebonnet/public/js/trip-view-map.js`
- [ ] Delete `/home/user/bluebonnet/public/js/item-companions-loader.js`
- [ ] Delete `/home/user/bluebonnet/public/js/companion-selector.js`
- [ ] Delete `/home/user/bluebonnet/public/js/companions-manager.js`
- [ ] Commit changes with message: "Remove dead code: delete consolidated/backup files"

### Phase 2: Configuration Externalization (Make Configurable)

- [ ] Externalize database pool timeout (30000ms)
- [ ] Externalize WebSocket ping timeout (60000ms)
- [ ] Externalize WebSocket ping interval (25000ms)
- [ ] Add env var documentation to CLAUDE.md
- [ ] Commit changes with message: "Externalize hardcoded timeouts as env vars"

### Phase 3: Code Quality (Optional, Lower Priority)

- [ ] Create HTTP status code constants
- [ ] Consolidate database configuration defaults
- [ ] Move flightController local requires to top-level
- [ ] Consider debug mode for frontend console.log statements

---

## ESTIMATED IMPACT

**Code Reduction**: 1,600+ lines deleted (dead code removal)
**Configuration Improvement**: 8+ hardcoded values externalized
**Cleanup Time**: ~30 minutes for Phase 1 + testing

---
