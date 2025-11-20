# Deployment Guide

## Overview

This guide covers environment management, deployment procedures, and safe migration strategies for the Bluebonnet Travel Planner application.

## Table of Contents

1. [Environment Management Strategy](#environment-management-strategy)
2. [Current Setup](#current-setup)
3. [Recommended Setup](#recommended-setup)
4. [Deployment Procedures](#deployment-procedures)
5. [Database Migration Strategy](#database-migration-strategy)
6. [Rollback Procedures](#rollback-procedures)
7. [Merging Feature Branch to Main](#merging-feature-branch-to-main)

---

## Environment Management Strategy

### Philosophy

- **Single Codebase, Multiple Environments**: Use the same code across all environments
- **Configuration via Environment Variables**: All environment-specific settings in `.env` files
- **Docker Compose Overrides**: Use override files for environment-specific Docker configuration
- **Separate Data Volumes**: Each environment has isolated database and Redis data

### Environment Hierarchy

```
Production (/bluebonnet)
├── Branch: main
├── Port: 3500 (app)
├── Port: 5432 (postgres)
├── Port: 6379 (redis)
└── Data: prod_postgres_data, prod_redis_data

Development (/bluebonnet-dev)
├── Branch: feature/development branches
├── Port: 3501 (app)
├── Port: 5433 (postgres)
├── Port: 6380 (redis)
└── Data: dev_postgres_data, dev_redis_data
```

---

## Current Setup

### Existing Directory Structure

```
Server
├── /bluebonnet (production)
│   ├── .git → synced with main branch
│   ├── .env
│   └── docker-compose.yml
│
└── /bluebonnet-dev (development)
    ├── .git → synced with claude/fix-airport-duplicates-01Je25vhsvgSRmqGTHbT4coC
    ├── .env
    └── docker-compose.yml
```

### Current Issues

1. **Duplicate Configuration**: Maintaining two separate `docker-compose.yml` files manually
2. **Configuration Drift**: Easy to have differences between environments accidentally
3. **No Rollback Strategy**: No documented procedure for reverting deployments
4. **Database Migration Risk**: Using `sync({ alter: true })` instead of proper migrations

---

## Recommended Setup

### File Structure

```
/bluebonnet (production)
├── .env.production              # Production environment variables
├── docker-compose.yml           # Base configuration (shared)
├── docker-compose.production.yml # Production overrides
└── scripts/
    ├── deploy.sh               # Deployment script
    ├── rollback.sh            # Rollback script
    └── db-backup.sh           # Database backup script

/bluebonnet-dev (development)
├── .env.development            # Development environment variables
├── docker-compose.yml          # Base configuration (shared, from git)
├── docker-compose.override.yml # Development overrides (gitignored)
└── scripts/
    ├── deploy.sh              # Same as production
    ├── rollback.sh           # Same as production
    └── db-backup.sh          # Same as production
```

### Base docker-compose.yml

This file should be **committed to git** and shared across all environments:

```yaml
# docker-compose.yml (base - shared across all environments)
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${DB_USER}']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 3s
      retries: 5

  app:
    build:
      context: .
      dockerfile: ${DOCKERFILE:-Dockerfile}
    environment:
      NODE_ENV: ${NODE_ENV}
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: ${DB_NAME}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      REDIS_ENABLED: 'true'
      REDIS_HOST: redis
      REDIS_PORT: 6379
      SESSION_SECRET: ${SESSION_SECRET}
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Production Override (docker-compose.production.yml)

```yaml
# docker-compose.production.yml
services:
  postgres:
    container_name: prod_travel_planner_db
    ports:
      - '127.0.0.1:5432:5432' # Only expose to localhost

  redis:
    container_name: prod_travel_planner_redis
    ports:
      - '127.0.0.1:6379:6379' # Only expose to localhost

  app:
    build:
      dockerfile: Dockerfile.production
    container_name: prod_travel_planner_app
    ports:
      - '3500:3000'
    # No volume mounts in production (use image)

volumes:
  postgres_data:
    name: prod_postgres_data
  redis_data:
    name: prod_redis_data
```

### Development Override (docker-compose.override.yml)

**NOTE: This file should be in `.gitignore`**

```yaml
# docker-compose.override.yml (development - gitignored)
services:
  postgres:
    container_name: dev_travel_planner_db
    ports:
      - '5433:5432'

  redis:
    container_name: dev_travel_planner_redis
    ports:
      - '6380:6379'

  app:
    container_name: dev_travel_planner_app
    ports:
      - '3501:3001'
    volumes:
      - ./:/app
      - node_modules:/app/node_modules
    command: sh -c "npm run build-js && npm run dev"

volumes:
  postgres_data:
    name: dev_postgres_data
  redis_data:
    name: dev_redis_data
  node_modules:
```

### Environment Files

**Production (.env.production):**

```bash
NODE_ENV=production
PORT=3000
SESSION_SECRET=<strong-random-secret-here>

# Database
DB_NAME=prod_travel_planner
DB_USER=postgres
DB_PASSWORD=<strong-password-here>

# Redis
REDIS_ENABLED=true

# Logging
LOG_LEVEL=warn

# Dockerfile
DOCKERFILE=Dockerfile.production
```

**Development (.env.development):**

```bash
NODE_ENV=development
PORT=3001
SESSION_SECRET=dev-secret-not-for-production

# Database
DB_NAME=dev_travel_planner
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_ENABLED=true

# Logging
LOG_LEVEL=debug

# Dockerfile
DOCKERFILE=Dockerfile
```

---

## Deployment Procedures

### Production Deployment Process

#### 1. Pre-Deployment Checklist

```bash
# In /bluebonnet directory

# 1. Backup database
./scripts/db-backup.sh

# 2. Check current branch
git branch --show-current  # Should be 'main'

# 3. Verify environment
cat .env | grep NODE_ENV  # Should be 'production'

# 4. Check running containers
docker compose -f docker-compose.yml -f docker-compose.production.yml ps
```

#### 2. Pull Latest Code

```bash
# Pull latest from main branch
git pull origin main

# Verify the commit
git log -1
```

#### 3. Run Migrations (if any)

```bash
# Check migration status
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec app npm run db:migrate:status

# Run pending migrations (ALWAYS test in dev first!)
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec app npm run db:migrate
```

#### 4. Build and Deploy

```bash
# Stop current containers
docker compose -f docker-compose.yml -f docker-compose.production.yml down

# Build new images
docker compose -f docker-compose.yml -f docker-compose.production.yml build --no-cache

# Start containers
docker compose -f docker-compose.yml -f docker-compose.production.yml up -d

# Check health
curl http://localhost:3500/health
```

#### 5. Post-Deployment Verification

```bash
# Check logs for errors
docker compose -f docker-compose.yml -f docker-compose.production.yml logs app --tail=100

# Verify services
docker compose -f docker-compose.yml -f docker-compose.production.yml ps

# Test critical endpoints
curl http://localhost:3500/health
curl -I http://localhost:3500/auth/login
```

### Development Deployment Process

```bash
# In /bluebonnet-dev directory

# Pull latest changes from feature branch
git pull origin <branch-name>

# Rebuild and restart
docker compose down
docker compose build
docker compose up -d

# Check health
curl http://localhost:3501/health
```

---

## Database Migration Strategy

### ⚠️ Critical: Remove sync({ alter: true })

**Current Risk**: The codebase uses `sequelize.sync({ alter: true })` which is **DANGEROUS in production** because:

- Can cause data loss
- No rollback capability
- No migration history
- Can lock tables during execution

### Migration Workflow

#### Creating a New Migration

```bash
# Generate migration file
npx sequelize-cli migration:generate --name describe-your-change

# Example:
npx sequelize-cli migration:generate --name add-user-avatar-field
```

#### Migration Template

```javascript
// migrations/YYYYMMDDHHMMSS-add-user-avatar-field.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'avatarUrl', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'avatarUrl');
  },
};
```

#### Testing Migrations

**ALWAYS test migrations in development first:**

```bash
# In development environment
cd /bluebonnet-dev

# Run migration
docker compose exec app npm run db:migrate

# Test the application

# If issues, rollback
docker compose exec app npm run db:migrate:undo

# Fix migration and try again
```

#### Production Migration Deployment

```bash
# In production environment
cd /bluebonnet

# 1. BACKUP DATABASE FIRST
./scripts/db-backup.sh

# 2. Check migration status
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec app npm run db:migrate:status

# 3. Run migrations
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec app npm run db:migrate

# 4. Verify
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec app psql -U postgres -d prod_travel_planner -c "\dt"
```

### Database Backup Script

Create `/bluebonnet/scripts/db-backup.sh`:

```bash
#!/bin/bash
# Database backup script

set -e

BACKUP_DIR="/backups/bluebonnet"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/prod_travel_planner_$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup database
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec -T postgres pg_dump -U postgres prod_travel_planner > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Keep only last 30 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup created: ${BACKUP_FILE}.gz"
```

---

## Rollback Procedures

### Application Rollback

```bash
# In /bluebonnet directory

# 1. Note current commit
CURRENT_COMMIT=$(git rev-parse HEAD)
echo "Current commit: $CURRENT_COMMIT" > /tmp/rollback_from.txt

# 2. Checkout previous version
git log --oneline -10  # Find the commit to rollback to
git checkout <previous-commit-hash>

# 3. Rebuild and restart
docker compose -f docker-compose.yml -f docker-compose.production.yml down
docker compose -f docker-compose.yml -f docker-compose.production.yml build
docker compose -f docker-compose.yml -f docker-compose.production.yml up -d

# 4. Verify
curl http://localhost:3500/health
```

### Database Rollback

#### Option 1: Undo Last Migration

```bash
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec app npm run db:migrate:undo
```

#### Option 2: Restore from Backup

```bash
# List available backups
ls -lh /backups/bluebonnet/

# Restore specific backup
BACKUP_FILE="/backups/bluebonnet/prod_travel_planner_20251119_120000.sql.gz"

# Stop application
docker compose -f docker-compose.yml -f docker-compose.production.yml stop app

# Restore database
gunzip -c $BACKUP_FILE | \
  docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec -T postgres psql -U postgres prod_travel_planner

# Restart application
docker compose -f docker-compose.yml -f docker-compose.production.yml start app
```

---

## Merging Feature Branch to Main

### Pre-Merge Checklist

- [ ] All tests passing in development
- [ ] Feature branch is up-to-date with main
- [ ] Database migrations tested in development
- [ ] Breaking changes documented
- [ ] Rollback plan prepared
- [ ] Production database backed up

### Step-by-Step Merge Process

#### Phase 1: Prepare Feature Branch

```bash
# In /bluebonnet-dev

# 1. Ensure all changes are committed
git status

# 2. Update from remote
git fetch origin

# 3. Rebase on main (if needed)
git checkout main
git pull origin main
git checkout claude/fix-airport-duplicates-01Je25vhsvgSRmqGTHbT4coC
git rebase main

# 4. Resolve any conflicts and test

# 5. Push to remote
git push -u origin claude/fix-airport-duplicates-01Je25vhsvgSRmqGTHbT4coC
```

#### Phase 2: Test Critical Changes

```bash
# In /bluebonnet-dev

# Test database migrations from scratch
docker compose down -v  # WARNING: Deletes all data
docker compose up -d
docker compose exec app npm run db:migrate
docker compose exec app npm run db:seed-airports

# Test application
# - Login/logout
# - Create trip
# - Add flight with airport search
# - Add companions
# - Verify Redis caching works
# - Check /health endpoint
```

#### Phase 3: Create Pull Request (if using GitHub workflow)

```bash
# Option A: Via GitHub CLI
gh pr create --base main --head claude/fix-airport-duplicates-01Je25vhsvgSRmqGTHbT4coC \
  --title "Phase 6-8: Performance, DevOps, and Documentation" \
  --body "See docs/ARCHITECTURE.md for details"

# Option B: Merge locally (skip to Phase 4)
```

#### Phase 4: Merge to Main

```bash
# In /bluebonnet (production directory)

# 1. Ensure on main branch
git checkout main

# 2. Merge feature branch
git merge claude/fix-airport-duplicates-01Je25vhsvgSRmqGTHbT4coC

# 3. Review merge result
git log -5
git diff HEAD~1

# 4. DO NOT PUSH YET - Test locally first
```

#### Phase 5: Pre-Production Testing

```bash
# In /bluebonnet

# 1. Backup production database
./scripts/db-backup.sh

# 2. Stop production containers (maintenance window)
docker compose -f docker-compose.yml -f docker-compose.production.yml down

# 3. Create test environment from production data
# (Optional but recommended)

# 4. Build new version
docker compose -f docker-compose.yml -f docker-compose.production.yml build

# 5. Start in foreground to watch logs
docker compose -f docker-compose.yml -f docker-compose.production.yml up

# Watch for:
# - Database connection successful
# - Redis connection successful
# - Migrations applied (if any)
# - No JavaScript errors
# - Health check passing

# 6. If everything looks good, Ctrl+C and restart in background
docker compose -f docker-compose.yml -f docker-compose.production.yml down
docker compose -f docker-compose.yml -f docker-compose.production.yml up -d
```

#### Phase 6: Deploy to Production

```bash
# In /bluebonnet

# 1. Push to main branch
git push origin main

# 2. Verify health
curl http://localhost:3500/health

# 3. Test critical functionality
# - Login
# - Create trip
# - Airport search
# - Add flight

# 4. Monitor logs
docker compose -f docker-compose.yml -f docker-compose.production.yml logs -f app

# 5. If issues, rollback immediately (see Rollback Procedures)
```

#### Phase 7: Cleanup

```bash
# Delete feature branch (optional)
git branch -d claude/fix-airport-duplicates-01Je25vhsvgSRmqGTHbT4coC
git push origin --delete claude/fix-airport-duplicates-01Je25vhsvgSRmqGTHbT4coC

# Verify dev environment still works
cd /bluebonnet-dev
git checkout main
git pull origin main
```

---

## Specific Migration Guide: Current Feature Branch → Main

### Changes in Feature Branch

The `claude/fix-airport-duplicates-01Je25vhsvgSRmqGTHbT4coC` branch includes:

1. **Redis Integration**
   - New dependencies: `redis`, `connect-redis`
   - New service: Redis container
   - Redis caching for airports and sessions

2. **Database Changes**
   - Existing migrations in `/migrations` directory
   - New seed script: `db:seed-airports`
   - Airport table changes

3. **Docker Changes**
   - Named volume for node_modules
   - Redis service in docker-compose.yml
   - Health checks

4. **New Scripts**
   - `scripts/sync-database.js`
   - `scripts/seed-airports.js`

5. **Code Changes**
   - Health check endpoint `/health`
   - Redis client configuration
   - Cache service implementation

### Migration Plan for Production

```bash
# STEP 1: Backup everything (in /bluebonnet)
./scripts/db-backup.sh
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec postgres pg_dump -U postgres prod_travel_planner > /backups/pre-redis-migration.sql

# STEP 2: Prepare new docker-compose files
# Create docker-compose.production.yml as described above

# STEP 3: Update .env.production
# Add Redis configuration

# STEP 4: Merge code
git checkout main
git merge claude/fix-airport-duplicates-01Je25vhsvgSRmqGTHbT4coC

# STEP 5: Install dependencies
docker compose -f docker-compose.yml -f docker-compose.production.yml build --no-cache

# STEP 6: Start services (Redis will be new)
docker compose -f docker-compose.yml -f docker-compose.production.yml up -d

# STEP 7: Run migrations
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec app npm run db:migrate:status

docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec app npm run db:migrate

# STEP 8: Seed airports (if table is empty)
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec app npm run db:seed-airports

# STEP 9: Verify
curl http://localhost:3500/health | jq .
# Should show: "redis": "connected", "database": "connected"

# STEP 10: Test airport search
# Login and try adding a flight with airport search

# STEP 11: Monitor for issues
docker compose -f docker-compose.yml -f docker-compose.production.yml logs -f --tail=100
```

---

## Quick Reference Commands

### Production

```bash
# Deploy
cd /bluebonnet && git pull origin main && \
  docker compose -f docker-compose.yml -f docker-compose.production.yml up -d --build

# Logs
docker compose -f docker-compose.yml -f docker-compose.production.yml logs -f app

# Health
curl http://localhost:3500/health

# Database console
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec postgres psql -U postgres prod_travel_planner

# Redis console
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec redis redis-cli
```

### Development

```bash
# Deploy
cd /bluebonnet-dev && git pull && docker compose up -d --build

# Logs
docker compose logs -f app

# Health
curl http://localhost:3501/health

# Database console
docker compose exec postgres psql -U postgres dev_travel_planner

# Redis console
docker compose exec redis redis-cli
```

---

## Monitoring and Maintenance

### Daily Checks

```bash
# Check health endpoint
curl http://localhost:3500/health | jq .

# Check disk usage
df -h
docker system df

# Check logs for errors
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  logs app --since 24h | grep -i error
```

### Weekly Maintenance

```bash
# Backup database
./scripts/db-backup.sh

# Clean old Docker images
docker image prune -a -f --filter "until=168h"

# Check Redis memory usage
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec redis redis-cli INFO memory
```

### Monthly Maintenance

```bash
# Review and optimize database
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec postgres psql -U postgres prod_travel_planner -c "VACUUM ANALYZE;"

# Review backup retention
ls -lh /backups/bluebonnet/

# Update dependencies (test in dev first!)
npm outdated
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
docker compose -f docker-compose.yml -f docker-compose.production.yml logs app

# Common issues:
# 1. Database connection failed → Check DB_HOST, DB_PASSWORD in .env
# 2. Redis connection failed → Ensure Redis container is running
# 3. Port conflict → Check if port 3500 is already in use
```

### Database Migration Failed

```bash
# Check migration status
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec app npm run db:migrate:status

# Rollback last migration
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec app npm run db:migrate:undo

# Restore from backup if needed (see Rollback Procedures)
```

### Redis Issues

```bash
# Check Redis is running
docker compose -f docker-compose.yml -f docker-compose.production.yml ps redis

# Check Redis connectivity
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec redis redis-cli ping

# Clear Redis cache if needed
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec redis redis-cli FLUSHALL
```

---

## Security Checklist

- [ ] Strong `SESSION_SECRET` in production `.env`
- [ ] Strong database password
- [ ] Redis not exposed to public internet (bind to 127.0.0.1)
- [ ] Postgres not exposed to public internet (bind to 127.0.0.1)
- [ ] Application behind reverse proxy (nginx/caddy)
- [ ] SSL/TLS certificates configured
- [ ] Regular security updates (`npm audit`, `docker pull`)
- [ ] Database backups encrypted and stored securely
- [ ] `.env` files in `.gitignore`
- [ ] Non-root user in Docker containers (production Dockerfile)

---

## Next Steps

1. **Implement New Structure**: Refactor docker-compose files as described
2. **Test in Development**: Verify new structure works in /bluebonnet-dev
3. **Create Backup Scripts**: Implement automated database backups
4. **Merge Feature Branch**: Follow the merge procedure above
5. **Set Up Monitoring**: Implement health check monitoring
6. **Document Custom Changes**: Add any server-specific configuration to this guide
