# Bluebonnet Travel Planner - Fresh Setup Guide

This guide provides step-by-step instructions for cloning and setting up a fresh Bluebonnet environment.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start (Docker - Recommended)](#quick-start-docker---recommended)
- [Manual Setup (Local Development)](#manual-setup-local-development)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Git** - For cloning the repository
- **Docker & Docker Compose** - For containerized setup (recommended)
  - Docker Engine 20.10+
  - Docker Compose 2.0+

OR (for local development without Docker):

- **Node.js** 20+ LTS
- **PostgreSQL** 15+
- **Redis** 7+ (optional, but recommended for production)
- **npm** (comes with Node.js)

---

## Quick Start (Docker - Recommended)

This is the fastest and most reliable way to get started. Docker handles all dependencies automatically.

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd bluebonnet
```

### Step 2: Create Environment File

```bash
cp .env.example .env
```

The `.env.example` file now includes all required variables with sensible defaults. For development, you can use it as-is or customize:

```bash
# Server Configuration
NODE_ENV=development             # Environment: development, production, test
PORT=3000                        # Application port for local development
APP_PORT=3500                    # Docker exposed port

# Database Configuration (Docker uses service name 'postgres')
DB_HOST=localhost                # Use 'postgres' when running in Docker
DB_PORT=5432
DB_NAME=travel_planner
DB_USER=postgres
DB_PASSWORD=postgres

# Redis Configuration
REDIS_ENABLED=false              # Set to true for production
REDIS_HOST=localhost
REDIS_PORT=6379

# Session Configuration
SESSION_SECRET=your-secret-key-here-change-in-production-use-random-string
```

**Important:** For production, generate a strong random secret:
```bash
openssl rand -hex 32
```

### Step 3: Build and Start

```bash
docker-compose up --build
```

This will:
- ✅ Build the application container (automatically selects dev/prod based on NODE_ENV)
- ✅ Start PostgreSQL database
- ✅ Start Redis cache
- ✅ Wait for services to be healthy
- ✅ Automatically initialize the database (create tables)
- ✅ Automatically seed airport data
- ✅ Start the application

### Step 4: Access the Application

Open your browser and navigate to:

```
http://localhost:3500
```

That's it! The application is now running with a fully initialized database.

---

## Manual Setup (Local Development)

If you prefer to run without Docker:

### Step 1: Clone and Install

```bash
git clone <repository-url>
cd bluebonnet
npm install
```

### Step 2: Start PostgreSQL

Ensure PostgreSQL 15+ is running locally:

```bash
# macOS (Homebrew)
brew services start postgresql@15

# Ubuntu/Debian
sudo systemctl start postgresql

# Windows
# Start via Services or pgAdmin
```

### Step 3: Create Database

```bash
createdb travel_planner
```

Or via psql:

```sql
CREATE DATABASE travel_planner;
```

### Step 4: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` for local development:

```bash
NODE_ENV=development
PORT=3000
DB_HOST=localhost    # For local PostgreSQL
DB_PORT=5432
DB_NAME=travel_planner
DB_USER=postgres
DB_PASSWORD=your_postgres_password
SESSION_SECRET=your-secret-key-change-in-production
LOG_LEVEL=info
```

### Step 5: Initialize Database

```bash
# Create database tables
npm run db:sync

# Seed airport data
npm run db:seed-airports
```

### Step 6: Build Assets

```bash
# Build JavaScript bundles
npm run build-js

# Build CSS (in another terminal for watch mode)
npm run build-css
```

### Step 7: Start Development Server

```bash
npm run dev
```

Access at: `http://localhost:3000`

---

## Environment Modes

The unified Dockerfile supports both development and production environments:

### Development Mode (default)

```bash
NODE_ENV=development docker-compose up --build
```

Features:
- Includes all dependencies (including devDependencies)
- Runs `npm run dev` with nodemon for hot-reload
- Faster build time
- Full debugging capabilities
- Runs as root for volume mount flexibility

### Production Mode

```bash
NODE_ENV=production docker-compose up --build
```

Features:
- Multi-stage build for smaller image size
- Only production dependencies included
- Runs as non-root user (nodejs:nodejs) for security
- Health checks enabled
- Optimized asset builds
- Runs `node server.js` directly

---

## Verification

After setup, verify everything works:

### 1. Check Application Health

```bash
curl http://localhost:3500/health

# Expected response:
# {"status":"healthy","timestamp":"...","uptime":...}
```

### 2. Check Database Connection

```bash
# Via Docker
docker exec -it development_travel_planner_db psql -U postgres -d development_travel_planner -c "SELECT COUNT(*) FROM airports;"

# Expected: Should return a count > 0 (airports seeded)
```

### 3. Check Redis Connection

```bash
# Via Docker
docker exec -it development_travel_planner_redis redis-cli PING

# Expected: PONG
```

### 4. Register a User

1. Navigate to `http://localhost:3500/register`
2. Create a test account
3. Login successfully
4. Verify dashboard loads

---

## Troubleshooting

### Container won't start - Port already in use

**Error:** `Bind for 0.0.0.0:3500 failed: port is already allocated`

**Solution:**

```bash
# Find what's using the port
lsof -i :3500

# Kill the process or change APP_PORT in .env
APP_PORT=3501
```

### Database connection failed

**Error:** `ECONNREFUSED` or `database "development_travel_planner" does not exist`

**Check:**

1. PostgreSQL container is running:
   ```bash
   docker ps | grep postgres
   ```

2. Database was created:
   ```bash
   docker exec -it development_travel_planner_db psql -U postgres -l
   ```

3. DB_HOST is correct:
   - Docker: Should be `postgres` (service name)
   - Local: Should be `localhost`

### Assets not loading (404 on CSS/JS)

**Problem:** Static files return 404

**Solution:**

Build assets before starting:

```bash
# If using Docker
docker-compose down
docker-compose up --build

# If local development
npm run build-js
npm run build-css-prod
npm run dev
```

### Airport data not seeding

**Check logs:**

```bash
docker-compose logs app | grep -i airport
```

**Manual seed:**

```bash
# Via Docker
docker exec -it development_travel_planner_app npm run db:seed-airports

# Local
npm run db:seed-airports
```

### Docker build fails

**Error:** Various build errors

**Solution:**

Clear Docker cache and rebuild:

```bash
docker-compose down -v
docker system prune -af
docker-compose up --build
```

---

## Production Deployment

For production deployment:

1. Copy `.env.production.example` to `.env`
2. Set `NODE_ENV=production`
3. Fill in all REQUIRED values (especially secrets!)
4. Use strong passwords for `DB_PASSWORD` and `SESSION_SECRET`
5. Enable SSL/TLS for database if remote
6. Set `REDIS_ENABLED=true`
7. Configure proper logging and monitoring

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete production deployment procedures.

---

## Quick Reference

### Essential Commands

```bash
# Docker setup
docker-compose up --build          # Build and start all services
docker-compose down                # Stop all services
docker-compose logs -f app         # View app logs
docker-compose restart app         # Restart app only

# Local development
npm run dev                        # Start dev server
npm run build-css                  # Build CSS (watch mode)
npm run build-js:watch             # Build JS (watch mode)
npm run db:sync                    # Sync database schema
npm run db:seed-airports           # Seed airport data

# Database
npm run db:migrate                 # Run migrations
npm run db:migrate:undo            # Rollback last migration
npm run cache:clear                # Clear Redis cache

# Testing
npm test                           # Run all tests
npm run test:coverage              # Coverage report
npm run lint                       # Check code quality
```

### Default Ports

- **Application:** 3500 (Docker) or 3000 (local)
- **PostgreSQL:** 5432
- **Redis:** 6379

### Default Credentials

- **Database User:** postgres
- **Database Password:** postgres (CHANGE IN PRODUCTION!)

---

## Configuration Changes (2025-11-21)

All previously identified configuration issues have been resolved:

✅ `.env.example` now includes all required variables (APP_PORT, REDIS_PORT)
✅ Unified Dockerfile supports both development and production environments
✅ docker-compose.yml correctly references single Dockerfile with build args
✅ DB_HOST properly configured in docker-compose.yml
✅ README.md updated with correct database commands

For historical context, see `CONFIG_AUDIT_REPORT.md`.

---

## Need Help?

- Review [CLAUDE.md](CLAUDE.md) for comprehensive development guide
- Check [docs/](docs/) folder for architecture and deployment docs
- Open an issue on GitHub for bugs or questions

---

**Last Updated:** 2025-11-21
**Status:** All configuration issues resolved - clone-ready ✅
