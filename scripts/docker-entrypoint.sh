#!/bin/sh
set -e

echo "🚀 Starting Bluebonnet Travel Planner..."

# Fix /app/node_modules ownership if needed
if [ -d /app/node_modules ]; then
  MODULES_OWNER=$(ls -ld /app/node_modules | awk '{print $3}')
  if [ "$MODULES_OWNER" != "nodejs" ]; then
    chown -R nodejs:nodejs /app/node_modules
  fi
fi

# Wait for postgres to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until node -e "const { sequelize } = require('./models'); sequelize.authenticate().then(() => process.exit(0)).catch(() => process.exit(1));" 2>/dev/null; do
  echo "   Postgres is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Sync database schema
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
npm run build-js

# Build SvelteKit frontend
echo "📦 Building SvelteKit frontend..."

cd /app/frontend

# If node_modules exists but has wrong owner, remove it and rebuild
if [ -d node_modules ]; then
  NODE_MODULES_OWNER=$(ls -ld node_modules | awk '{print $3}')
  CURRENT_USER=$(whoami)
  if [ "$NODE_MODULES_OWNER" != "$CURRENT_USER" ]; then
    rm -rf node_modules
  fi
fi

# Use npm install if package-lock.json doesn't exist, otherwise use npm ci
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

npm run build

if [ $? -ne 0 ]; then
  echo "❌ Frontend build failed!"
  exit 1
fi

echo "✅ SvelteKit frontend built successfully!"

# Fix ownership of all frontend build artifacts created by npm/build process
if [ "$(whoami)" = "root" ]; then
  chown -R nodejs:nodejs /app/frontend/node_modules 2>/dev/null || true
  chown -R nodejs:nodejs /app/frontend/build 2>/dev/null || true
  chown -R nodejs:nodejs /app/frontend/.svelte-kit 2>/dev/null || true
fi

cd /app

# Clean up dev dependencies in production
if [ "$NODE_ENV" = "production" ] || [ "$NODE_ENV" = "prod" ]; then
  echo "🧹 Cleaning up dev dependencies for production..."
  npm prune --omit=dev --include-workspace-root
  echo "✅ Dev dependencies cleaned!"
fi

# Start the application
echo "🎉 Starting application server..."
exec node --unhandled-rejections=strict /app/server.js
