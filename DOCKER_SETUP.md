# Docker Setup for Bluebonnet Full Stack

This guide explains how to run the complete Bluebonnet application (backend + frontend) using Docker Compose.

## Architecture

```
┌─────────────────────────────────────────────┐
│         Docker Compose Network              │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐  ┌────────────────────┐  │
│  │  Svelte      │  │  Express Backend   │  │
│  │  Frontend    │──│  API Server        │  │
│  │  :5173       │  │  :3000             │  │
│  └──────────────┘  └────────────────────┘  │
│                            │                │
│        ┌───────────────────┼──────────────┐ │
│        │                   │              │ │
│  ┌──────────────┐  ┌────────────────┐    │ │
│  │  PostgreSQL  │  │  Redis Cache   │    │ │
│  │  :5432       │  │  :6379         │    │ │
│  └──────────────┘  └────────────────┘    │ │
│                                             │
└─────────────────────────────────────────────┘
```

## Services

### 1. PostgreSQL Database
- **Image**: postgres:15-alpine
- **Port**: 5432
- **Volume**: `postgres_data` (persistent storage)
- **Health Check**: pg_isready

### 2. Redis Cache
- **Image**: redis:7-alpine
- **Port**: 6379
- **Volume**: `redis_data` (persistent storage)
- **Health Check**: redis-cli ping

### 3. Express Backend API
- **Build Context**: /home/home/bluebonnet-dev
- **Port**: 3000 (or custom via APP_PORT)
- **Dependencies**: postgres, redis (must be healthy)
- **Volumes**: Hot reload enabled for development

### 4. Svelte Frontend
- **Build Context**: /home/home/bluebonnet-svelte
- **Dockerfile**: Dockerfile.dev
- **Port**: 5173 (or custom via FRONTEND_PORT)
- **Dependencies**: backend (must be running)
- **Features**: HMR (Hot Module Replacement) for development

## Prerequisites

- Docker Desktop (or Docker + Docker Compose)
- For Mac/Windows: 4GB+ RAM allocated to Docker
- For Linux: Docker and Docker Compose installed

## Quick Start

### 1. Start All Services

From `/home/home/bluebonnet-dev`:

```bash
docker-compose up --build
```

This will:
1. ✅ Build backend and frontend images
2. ✅ Start PostgreSQL database
3. ✅ Start Redis cache
4. ✅ Start Express backend API
5. ✅ Start Svelte frontend
6. ✅ Create bridge network connecting all services
7. ✅ Apply database migrations automatically

### 2. Access the Application

**Frontend**: http://localhost:5173
**Backend API**: http://localhost:3000
**Database**: localhost:5432 (from host machine)
**Redis**: localhost:6379 (from host machine)

### 3. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f app
docker-compose logs -f postgres
```

### 4. Stop Services

```bash
# Stop all services (keep containers)
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove everything (including volumes)
docker-compose down -v
```

## Environment Configuration

### Available Environment Variables

Create or modify `.env` in `/home/home/bluebonnet-dev`:

```bash
# Node environment
NODE_ENV=development

# Backend settings
PORT=3000
APP_PORT=3000
LOG_LEVEL=debug

# Database settings
DB_PORT=5432
DB_NAME=bluebonnet
DB_USER=postgres
DB_PASSWORD=postgres

# Redis settings
REDIS_PORT=6379
REDIS_ENABLED=true

# Frontend settings
FRONTEND_PORT=5173
```

### Frontend Environment

The frontend automatically receives:
- `VITE_API_BASE=http://app:3000` (inside Docker network)
- `NODE_ENV=development`

For custom variables, add them to `docker-compose.yml` under `frontend.environment`.

## Development Workflow

### Hot Reloading

Both services support hot reloading:

**Backend**:
- Edit files in `/home/home/bluebonnet-dev/src`
- Changes auto-reload via nodemon

**Frontend**:
- Edit files in `/home/home/bluebonnet-svelte/src`
- Changes auto-reload via Vite HMR

### Making Code Changes

```bash
# While containers are running:

# 1. Edit backend code
nano /home/home/bluebonnet-dev/src/routes/trips.ts

# 2. Restart backend container (optional - nodemon handles it)
docker-compose restart app

# 3. Edit frontend code
nano /home/home/bluebonnet-svelte/src/routes/+page.svelte

# 4. Frontend reloads automatically (Vite HMR)
```

### Adding Dependencies

```bash
# Backend
docker-compose exec app npm install express-validator

# Frontend
docker-compose exec frontend npm install some-package
```

### Running Commands

```bash
# Backend commands
docker-compose exec app npm run db:sync
docker-compose exec app npm run db:seed-airports

# Frontend commands
docker-compose exec frontend npm run build
docker-compose exec frontend npm run test
```

