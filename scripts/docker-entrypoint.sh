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

# Check if database needs initialization
echo "🔍 Checking database status..."
DB_NEEDS_INIT=$(node -e "
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

if [ "$DB_NEEDS_INIT" = "true" ]; then
  echo "🔧 Database needs initialization..."

  # Sync database schema
  echo "📊 Creating database tables..."
  npm run db:sync

  # Seed airport data
  echo "✈️  Seeding airport data..."
  npm run db:seed-airports

  echo "✅ Database initialization complete!"
else
  echo "✅ Database already initialized, skipping setup"
fi

# Start the application
echo "🎉 Starting application server..."
exec "$@"
