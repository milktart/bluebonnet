# ⚠️ BUILD REQUIRED

The sidebar navigation fix requires **rebuilding the JavaScript bundles** to take effect.

## Why?

The source files (`public/js/trips-list.js` and `public/js/dashboard-handlers.js`) have been updated with ES6 module exports/imports, but these changes need to be bundled by esbuild before they'll work in the browser.

The dashboard currently serves pre-built bundles from `public/dist/` which contain the old code.

## How to Fix

Run one of these commands:

### Option 1: Build once
```bash
npm run build-js
```

### Option 2: Build and watch for changes (recommended during development)
```bash
npm run build-js:watch
```

### Option 3: Full production build
```bash
npm run build
```

### Option 4: Rebuild Docker containers (if using Docker)
```bash
docker-compose down
docker-compose up --build
```

## Verify the Fix

After rebuilding:

1. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache if needed
3. Log in as a new user (or user with no trips)
4. Click "Settings" tab → sidebar should update
5. Click "Past Trips" tab → sidebar should update

## Current Status

**Source files**: ✅ Updated with ES6 modules
**Bundles**: ❌ Not rebuilt (contains old code)
**Fix working**: ❌ Not until bundles are rebuilt

## What Was Fixed

- `public/js/trips-list.js` → Exports tab switching functions as ES6 modules
- `public/js/dashboard-handlers.js` → Imports functions directly (no global pollution)
- `views/trips/dashboard.ejs` → Removed duplicate script tag
- Architecture → Phase 4 compliant (no window.* globals)
