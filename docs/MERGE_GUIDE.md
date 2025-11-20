# Feature Branch Merge Guide

## Quick Reference: Merging to Production

This is a step-by-step guide for safely merging the `claude/fix-airport-duplicates-01Je25vhsvgSRmqGTHbT4coC` branch to `main` and deploying to production.

---

## Prerequisites

- [ ] All tests passing in development
- [ ] Changes verified working in /bluebonnet-dev
- [ ] Production backup created
- [ ] Maintenance window scheduled (if needed)
- [ ] Rollback plan ready

---

## Phase 1: Prepare Development Environment (30 minutes)

### Step 1.1: Update docker-compose files in /bluebonnet-dev

```bash
cd /bluebonnet-dev

# Backup current docker-compose.yml
cp docker-compose.yml docker-compose.yml.backup

# The repository already has the new structure
# Just verify it's correct
cat docker-compose.yml
```

### Step 1.2: Test the new structure

```bash
# Stop everything
docker compose down

# Test starting with new structure
docker compose up -d

# Verify all services are running
docker compose ps

# Check health
curl http://localhost:3501/health

# Should show:
# {
#   "status": "ok",
#   "database": "connected",
#   "redis": "connected",
#   ...
# }
```

### Step 1.3: Test database migrations from scratch

```bash
# WARNING: This will delete all dev data
docker compose down -v

# Start fresh
docker compose up -d

# Wait for containers to be healthy
sleep 15

# Run migrations
docker compose exec app npm run db:migrate

# Seed airports
docker compose exec app npm run db:seed-airports

# Verify
docker compose exec app npm run db:migrate:status
```

### Step 1.4: Full functionality test

Test these critical features:

- [ ] Login/logout works
- [ ] Create new trip
- [ ] Airport search (both IATA code and city name)
- [ ] Add flight with airport selection
- [ ] Add companion
- [ ] View dashboard
- [ ] /health endpoint shows all green

---

## Phase 2: Prepare Production Environment (15 minutes)

### Step 2.1: Create new files in /bluebonnet

```bash
cd /bluebonnet

# Create production docker-compose override
# Copy from the repository or create manually
cat > docker-compose.production.yml << 'EOF'
# Production Docker Compose Override
# Usage: docker compose -f docker-compose.yml -f docker-compose.production.yml up -d

services:
  postgres:
    container_name: prod_travel_planner_db
    ports:
      - "127.0.0.1:5432:5432"
    environment:
      POSTGRES_DB: prod_travel_planner
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  redis:
    container_name: prod_travel_planner_redis
    ports:
      - "127.0.0.1:6379:6379"
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru

  app:
    build:
      context: .
      dockerfile: Dockerfile.production
    container_name: prod_travel_planner_app
    ports:
      - "3500:3000"
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: prod_travel_planner
      DB_USER: ${DB_USER:-postgres}
      DB_PASSWORD: ${DB_PASSWORD}
      REDIS_ENABLED: "true"
      REDIS_HOST: redis
      REDIS_PORT: 6379
      SESSION_SECRET: ${SESSION_SECRET}
      LOG_LEVEL: ${LOG_LEVEL:-warn}

volumes:
  postgres_data:
    name: prod_postgres_data
  redis_data:
    name: prod_redis_data
EOF

# Create production .env from current .env
cp .env .env.backup
```

### Step 2.2: Update production .env

```bash
# Edit .env to ensure these are set:
cat >> .env << 'EOF'

# Ensure these are set correctly for production
NODE_ENV=production
REDIS_ENABLED=true
LOG_LEVEL=warn
EOF

# IMPORTANT: Verify SESSION_SECRET is set to a strong value
grep SESSION_SECRET .env
```

### Step 2.3: Create backup script

```bash
# Create scripts directory
mkdir -p scripts

# Make backup script executable (will be added when we merge)
# For now, create a simple backup
cat > scripts/db-backup.sh << 'EOF'
#!/bin/bash
set -e
BACKUP_DIR=${BACKUP_DIR:-/backups/bluebonnet}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec -T postgres pg_dump -U postgres prod_travel_planner > "$BACKUP_DIR/prod_travel_planner_$TIMESTAMP.sql"
gzip "$BACKUP_DIR/prod_travel_planner_$TIMESTAMP.sql"
echo "Backup created: $BACKUP_DIR/prod_travel_planner_$TIMESTAMP.sql.gz"
EOF

chmod +x scripts/db-backup.sh
```

---

## Phase 3: Backup Production (10 minutes)

### Step 3.1: Create backups directory

```bash
# Create backup directory with appropriate permissions
sudo mkdir -p /backups/bluebonnet
sudo chown -R $USER:$USER /backups/bluebonnet
```

