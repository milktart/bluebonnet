#!/bin/sh
set -e

echo "🚀 Starting Bluebonnet Travel Planner..."

# Wait for postgres to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until node -e "const { sequelize } = require('./models'); sequelize.authenticate().then(() => process.exit(0)).catch(() => process.exit(1));" 2>/dev/null; do
  echo "   Postgres is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Always sync database schema to ensure models are up to date
echo "📊 Syncing database schema..."
npm run db:sync

# Check if database needs airport data seeding
echo "🔍 Checking if airport data needs seeding..."
DB_NEEDS_AIRPORTS=$(node -e "
const { Airport } = require('./models');
Airport.count()
  .then(count => {
    if (count === 0) {
      console.log('true');
    } else {
      console.log('false');
    }
    process.exit(0);
  })
  .catch(() => {
    console.log('true');
    process.exit(0);
  });
" 2>/dev/null || echo "true")

if [ "$DB_NEEDS_AIRPORTS" = "true" ]; then
  echo "✈️  Seeding airport data..."
  npm run db:seed-airports
  echo "✅ Airport data seeded!"
else
  echo "✅ Airport data already exists, skipping seed"
fi

echo "✅ Database setup complete!"

# Build JavaScript bundles
echo "📦 Building JavaScript bundles..."
if npm run build-js 2>&1 | grep -q "Build complete\|Build failed"; then
  echo "✅ JavaScript bundles built successfully!"
else
  echo "⚠️  Bundle build had warnings, but continuing..."
fi

# Always build the SvelteKit frontend (development or production)
echo "📦 Building SvelteKit frontend..."

# Debug: Check current user and directory permissions
echo "   DEBUG: Current user: $(whoami) (UID: $(id -u))"
echo "   DEBUG: /app ownership: $(ls -ld /app | awk '{print $3":"$4}')"
echo "   DEBUG: /app/frontend ownership: $(ls -ld /app/frontend | awk '{print $3":"$4}')"

# Fix permissions on /app and /app/frontend to ensure nodejs user can write
echo "   Fixing permissions for nodejs user..."
chmod -R u+w /app
chmod -R u+w /app/frontend || true

# Clean all caches and node_modules to avoid permission issues
echo "   Cleaning Vite caches..."
rm -rf /app/node_modules/.vite /app/node_modules/.vite-temp 2>/dev/null || true
rm -rf /app/frontend/node_modules/.vite /app/frontend/node_modules/.vite-temp /app/frontend/node_modules 2>/dev/null || true
rm -rf /app/.svelte-kit /app/frontend/.svelte-kit 2>/dev/null || true

# Ensure frontend dependencies are fully installed
echo "   Installing frontend dependencies with npm ci..."
cd /app/frontend
npm ci 2>&1 | head -20
if [ $? -ne 0 ]; then
  echo "   ERROR: npm ci failed!"
  echo "   DEBUG: /app/frontend contents:"
  ls -la /app/frontend | head -10
  echo "   DEBUG: /app/frontend permissions: $(ls -ld /app/frontend)"
  exit 1
fi

# Clear cache again after install
echo "   Clearing Vite cache after npm ci..."
rm -rf node_modules/.vite node_modules/.vite-temp /app/node_modules/.vite /app/node_modules/.vite-temp 2>/dev/null || true

# Use npm run build to use the package.json script
echo "   Running npm run build..."
npm run build
cd /app
echo "   ✅ SvelteKit frontend built successfully!"

# Start the application
echo "🎉 Starting application server..."
# Run with unbuffered output so logs appear in docker compose logs
exec node --unhandled-rejections=strict server.js
