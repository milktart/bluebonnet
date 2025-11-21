# Force Complete Docker Rebuild

The bundle hash isn't changing because Docker is using cached layers from before the code changes.

## Solution: Force rebuild without cache

```bash
# Stop and remove all containers, images, and rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up
```

## Why This Is Needed

Docker caches build layers for performance. When you run `docker-compose up --build`, it may reuse cached layers from before the code changes were made. This means:

1. ❌ Cached layer has old `public/js/trips-list.js` (without exports)
2. ❌ Build runs `npm run build-js` with old code
3. ❌ Creates same bundle hash: `dashboard-B47MR47M.js`
4. ❌ New code never gets bundled

## With `--no-cache`

1. ✅ Docker ignores all cached layers
2. ✅ Copies fresh code from repo (with exports)
3. ✅ Runs `npm run build-js` with new code
4. ✅ Creates new bundle with new hash (e.g., `dashboard-XYZ123.js`)

## Quick Commands

```bash
# Full rebuild (recommended)
docker-compose down && docker-compose build --no-cache && docker-compose up

# Or rebuild just the app service
docker-compose build --no-cache app
docker-compose up

# Verify bundles are new
docker-compose exec app ls -lh /app/public/dist/
```

## After This Works

Once you see a new bundle hash (not B47MR47M), future rebuilds with `docker-compose up --build` will work normally since the cache will be fresh.
