# 🚀 Deployment & Operations

Complete guide for deploying and operating Bluebonnet in all environments.

---

## Quick Links

### Development & Setup
- **[Local Development](./LOCAL_DEVELOPMENT.md)** - Setting up locally
- **[Docker Setup](./DOCKER_SETUP.md)** - Docker development & production
- **[Environment Config](./ENVIRONMENT_CONFIG.md)** - Environment variables

### Production
- **[Production Deployment](./PRODUCTION_DEPLOYMENT.md)** - Pre-deploy checklist
- **[CI/CD](./CI_CD.md)** - GitHub Actions, automation
- **[Monitoring](./MONITORING.md)** - Error tracking, logging

### Troubleshooting
- **[Deployment Issues](../TROUBLESHOOTING/DEPLOYMENT_ISSUES.md)** - Production problems

---

## Deployment Environments

### Development (Local)
**Purpose:** Local development
**Database:** PostgreSQL locally
**Cache:** Redis locally
**Command:** `npm run dev`

### Staging (Docker)
**Purpose:** Test before production
**Database:** PostgreSQL in container
**Cache:** Redis in container
**Command:** `docker-compose up`

### Production
**Purpose:** Live users
**Database:** PostgreSQL (managed service or container)
**Cache:** Redis (managed service or container)
**Command:** Deployed to hosting provider

---

## Quick Start

### Local Development
```bash
# 1. Clone repo
git clone ...
cd bluebonnet-dev

# 2. Install dependencies
npm install

# 3. Setup .env
cp .env.example .env
# Edit .env with local PostgreSQL credentials

# 4. Initialize database
npm run db:sync
npm run db:seed-airports

# 5. Start development
npm run dev
# Server runs on http://localhost:3000
```

See: [Local Development](./LOCAL_DEVELOPMENT.md)

### Docker Development
```bash
# 1. Clone repo
git clone ...
cd bluebonnet-dev

# 2. Start with Docker
docker-compose up --build

# 3. Wait for database initialization
# Server runs on http://localhost:3500

# 4. Done! No manual setup needed
```

See: [Docker Setup](./DOCKER_SETUP.md)

### Production Deployment
```bash
# 1. Prepare release
# - Run tests: npm test
# - Build CSS: npm run build-css-prod
# - Build JS: npm run build

# 2. Deploy to hosting
# - Push to main/master branch
# - CI/CD pipeline runs tests
# - Auto-deploy on success

# 3. Verify production
# - Check error logs
# - Test critical paths
# - Monitor performance
```

See: [Production Deployment](./PRODUCTION_DEPLOYMENT.md)

---

## Environment Variables

### Required
```env
# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bluebonnet
DB_USER=postgres
DB_PASSWORD=password

# Express
SESSION_SECRET=random-secret-key-here
NODE_ENV=development
PORT=3000
```

### Optional
```env
# Redis
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379

# APIs
NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org
GEOCODING_TIMEOUT=10000

# Monitoring
LOG_LEVEL=info
```

See: [Environment Config](./ENVIRONMENT_CONFIG.md)

---

## Docker Compose

### What's Included
```yaml
services:
  app:           # Express.js backend
  postgres:      # PostgreSQL database
  redis:         # Redis cache
```

### Key Commands
```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f app

# Rebuild after code changes
docker-compose up --build

# Run migrations
docker-compose exec app npm run db:migrate
```

See: [Docker Setup](./DOCKER_SETUP.md)

---

## Database Initialization

### First Run (Automatic with Docker)
```bash
docker-compose up
# Script automatically:
# 1. Waits for PostgreSQL ready
# 2. Runs db:sync (creates tables)
# 3. Seeds airports
# 4. Starts app
```

### Manual (Local Development)
```bash
npm run db:sync              # Create/update tables
npm run db:seed-airports     # Seed airports data
```

### Migrations
```bash
npm run db:migrate           # Run pending migrations
npm run db:migrate:undo      # Undo last migration
npm run db:migrate:status    # Show migration status
```

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (`npm test`)
- [ ] No lint errors (`npm run lint`)
- [ ] Code formatted (`npm run format:check`)
- [ ] TypeScript errors (if using TS)

### Functionality
- [ ] Critical features tested manually
- [ ] No broken links
- [ ] Forms submit correctly
- [ ] Maps display properly
- [ ] Performance acceptable

### Build & Deploy
- [ ] CSS built (`npm run build-css-prod`)
- [ ] JavaScript bundled (`npm run build`)
- [ ] Environment variables set
- [ ] Database migrations current
- [ ] Backups taken

See: [Production Deployment](./PRODUCTION_DEPLOYMENT.md)

---

## CI/CD Pipeline

### GitHub Actions
```yaml
# Runs on every push and PR
1. Install dependencies
2. Run linting
3. Run tests
4. Build CSS and JS
5. Report coverage
6. Deploy (if main branch)
```

### Deployment
```
main branch → tests pass → build → deploy to production
```

See: [CI/CD](./CI_CD.md)

---

## Monitoring & Logs

### Error Tracking
```
Errors logged to:
- File logs (rotating daily)
- Error tracking service (future)
- Application logs
```

### Performance Monitoring
```
Track:
- Request response times
- Database query times
- API endpoint performance
- Redis cache hits
```

### Log Levels
```
error  - Application errors
warn   - Warnings
info   - Info messages (default)
debug  - Detailed debug info
```

See: [Monitoring](./MONITORING.md)

---

## Phase 1 Deployment Changes

### Current (Express Only)
```
Deploy Express backend
Server runs on port 3000
```

### Phase 1 (Express + SvelteKit)
```
Deploy Express backend (port 3000)
Deploy SvelteKit frontend (port 5173, proxied to 3000 for API)
OR
- Frontend serves statically from Express (more common)
```

---

## Troubleshooting Deployments

### Issue: Database connection fails
**Check:**
- PostgreSQL running
- Connection string correct
- Firewall allows connections
- Port correct

See: [Deployment Issues](../TROUBLESHOOTING/DEPLOYMENT_ISSUES.md)

### Issue: Application won't start
**Check:**
- Node.js version correct
- Dependencies installed (`npm install`)
- Environment variables set
- Database migrations current

### Issue: Feature not working in production
**Check:**
- Database migrations applied
- Environment variables correct
- Logs for errors
- Test locally first

---

## Deployment Strategy

### Staging First
```
1. Deploy to staging
2. Test thoroughly
3. Get approval
4. Deploy to production
```

### Gradual Rollout (Optional)
```
1. Deploy to 10% of servers
2. Monitor for errors
3. If OK, deploy to 25%
4. If OK, deploy to 100%
```

### Rollback Plan
```
1. Keep previous version ready
2. Can rollback in seconds
3. Restore database backup if needed
4. Post-mortem on what went wrong
```

---

## Related Documentation

- **[Local Development](./LOCAL_DEVELOPMENT.md)** - Local setup
- **[Docker Setup](./DOCKER_SETUP.md)** - Docker guide
- **[Environment Config](./ENVIRONMENT_CONFIG.md)** - Env variables
- **[Production Deployment](./PRODUCTION_DEPLOYMENT.md)** - Production checklist
- **[CI/CD](./CI_CD.md)** - Automation
- **[Monitoring](./MONITORING.md)** - Monitoring setup
- **[Deployment Issues](../TROUBLESHOOTING/DEPLOYMENT_ISSUES.md)** - Troubleshooting

---

**Last Updated:** 2025-12-17
