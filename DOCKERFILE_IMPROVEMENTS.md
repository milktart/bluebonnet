# Dockerfile Improvements - Eliminating Environment-Specific Differences

## Problem

The Dockerfile had inconsistent user contexts across environments:

- **Development & Test stages**: Built and ran as `root` user
- **Production stages**: Built as `root`, but ran as `nodejs` user

This caused files created during Docker builds to be owned by root, leading to permission issues when volume-mounted back to the local filesystem.

### Symptoms

```
rm: cannot remove '.../frontend/build/...': Permission denied
rm: cannot remove '.../frontend/.svelte-kit/...': Permission denied
```

## Root Cause

The multi-stage Dockerfile had three stages that created build artifacts:

1. **development** stage (lines 78-118):
   - `RUN npm run build-js` → Creates `public/dist/chunks/` files as root
   - `RUN npm run build` → Creates `frontend/build/` as root
   - No `USER` directive = defaults to root

2. **test** stage (lines 123-149):
   - `RUN npm run build-js` → Creates files as root
   - No `USER` directive

3. **production** stage:
   - Built files as root, then changed ownership with `chown` at the end
   - Then switched to `nodejs` user for runtime

When Docker containers run with volume mounts (`.:/app`), root-owned files remain root-owned on the host.

## Solution

Implement **consistent non-root user context across all stages** using the `nodejs` user (UID 1001):

### Key Changes

1. **Base Stage** (new):
   - Created `nodejs` user (1001:1001) once in base image
   - All downstream stages inherit this user
   - Owns `/app` directory from the start

2. **dependency-\*-deps stages** (updated):
   - Added `USER nodejs` before `npm install/ci`
   - Dependencies now owned by nodejs user

3. **builder stage** (updated):
   - Added `USER nodejs` before builds
   - Uses `COPY --chown=nodejs:nodejs` for all copies
   - Build artifacts created directly by nodejs user

4. **development stage** (refactored):
   - Creates nodejs user (matching base)
   - All build commands run as `USER nodejs`
   - Entrypoint runs as nodejs (same as production)
   - Reduces friction between dev and production environments

5. **test stage** (refactored):
   - Same pattern as development
   - `USER nodejs` for all builds
   - Consistent with dev/production

6. **production & prod stages** (simplified):
   - Removed `chown` workaround (no longer needed)
   - Files are already owned correctly by nodejs user
   - Simplified entrypoint: direct `node server.js` instead of `su` + subprocess

## Benefits

### 1. **Environment Consistency**

- Local dev → Docker dev → Docker test → Docker production all behave identically
- No "works in Docker but not locally" issues

### 2. **Security Improvement**

- Development environment no longer runs as root
- Matches production principle of running as non-root user
- Reduces attack surface in all environments

### 3. **File Ownership Predictability**

- All files created in any environment are owned by `nodejs:nodejs` (1001:1001)
- Volume mounts don't create permission mismatches
- Can safely edit files mounted from Docker

### 4. **Simpler Dockerfile**

- No `chown` workarounds after builds
- No `su` subprocess complexity in entrypoints
- Clearer intent: "nodejs user does all work"

### 5. **Reduced Environment Variables**

- Same user ID (1001) across all stages
- Same user name (`nodejs`) everywhere
- No special handling per environment

## Implementation Details

### User Context Flow

```
Stage: base
  ├─ Create nodejs user (1001:1001)
  ├─ COPY --chown=nodejs:nodejs package*.json
  └─ (establishes baseline)

Stage: development-deps
  ├─ USER nodejs
  └─ RUN npm install

Stage: development
  ├─ Copy deps from development-deps (--chown=nodejs:nodejs)
  ├─ Copy source (--chown=nodejs:nodejs)
  ├─ USER nodejs
  ├─ RUN npm run build-js
  ├─ RUN npm run build (frontend)
  └─ Files automatically owned by nodejs

Stage: test
  ├─ (identical to development)
  └─ Consistent behavior

Stage: production
  ├─ (identical build process)
  ├─ No chown needed
  └─ Already correct ownership
```

### File Ownership Guarantees

All files created during these stages are owned by `nodejs:nodejs`:

- `public/dist/` (JavaScript bundles)
- `frontend/build/` (SvelteKit output)
- `frontend/.svelte-kit/` (SvelteKit cache)
- `logs/` (runtime logs directory)

## Migration Notes

### Old Root-Owned Files

Previous Docker builds created these directories as root:

- `/frontend/build/` (root:root)
- `/public/dist/chunks/` (root:root)

These can safely be deleted when no longer needed:

```bash
docker compose down
rm -rf frontend/build  # Once all containers stopped
rm -rf public/dist/chunks
docker compose up --build  # Recreates with proper ownership
```

If permission denied, use Docker to remove them:

```bash
docker compose run --rm app rm -rf frontend/build
docker compose run --rm app npm run clean-js
```

## Testing the Fix

```bash
# Build with new Dockerfile
docker compose up --build

# Check file ownership in running container
docker compose exec app ls -la /app/public/dist/chunks/
docker compose exec app ls -la /app/frontend/build/

# Check on host filesystem (with volume mount)
ls -la ./frontend/build/    # Should show nodejs ownership
ls -la ./public/dist/       # Should show nodejs ownership
```

## Downstream Impact

### No breaking changes

- Application code unchanged
- Environment variables unchanged
- API contract unchanged
- Database schema unchanged

### Benefits for developers

- Can edit mounted files from Docker
- No permission errors on volume operations
- Same experience across all environments
- Production behavior visible in development

## Related Files

- `Dockerfile` - Multi-stage configuration
- `docker-compose.yml` - Service orchestration
- `.dockerignore` - Build context optimization

## Version

Updated: 2026-01-06
Previous: Root-owned files in dev/test stages
Current: Consistent nodejs user across all environments