### Step 3.2: Backup production database

```bash
cd /bluebonnet

# Run backup script
./scripts/db-backup.sh

# Verify backup was created
ls -lh /backups/bluebonnet/

# Should see: prod_travel_planner_YYYYMMDD_HHMMSS.sql.gz
```

### Step 3.3: Export current container state (optional but recommended)

```bash
# Save current image as backup
docker commit prod_travel_planner_app prod_travel_planner_app:pre-redis-backup

# Verify
docker images | grep prod_travel_planner_app
```

---

## Phase 4: Merge to Main (5 minutes)

### Step 4.1: Merge in git

```bash
cd /bluebonnet

# Ensure on main branch
git checkout main
git pull origin main

# Merge feature branch
git merge claude/fix-airport-duplicates-01Je25vhsvgSRmqGTHbT4coC

# Review the merge
git log -5
git diff HEAD~1 --stat
```

### Step 4.2: Verify merge

```bash
# Check that critical files are present
ls -la docker-compose.production.yml
ls -la Dockerfile.production
ls -la docs/DEPLOYMENT.md
ls -la scripts/

# Check package.json has redis dependencies
grep redis package.json
```

---

## Phase 5: Deploy to Production (20 minutes)

### Step 5.1: Stop production (maintenance mode starts)

```bash
cd /bluebonnet

# Stop current containers
docker compose down

# This will cause downtime - maintenance mode begins
```

### Step 5.2: Build new production images

```bash
# Build with production dockerfile
docker compose -f docker-compose.yml -f docker-compose.production.yml build --no-cache

# This may take 5-10 minutes
```

### Step 5.3: Start new containers

```bash
# Start all services
docker compose -f docker-compose.yml -f docker-compose.production.yml up -d

# Watch logs to ensure proper startup
docker compose -f docker-compose.yml -f docker-compose.production.yml logs -f
```

Watch for these messages:

- ✅ "PostgreSQL Database directory appears to contain a database"
- ✅ "database system is ready to accept connections"
- ✅ "Redis version" (new!)
- ✅ "Ready to accept connections" (Redis - new!)
- ✅ "Redis Client connected successfully" (new!)
- ✅ "Server running on port 3000"

Press Ctrl+C when you see all services start successfully.

### Step 5.4: Run database migrations

```bash
# Check migration status
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec app npm run db:migrate:status

# Run migrations (if any pending)
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec app npm run db:migrate
```

### Step 5.5: Seed airports (if needed)

```bash
# Check if airports exist
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec postgres psql -U postgres prod_travel_planner -c "SELECT COUNT(*) FROM airports;"

# If count is 0, seed airports
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec app npm run db:seed-airports
```

---

## Phase 6: Verification (15 minutes)

### Step 6.1: Health check

```bash
# Check health endpoint
curl http://localhost:3500/health | jq .

# Should return:
# {
#   "status": "ok",
#   "database": "connected",
#   "redis": "connected",  ← NEW!
#   "timestamp": "...",
#   "uptime": 123,
#   "environment": "production",
#   "version": "..."
# }
```

### Step 6.2: Verify all containers

```bash
docker compose -f docker-compose.yml -f docker-compose.production.yml ps

# Should show:
# prod_travel_planner_app      running
# prod_travel_planner_db       running
# prod_travel_planner_redis    running  ← NEW!
```

### Step 6.3: Functional testing

Test these features in production:

1. **Login**
   - Navigate to http://your-domain.com/auth/login
   - Login with existing credentials
   - Verify login successful

2. **Dashboard**
   - Should load existing trips
   - No JavaScript errors in console (F12)

3. **Airport Search** (CRITICAL - this was the main fix)
   - Try to add a new flight
   - Search for "ORD" - should return Chicago O'Hare
   - Search for "Chicago" - should return multiple Chicago airports
   - Verify airport selection works

4. **Create Trip**
   - Create a new test trip
   - Verify it saves and appears in dashboard

5. **Redis Verification**

   ```bash
   # Check Redis is caching data
   docker compose -f docker-compose.yml -f docker-compose.production.yml \
     exec redis redis-cli KEYS "*"

   # Should see cache keys like:
   # - airports:*
   # - sess:*
   ```

### Step 6.4: Monitor logs

```bash
# Watch logs for errors
docker compose -f docker-compose.yml -f docker-compose.production.yml logs -f app

# Look for:
# - Any ERROR or WARN messages
# - Database connection messages
# - Redis connection messages
# - HTTP requests being logged
```

---

## Phase 7: Push to Remote (5 minutes)

