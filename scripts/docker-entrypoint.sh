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

# Build SvelteKit frontend
echo "📦 Building SvelteKit frontend..."

# Debug: Check current user and directory permissions
echo "   DEBUG: Current user: $(whoami) (UID: $(id -u))"
echo "   DEBUG: /app ownership: $(ls -ld /app | awk '{print $3":"$4}')"
echo "   DEBUG: /app/frontend ownership: $(ls -ld /app/frontend | awk '{print $3":"$4}')"

# Fix permissions on volume-mounted directories so nodejs user can write
echo "   Fixing permissions on volume-mounted directories..."
chmod -R 755 /app 2>/dev/null || true
chmod -R 755 /app/frontend 2>/dev/null || true
chown -R nodejs:nodejs /app/frontend 2>/dev/null || true

# Clean all caches and node_modules to avoid permission issues
echo "   Cleaning Vite caches and node_modules..."
rm -rf /app/node_modules/.vite /app/node_modules/.vite-temp 2>/dev/null || true
rm -rf /app/frontend/node_modules/.vite /app/frontend/node_modules/.vite-temp /app/frontend/node_modules 2>/dev/null || true
rm -rf /app/.svelte-kit /app/frontend/.svelte-kit 2>/dev/null || true

# Build frontend (as root, will be optimized later)
echo "   Installing frontend dependencies..."
cd /app/frontend
npm ci 2>&1 | grep -E "(added|up to date)" | head -3

echo "   Clearing Vite cache..."
rm -rf node_modules/.vite node_modules/.vite-temp /app/node_modules/.vite /app/node_modules/.vite-temp 2>/dev/null || true

echo "   Running npm run build..."
npm run build

if [ $? -ne 0 ]; then
  echo "   ❌ Frontend build failed!"
  exit 1
fi

echo "   ✅ SvelteKit frontend built successfully!"
cd /app

# Clean up dev dependencies in production to reduce runtime image size
if [ "$NODE_ENV" = "production" ] || [ "$NODE_ENV" = "prod" ]; then
  echo "🧹 Cleaning up dev dependencies for production..."
  npm prune --omit=dev --include-workspace-root 2>&1 | tail -3
  echo "   ✅ Dev dependencies cleaned!"
fi

# Start the application with retry logic
echo "🎉 Starting application server..."

# Retry logic for application startup (up to 10 attempts, 3 seconds apart)
MAX_RETRIES=10
RETRY_COUNT=0
RETRY_DELAY=3

until [ $RETRY_COUNT -ge $MAX_RETRIES ]; do
  echo "   Attempt $((RETRY_COUNT + 1))/$MAX_RETRIES to start application server..."

  # Run node server with a timeout to detect early failures
  timeout 5 node --unhandled-rejections=strict server.js &
  SERVER_PID=$!

  # Wait for the process to either succeed or fail
  if wait $SERVER_PID 2>/dev/null; then
    # Server exited successfully (should not happen, but if it does, server is running)
    exec node --unhandled-rejections=strict server.js
  else
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 124 ]; then
      # Timeout exit code - server is running, exec it
      exec node --unhandled-rejections=strict server.js
    fi
  fi

  # Server failed to start, retry
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
    echo "   Application server startup failed, retrying in ${RETRY_DELAY}s..."
    sleep $RETRY_DELAY
  fi
done

echo "❌ Failed to start application server after $MAX_RETRIES attempts"
exit 1
