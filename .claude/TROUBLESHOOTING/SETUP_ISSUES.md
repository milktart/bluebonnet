# 🔧 Setup Issues Troubleshooting

Solutions for common setup and initialization problems.

---

## Docker Compose Issues

### Problem: Container won't start
```
Error: Connection refused
```

**Causes & Solutions:**

1. **Port already in use**
   ```bash
   # Check what's using port 3500
   lsof -i :3500

   # Kill the process
   kill -9 <PID>

   # Or change port in docker-compose.yml
   ```

2. **Database not initialized**
   ```bash
   # Force reinitialize
   docker-compose down -v
   docker-compose up --build
   ```

3. **PostgreSQL not ready**
   - Wait 10-15 seconds for DB to start
   - Check logs: `docker-compose logs db`

### Problem: Database sync fails
```
Error: relation "flights" does not exist
```

**Solution:**
```bash
# Manually run sync
docker-compose exec app npm run db:sync

# Seed airports
docker-compose exec app npm run db:seed-airports
```

---

## Local Development Setup

### Problem: npm install fails
```
npm ERR! peer dep missing
```

**Solution:**
```bash
# Clean cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Problem: Database connection refused
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Check PostgreSQL status:**
```bash
# macOS
brew services list
brew services start postgresql

# Linux
sudo systemctl status postgresql
sudo systemctl start postgresql

# Or use Docker just for DB
docker run -d --name bluebonnet-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=bluebonnet \
  -p 5432:5432 \
  postgres:13
```

### Problem: Redis connection failed
```
Error: Connection to redis failed
```

**Solution:**
```bash
# Install Redis (macOS)
brew install redis
brew services start redis

# Or Docker
docker run -d --name bluebonnet-redis \
  -p 6379:6379 \
  redis:alpine
```

---

## Development Server Issues

### Problem: `npm run dev` fails
```
Error: Cannot find module
```

**Solution:**
```bash
# Reinstall dependencies
npm install

# Clear build cache
rm -rf public/dist node_modules/.cache

# Try again
npm run dev
```

### Problem: Port 3000 already in use
```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Or change port in .env
echo "PORT=3001" >> .env
```

### Problem: CSS not updating
```bash
# Rebuild CSS
npm run build-css

# Or watch mode
npm run build-css
```

---

## Database Issues

### Problem: Tables not created
```bash
# Check database status
npm run db:sync

# Check for errors
npm run db:seed-airports
```

### Problem: Airport data not seeded
```bash
# Verify airports.json exists
ls data/airports.json

# Manually seed
npm run db:seed-airports

# Check database
sqlite3 bluebonnet.db "SELECT COUNT(*) FROM airports;"
```

### Problem: Migrations failed
```bash
# Clear database and restart
rm bluebonnet.db
npm run db:sync
npm run db:seed-airports
```

---

## Authentication Issues

### Problem: Session not persisting
```
Error: Cannot read property 'userId' of undefined
```

**Check:**
1. `SESSION_SECRET` env variable is set
2. Redis is running (if using Redis sessions)
3. Cookie settings in `config/express.js`

**Solution:**
```bash
# Regenerate session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update .env
echo "SESSION_SECRET=<generated-value>" >> .env

# Restart server
npm run dev
```

---

## Form & API Issues

### Problem: Forms not submitting
1. Check browser console (F12) for errors
2. Verify API endpoint exists
3. Check X-Async-Request header is sent
4. Verify authentication middleware

### Problem: AJAX requests returning 403
```
Error: Forbidden
```

**Cause:** User not authenticated or doesn't own resource

**Solution:**
1. Login again
2. Check session is valid
3. Verify resource ownership in database

### Problem: File upload failing
```
Error: Unexpected field
```

**Verify:**
- Form has `enctype="multipart/form-data"`
- Backend has multer configured
- File size isn't exceeding limit

---

## Performance Issues

### Problem: Slow startup
```bash
# Profile startup time
time npm run dev

# Check for slow modules
npm audit
```

### Problem: Slow database queries
```bash
# Enable query logging
echo "LOG_LEVEL=debug" >> .env

# Check database indexes
npm run db:check-indexes
```

---

## Git & Version Control

### Problem: Git conflicts
```bash
# View differences
git diff

# Accept incoming changes
git checkout --theirs .

# Or manually resolve in editor
```

### Problem: Branch tracking issues
```bash
# Check remote branches
git branch -r

# Set up tracking
git branch --set-upstream-to=origin/main main
```

---

## Environment Variables

### Problem: .env not loading
**Verify .env exists in project root:**
```bash
ls -la .env

# If missing, create from template
cp .env.example .env
```

### Required Variables for Development
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bluebonnet
DB_USER=postgres
DB_PASSWORD=password
SESSION_SECRET=<random-value>
NODE_ENV=development
```

---

## Docker Specific

### Problem: Files not syncing
```bash
# Verify volumes in docker-compose.yml
docker-compose config | grep volumes

# Rebuild without cache
docker-compose up --build --no-cache
```

### Problem: Can't access app from browser
```bash
# Check if container is running
docker-compose ps

# Check logs
docker-compose logs app

# Try accessing via container IP
docker inspect bluebonnet-app | grep IP
```

---

## Debugging Tips

### Enable Verbose Logging
```env
LOG_LEVEL=debug
DEBUG=*
```

### Check System Health
```bash
# Memory usage
free -h

# Disk space
df -h

# Running processes
ps aux | grep node

# Network connections
netstat -an | grep 3000
```

### Browser DevTools
1. Open F12 in browser
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Check Application tab for cookies/storage

---

## When All Else Fails

### Complete Reset
```bash
# Stop services
docker-compose down -v

# Remove all data
rm -rf node_modules public/dist

# Reinstall
npm install

# Start fresh
docker-compose up --build
```

### Ask for Help
Include in issue:
1. Output of `npm -v` and `node -v`
2. Full error message
3. Steps to reproduce
4. `.env` file (without secrets)
5. `docker-compose.yml` (without secrets)

---

## Related Documentation

- **[Getting Started](../GETTING_STARTED.md)** - Initial setup
- **[Development](../DEVELOPMENT.md)** - Daily workflow
- **[Architecture](../ARCHITECTURE/README.md)** - System design

---

**Last Updated:** 2025-12-17