### Step 7.1: Push main branch

```bash
cd /bluebonnet

# Only push if everything is working!
git push origin main
```

### Step 7.2: Update development

```bash
cd /bluebonnet-dev

# Pull latest main
git checkout main
git pull origin main

# Keep working on feature branches as needed
```

---

## Phase 8: Cleanup (5 minutes)

### Step 8.1: Remove old Docker images

```bash
# Remove old images to free space
docker image prune -a -f

# Optionally remove the pre-backup image after a few days
# docker rmi prod_travel_planner_app:pre-redis-backup
```

### Step 8.2: Delete feature branch (optional)

```bash
# Only after verifying production is stable for a few days
git branch -d claude/fix-airport-duplicates-01Je25vhsvgSRmqGTHbT4coC
git push origin --delete claude/fix-airport-duplicates-01Je25vhsvgSRmqGTHbT4coC
```

---

## Rollback Procedures

### If issues found during verification (Phase 6):

```bash
cd /bluebonnet

# Stop new containers
docker compose -f docker-compose.yml -f docker-compose.production.yml down

# Restore from backup
BACKUP_FILE="/backups/bluebonnet/prod_travel_planner_YYYYMMDD_HHMMSS.sql.gz"
gunzip -c "$BACKUP_FILE" | \
  docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec -T postgres psql -U postgres prod_travel_planner

# Rollback code
git checkout HEAD~1

# Restart with old version
docker compose up -d

# Verify
curl http://localhost:3500/health
```

### If issues found after deployment:

```bash
cd /bluebonnet

# Find the commit before merge
git log --oneline -10

# Checkout previous version
git checkout <previous-commit>

# Rebuild and restart
docker compose -f docker-compose.yml -f docker-compose.production.yml down
docker compose -f docker-compose.yml -f docker-compose.production.yml build
docker compose -f docker-compose.yml -f docker-compose.production.yml up -d

# Restore database if needed (see above)
```

---

## Troubleshooting

### Redis won't start

```bash
# Check Redis logs
docker compose -f docker-compose.yml -f docker-compose.production.yml logs redis

# Common issues:
# 1. Port 6379 already in use → check with: sudo lsof -i :6379
# 2. Volume permission issues → check with: docker volume inspect prod_redis_data
```

### App can't connect to Redis

```bash
# Verify Redis is running
docker compose -f docker-compose.yml -f docker-compose.production.yml exec redis redis-cli ping
# Should return: PONG

# Check app logs
docker compose -f docker-compose.yml -f docker-compose.production.yml logs app | grep -i redis

# Check environment variables
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec app env | grep REDIS
```

### Airport search returns no results

```bash
# Check if airports were seeded
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec postgres psql -U postgres prod_travel_planner -c "SELECT COUNT(*) FROM airports;"

# If 0, seed airports
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec app npm run db:seed-airports

# Clear Redis cache
docker compose -f docker-compose.yml -f docker-compose.production.yml \
  exec redis redis-cli FLUSHALL
```

---

## Post-Deployment Monitoring

### First 24 hours:

- Check logs every 2-4 hours
- Monitor disk space (Redis cache)
- Verify no user complaints
- Check health endpoint

### First week:

- Daily health checks
- Monitor Redis memory usage
- Review application logs for errors
- Verify database backup script runs

### Ongoing:

- Weekly database backups
- Monthly Redis cache review
- Quarterly dependency updates

---

## Summary

**Total Time:** ~1.5 - 2 hours (including testing)
**Downtime:** ~20-30 minutes (Phase 5 deployment)

**Key Success Indicators:**

- ✅ /health endpoint shows "ok" status
- ✅ All three containers running (app, postgres, redis)
- ✅ Airport search works for both IATA codes and city names
- ✅ Existing trips load correctly
- ✅ New trips can be created
- ✅ No errors in application logs
- ✅ Redis shows cached data

**Files Created/Modified:**

- docker-compose.production.yml (new)
- Dockerfile.production (new)
- scripts/db-backup.sh (new)
- scripts/deploy.sh (new)
- docs/DEPLOYMENT.md (new)
- .env (modified - Redis config added)
- docker-compose.yml (modified - if needed)

---

## Questions or Issues?

If you encounter any issues not covered in this guide:

1. Check `/bluebonnet/docs/DEPLOYMENT.md` for detailed procedures
2. Review logs: `docker compose -f docker-compose.yml -f docker-compose.production.yml logs`
3. Check container status: `docker compose -f docker-compose.yml -f docker-compose.production.yml ps`
4. Verify health: `curl http://localhost:3500/health`

**Emergency Rollback:** See "Rollback Procedures" section above.
