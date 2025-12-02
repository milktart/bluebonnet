# Production Deployment Checklist

## Pre-Deployment
- [ ] All code changes have been tested in development
- [ ] Database backups have been created
- [ ] Maintenance window has been scheduled (if needed)
- [ ] Team has been notified of upcoming deployment

## Deployment Steps

### 1. Code Deployment
- [ ] Pull latest code: `git pull origin main`
- [ ] Verify git status is clean: `git status`
- [ ] Install any new dependencies: `npm install`
- [ ] Build assets: `npm run build-css-prod`

### 2. Database Migrations
- [ ] Stop application (optional but recommended)
- [ ] Run migrations: `npm run db:migrate`
  - [ ] Verify migration 1 (tripId nullable) succeeded
  - [ ] Verify migration 2 (userId columns) succeeded
- [ ] Check logs for migration errors

### 3. Verification
- [ ] Verify hotels table has userId column: `SELECT COUNT(*) FROM hotels;`
- [ ] Verify car_rentals table has userId column: `SELECT COUNT(*) FROM car_rentals;`
- [ ] Check sample data: `SELECT id, "tripId", "userId" FROM hotels LIMIT 1;`

### 4. Application Restart
- [ ] Start application: `npm start`
- [ ] Check application logs for startup errors
- [ ] Verify API health endpoint: `GET /api/v1/health`

### 5. Testing
- [ ] Test creating a standalone hotel
- [ ] Test creating a trip-associated hotel
- [ ] Test editing hotel timezone
- [ ] Test that times display correctly in sidebar
- [ ] Test existing trip functionality still works

## Quick Reference: Running Migrations

### Using npm scripts (if configured)
```bash
npm run db:migrate
```

### Using Sequelize CLI directly
```bash
npx sequelize db:migrate
```

### Check migration status
```bash
npx sequelize db:migrate:status
```

### Rollback last migration (if needed)
```bash
npx sequelize db:migrate:undo
```

### Rollback all migrations (if needed - USE WITH CAUTION)
```bash
npx sequelize db:migrate:undo:all
```

## Monitoring After Deployment

- [ ] Monitor application logs for errors
- [ ] Check database slow query logs
- [ ] Monitor server CPU and memory usage
- [ ] Verify timezone functionality is working correctly
- [ ] Check that standalone items are being created properly

## Rollback Plan (If Needed)

If something goes wrong:

1. Stop the application
2. Rollback migrations: `npm run db:migrate:undo:all`
3. Revert code to previous version: `git revert HEAD`
4. Restart application
5. Notify team and investigate the issue

## Files to Deploy

### Code Files
- All files in `/controllers`
- All files in `/models`
- All files in `/routes`
- All files in `/services`
- All files in `/views`
- All files in `/public/js`
- All files in `/public/css`
- Migration files in `/migrations`

### Configuration Files
- `.env` (update with production values)
- Any other configuration files

### Do NOT Deploy
- `node_modules/` (npm install will handle this)
- `.git/` (git pull handles this)
- Temporary files or logs

## Database Changes Summary

| Change | Table | Type | Impact |
|--------|-------|------|--------|
| tripId nullable | hotels | ALTER | Allows standalone hotels |
| tripId nullable | car_rentals | ALTER | Allows standalone car rentals |
| userId column | hotels | ADD | Tracks standalone item ownership |
| userId column | car_rentals | ADD | Tracks standalone item ownership |

## Migration Files to Run

1. `20251201-make-tripId-nullable.js` - Make tripId nullable
2. `20251201-add-userid-to-hotels-and-carrentals.js` - Add userId columns

These are the ONLY new migrations needed from this session. All other migrations should already be applied.
