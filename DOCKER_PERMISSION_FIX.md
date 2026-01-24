# Docker Permission Fix - Complete Resolution

## Problem Statement

When rebuilding or restarting the app in the local environment:

- `/frontend/node_modules/` was owned by `1001:1001` (uid 1001, gid 1001)
- `/app/node_modules/` was owned by `nodejs:nodejs` (uid 1001, gid 1001)
- All other directories were correctly owned by `home:home`
- Inside container: directories were owned by `node` user, except node_modules

**Root Cause:** The Dockerfile created a custom `nodejs:1001:1001` user for file operations, while the Node.js Alpine image provides a built-in `node:1000:1000` user. This mismatch caused permission conflicts.

---

## Solution Overview

Replaced the custom `nodejs:1001:1001` user with the built-in `node:1000:1000` user throughout the entire build process.

### Changes Made

#### 1. **Dockerfile** (All 8 stages)

**Before:**

```dockerfile
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
COPY --chown=nodejs:nodejs package*.json ./
USER nodejs
```

**After:**

```dockerfile
RUN chown -R node:node /app
COPY --chown=node:node package*.json ./
USER node
```

**Changes applied to all stages:**

- Base stage: Uses built-in `node` user instead of creating `nodejs:1001`
- development-deps stage: `USER node` instead of `USER nodejs`
- production-deps stage: `USER node` instead of `USER nodejs`
- builder stage: `USER node` instead of `USER nodejs`
- development stage: Removed custom user creation, uses `node` user
- test stage: Removed custom user creation, uses `node` user
- production stage: Removed custom user creation, uses `node` user
- prod stage: Removed custom user creation, uses `node` user

#### 2. **docker-compose.yml**

**Added to both services:**

```yaml
user: 'node'
```

This ensures containers run as the `node` user, maintaining consistency between host and container.

#### 3. **frontend/Dockerfile.dev**

**Before:**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
```

**After:**

```dockerfile
FROM node:20-alpine
WORKDIR /app
RUN chown -R node:node /app
COPY --chown=node:node package*.json ./
USER node
RUN npm install
COPY --chown=node:node . .
```

#### 4. **scripts/docker-entrypoint.sh**

**Removed all permission-fixing logic:**

- ❌ Removed ownership checks for `/app/node_modules`
- ❌ Removed `chown -R nodejs:nodejs` operations
- ❌ Removed root permission fixes
- ❌ Removed Vite cache permission handling

The script now runs cleanly without any permission operations, relying on the correct user being set throughout the build process.

---

## User ID Mapping

### Built-in Node User (Used Now)

- **Container:** `node` user, UID 1000, GID 1000
- **Host:** `home` user, UID 1000, GID 1000 (typical)
- **Match:** Perfect alignment ✅

### Old Custom User (No Longer Used)

- **Container:** `nodejs` user, UID 1001, GID 1001
- **Host:** Unmapped (creates 1001:1001 on mount)
- **Issue:** Mismatch causes permission problems ❌

---

## File Ownership After Fix

### In Container

```
/app                          → node:node (1000:1000)
/app/node_modules             → node:node (1000:1000)
/app/frontend/node_modules    → node:node (1000:1000)
/app/logs                      → node:node (1000:1000)
All source files              → node:node (1000:1000)
All build artifacts           → node:node (1000:1000)
```

### On Host (After Volume Mount)

```
./                            → home:home (1000:1000)
./node_modules                → home:home (1000:1000)
./frontend/node_modules       → home:home (1000:1000)
All files                     → home:home (1000:1000)
```

---

## Testing the Fix

### Clean Rebuild

```bash
# Remove old volumes and containers
docker compose down --volumes

# Clean local node_modules that might have wrong permissions
rm -rf node_modules frontend/node_modules

# Rebuild from scratch
docker compose up --build
```

### Verify Permissions

**Inside container:**

```bash
docker exec <container_id> ls -la / | grep app
docker exec <container_id> ls -la /app/node_modules | head -5
docker exec <container_id> ls -la /app/frontend/node_modules | head -5
```

All should show `node` ownership.

**On host:**

```bash
ls -la node_modules | head -5
ls -la frontend/node_modules | head -5
```

All should show `home:home` ownership.

---

## Benefits

1. **Consistent User Throughout** - Single `node:node` user everywhere
2. **No Permission Conflicts** - Host and container UIDs match perfectly
3. **Cleaner Code** - Removed 50+ lines of permission-fixing workarounds
4. **Faster Builds** - No permission checking/fixing overhead
5. **Reliable Volume Mounts** - Files created in container are accessible on host
6. **Better Docker Practices** - Uses built-in user instead of custom one

---

## Files Modified

- `Dockerfile` - All 8 stages simplified for user consistency
- `docker-compose.yml` - Added `user: "node"` to app and frontend services
- `frontend/Dockerfile.dev` - Added proper user setup and ownership
- `scripts/docker-entrypoint.sh` - Removed all permission operations

---

## Rollback Plan

If issues occur, revert to the commit before this fix:

```bash
git revert <commit-hash>
docker compose down --volumes
docker compose up --build
```

However, this fix addresses the core issue and should resolve all permission problems.

---

## Future Considerations

- Monitor for any edge cases with volume mounts
- Consider using docker-compose user mapping if host UID differs from 1000
- Document the assumption that host `home` user is UID 1000

**Commit Hash:** 4d15fd0
**Date Fixed:** 2026-01-08
