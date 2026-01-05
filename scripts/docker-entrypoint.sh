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
cd /app/frontend
npm run build
cd /app

# Start the application
echo "🎉 Starting application server..."
# Run with unbuffered output so logs appear in docker compose logs
exec node --unhandled-rejections=strict server.js