## Production Build

### Build Frontend for Production

```bash
docker-compose exec frontend npm run build
```

Output goes to `build/` directory.

### Production Dockerfile

For production, use the multi-stage `Dockerfile` (not `Dockerfile.dev`):

```bash
# Update docker-compose.yml
# Change: dockerfile: Dockerfile.dev
# To: dockerfile: Dockerfile

# Rebuild
docker-compose up --build
```

## Troubleshooting

### Port Already in Use

```bash
# Check what's using port 5173
lsof -i :5173

# Change port in docker-compose.yml
ports:
  - "5174:5173"  # Use 5174 instead

# Or via environment
docker-compose up --build -e FRONTEND_PORT=5174
```

### Database Connection Errors

```bash
# Check PostgreSQL is running
docker-compose logs postgres

# Verify connection
docker-compose exec postgres psql -U postgres -d development_bluebonnet -c "SELECT 1"

# Reset database
docker-compose down -v
docker-compose up --build
```

### Frontend Cannot Connect to Backend

```bash
# Inside frontend container
docker-compose exec frontend curl http://app:3000

# Check VITE_API_BASE is set correctly
docker-compose exec frontend env | grep VITE

# Check network connectivity
docker-compose exec frontend ping app
```

### Out of Disk Space

```bash
# Clean up unused images and volumes
docker image prune
docker volume prune

# Or aggressive cleanup
docker system prune -a
```

## Network Communication

### Container-to-Container Communication

Inside Docker network, use container names as hostnames:

```javascript
// Inside frontend container
const API_BASE = 'http://app:3000';  // ✅ Correct
const API_BASE = 'http://localhost:3000';  // ❌ Wrong (localhost is the container itself)
const API_BASE = 'http://127.0.0.1:3000';  // ❌ Wrong (refers to container, not app service)
```

### Host-to-Container Communication

From your host machine, use localhost:

```bash
# Access frontend
curl http://localhost:5173

# Access backend
curl http://localhost:3000

# Access database
psql -h localhost -U postgres
```

## Useful Commands

```bash
# View container status
docker-compose ps

# View service details
docker-compose config

# Execute command in service
docker-compose exec app npm run db:sync

# View resource usage
docker stats

# Inspect container networking
docker network inspect bluebonnet_dev_network

# View container logs with timestamps
docker-compose logs --timestamps frontend

# Follow logs for specific service
docker-compose logs -f app --tail 100

# Remove stopped containers
docker-compose rm

# Validate docker-compose.yml
docker-compose config --quiet

# Build specific service only
docker-compose build frontend

# Push to registry (if configured)
docker-compose push
```

## Performance Optimization

### Memory Limits

Add to `docker-compose.yml` services:

```yaml
frontend:
  deploy:
    resources:
      limits:
        memory: 512M
  # ...
```

### Volume Optimization

Use bind mounts for development (faster on Mac/Windows):

```yaml
volumes:
  - ../bluebonnet-svelte/src:/app/src
```

### Build Optimization

Use .dockerignore to exclude unnecessary files:

```bash
# Check /home/home/bluebonnet-svelte/.dockerignore
node_modules
.git
build
dist
```

## Continuous Integration

### Local CI Simulation

```bash
# Clean build
docker-compose down -v
docker-compose up --build

# Run tests
docker-compose exec app npm test
docker-compose exec frontend npm test

# Build frontend
docker-compose exec frontend npm run build
```

## SSH Into Containers

```bash
# Backend
docker-compose exec app sh

# Frontend
docker-compose exec frontend sh

# Database
docker-compose exec postgres psql -U postgres
```

## Backup and Restore

### Backup Database

```bash
docker-compose exec postgres pg_dump -U postgres development_bluebonnet > backup.sql
```

### Restore Database

```bash
docker-compose exec -T postgres psql -U postgres development_bluebonnet < backup.sql
```

## Security Notes

### Development vs Production

**Development**:
- Volumes mounted for hot reload
- Debug logging enabled
- Credentials in .env (local only)

**Production**:
- No mounted volumes
- Minimal logging
- Use environment secrets
- HTTPS enabled
- CORS configured

### Environment Variables

Never commit `.env` to git:

```bash
# .gitignore
.env
.env.local
.env.*.local
```

Use `.env.example` template instead.

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [PostgreSQL Docker](https://hub.docker.com/_/postgres)
- [Node.js Docker](https://hub.docker.com/_/node)

---

## Summary

**Start Application**: `docker-compose up --build`
**Access Frontend**: http://localhost:5173
**Access Backend**: http://localhost:3000
**Stop Services**: `Ctrl+C` or `docker-compose down`

All services are now running in isolated containers with proper networking, health checks, and volume mounts for development.
