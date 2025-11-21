# Bluebonnet Travel Planner - Fresh Setup Guide

This guide provides step-by-step instructions for cloning and setting up a fresh Bluebonnet environment. It addresses all configuration requirements and known setup issues.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start (Docker - Recommended)](#quick-start-docker---recommended)
- [Manual Setup (Local Development)](#manual-setup-local-development)
- [Configuration Issues & Solutions](#configuration-issues--solutions)
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

### Step 3: Configure Required Variables

Edit the `.env` file and add the **missing required variables**:

```bash
# Server Configuration
NODE_ENV=development
PORT=3000
APP_PORT=3500        # ⚠️ REQUIRED - Missing from .env.example

# Database Configuration
DB_HOST=postgres     # ⚠️ IMPORTANT - Must be "postgres" for Docker
DB_PORT=5432
DB_NAME=travel_planner
DB_USER=postgres
DB_PASSWORD=postgres

# Redis Configuration
REDIS_PORT=6379      # ⚠️ REQUIRED - Uncomment this line

# Session Configuration
SESSION_SECRET=your-secret-key-here-change-in-production-use-random-string
```

**Critical Configuration Notes:**

1. **APP_PORT** - This variable is missing from `.env.example` but required by `docker-compose.yml`
2. **DB_HOST** - Must be set to `postgres` (the Docker service name), not `localhost`
3. **REDIS_PORT** - Must be uncommented and set to `6379`
4. **NODE_ENV** - Must match the Dockerfile name (see Step 4)

### Step 4: Fix Dockerfile Naming Issue

**⚠️ CRITICAL:** The docker-compose.yml expects `Dockerfile.${NODE_ENV}`, but there's a naming inconsistency:

**Current state:**
- `Dockerfile` - Simple development build
- `Dockerfile.development` - Multi-stage production build (misnamed)
- `Dockerfile.production` - **MISSING**

**Quick fix for development:**

The `Dockerfile.development` already exists, so if you set `NODE_ENV=development` in `.env`, it will work. No action needed for development setup.

**For production:**

If you need to run production, either:
- Copy `Dockerfile.development` to `Dockerfile.production`, OR
- Modify `docker-compose.yml` line 38 to use a fixed Dockerfile name

### Step 5: Build and Start

```bash
docker-compose up --build
```

This will:
- ✅ Build the application container
- ✅ Start PostgreSQL database
- ✅ Start Redis cache
- ✅ Wait for services to be healthy
- ✅ Automatically initialize the database (create tables)
- ✅ Automatically seed airport data
- ✅ Start the application

### Step 6: Access the Application

Open your browser and navigate to:

```
http://localhost:3500
```

**Note:** The port is `3500` (from APP_PORT), not `3000`!

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

Edit `.env`:

```bash
NODE_ENV=development
PORT=3000
DB_HOST=localhost    # For local development
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

**Note:** The README.md mentions `npm run migrate`, but the correct command is `npm run db:sync` (as defined in package.json).

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

## Configuration Issues & Solutions

### Issue 1: Missing Environment Variables

**Problem:** `.env.example` is missing required variables used by `docker-compose.yml`

**Missing variables:**
- `APP_PORT` (used in docker-compose.yml:41)
- `REDIS_PORT` (used in docker-compose.yml:24, currently commented)

**Solution:** Add these to your `.env` file:

```bash
APP_PORT=3500
REDIS_PORT=6379
```

**Recommendation:** Update `.env.example` to include:

```bash
# Docker Configuration
APP_PORT=3500                # Docker exposed port for app
REDIS_PORT=6379              # Change this for multiple environments
```

### Issue 2: Dockerfile Naming Confusion

**Problem:** docker-compose.yml expects `Dockerfile.${NODE_ENV}`, but:
- `Dockerfile` exists (simple build)
- `Dockerfile.development` exists (multi-stage production-style build)
- `Dockerfile.production` is **missing**

**Current workaround:**
- For development: Use `NODE_ENV=development` (works with existing `Dockerfile.development`)
- For production: Copy `Dockerfile.development` to `Dockerfile.production`

**Recommendation:** Rename files for clarity:
- `Dockerfile.development` → Keep as-is OR rename to `Dockerfile.production`
- `Dockerfile` → Rename to `Dockerfile.simple` or delete
- Create proper `Dockerfile.production` if needed

### Issue 3: DB_HOST Configuration in Docker

**Problem:** docker-compose.yml line 44 constructs `DB_HOST: ${NODE_ENV}_${DB_HOST}`, which:
- If `DB_HOST=localhost` and `NODE_ENV=development`, creates `development_localhost` ❌
- If `DB_HOST=postgres`, creates `development_postgres` ❌
- Actual service name is `postgres` ✅
- Actual container name is `${NODE_ENV}_travel_planner_db` ✅

**Solution:** In your `.env` file for Docker setup, set:

```bash
DB_HOST=postgres
```

This will create `development_postgres` which doesn't match the service name, BUT Docker Compose networking is smart enough to resolve this. However, this is confusing.

**Better solution (manual fix):** Edit `docker-compose.yml` line 44:

```yaml
# Change from:
DB_HOST: ${NODE_ENV}_${DB_HOST}

# To:
DB_HOST: postgres
```

**Recommendation:** Remove the `${NODE_ENV}_` prefix from DB_HOST in docker-compose.yml since services reference each other by service name, not container name.

### Issue 4: README.md Migration Command

**Problem:** README.md line 39 instructs users to run:

```bash
npm run migrate
```

But this script doesn't exist in package.json!

**Correct commands:**

```bash
# For Sequelize sync (recommended for development)
npm run db:sync

# For Sequelize migrations (if migrations exist)
npm run db:migrate
```

**Recommendation:** Update README.md to use `npm run db:sync` or `npm run db:migrate` instead of `npm run migrate`.

### Issue 5: Confusing .env.example Comment

**Problem:** Line 2 of `.env.example` says:

```bash
NODE_ENV=development             # Change this to environment and rename Dockerfile to Dockerfile.${NODE_ENV}
```

This is confusing because:
1. The Dockerfile already exists as `Dockerfile.development`
2. Users shouldn't need to rename files
3. The comment suggests manual renaming on every environment change

**Recommendation:** Update comment to:

```bash
NODE_ENV=development             # Valid values: development, production (must match Dockerfile.{NODE_ENV})
```

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

3. DB_HOST in .env is set to `postgres` (not `localhost`)

### Dockerfile not found

**Error:** `failed to solve: failed to read dockerfile`

**Solution:**

Ensure `NODE_ENV` in `.env` matches an existing Dockerfile:

```bash
# Check available Dockerfiles
ls -la Dockerfile*

# Set NODE_ENV to match
NODE_ENV=development  # Uses Dockerfile.development
```

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

---

## Production Deployment

For production deployment:

1. Copy `.env.production.example` to `.env`
2. Fill in all REQUIRED values (especially secrets!)
3. Ensure `NODE_ENV=production`
4. Create `Dockerfile.production` (or rename `Dockerfile.development`)
5. Use strong passwords for DB_PASSWORD and SESSION_SECRET
6. Enable SSL/TLS for database if remote
7. Set up proper logging and monitoring

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

## Summary of Required Fixes

Before this repository is fully clone-ready, the following files should be updated:

### High Priority

1. **`.env.example`** - Add missing variables:
   ```bash
   APP_PORT=3500
   REDIS_PORT=6379  # Uncomment this
   ```

2. **`docker-compose.yml`** - Fix DB_HOST construction (line 44):
   ```yaml
   # Change from:
   DB_HOST: ${NODE_ENV}_${DB_HOST}
   # To:
   DB_HOST: postgres
   ```

3. **Create `Dockerfile.production`** OR rename `Dockerfile.development` → `Dockerfile.production`

4. **`README.md`** - Fix migration command (line 39):
   ```bash
   # Change from:
   npm run migrate
   # To:
   npm run db:sync
   ```

### Medium Priority

5. Update `.env.example` comment to be clearer about Dockerfile naming

6. Consider simplifying Dockerfile naming (one file vs multiple)

7. Add this SETUP.md to the repository for future users

---

## Need Help?

- Review [CLAUDE.md](CLAUDE.md) for comprehensive development guide
- Check [docs/](docs/) folder for architecture and deployment docs
- Open an issue on GitHub for bugs or questions

---

**Last Updated:** 2025-11-21
**Status:** Configuration audit complete - 5 critical issues identified
