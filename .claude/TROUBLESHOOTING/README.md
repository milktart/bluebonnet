# 🔧 Troubleshooting Guide

Quick solutions for common problems in Bluebonnet development and operations.

---

## Quick Links

### Development Issues
- **[Debug Guide](./DEBUG_GUIDE.md)** - Debugging methodology
- **[Setup Issues](./SETUP_ISSUES.md)** - Local setup problems
- **[Database Issues](./DATABASE_ISSUES.md)** - Database connection, migrations
- **[Form Issues](./FORM_ISSUES.md)** - Form submission problems

### Runtime Issues
- **[Async Operations](./ASYNC_OPERATIONS.md)** - AJAX & async operation issues
- **[Performance Issues](./PERFORMANCE_ISSUES.md)** - Slow queries, bundle size

### Operations
- **[Deployment Issues](./DEPLOYMENT_ISSUES.md)** - Production problems

---

## Common Problems Quick Reference

| Problem | Likely Cause | First Step |
|---------|------------|-----------|
| App won't start | Dependencies missing | `npm install` |
| Database error | PostgreSQL not running | Check `docker ps` |
| Form not working | JavaScript error | Check browser console |
| Slow performance | Unoptimized query | Check Network tab |
| Build fails | TypeScript error | Run `npm run lint` |
| API error | Wrong headers | Check request headers |
| Component not rendering | Svelte syntax error | Check console for errors |

---

## Debugging Checklist

When something breaks:

### 1. Identify the Problem
- [ ] Where does it fail? (frontend, backend, database?)
- [ ] When started happening? (after what change?)
- [ ] What's the error message? (exact text)
- [ ] Can you reproduce it reliably?

### 2. Check Basics
- [ ] Is the server running? (`npm run dev`)
- [ ] Is the database running? (`docker ps`)
- [ ] Is Redis running? (if needed)
- [ ] Are dependencies installed? (`npm install`)

### 3. Check Logs
- [ ] Browser console (DevTools → Console)
- [ ] Terminal output (where server is running)
- [ ] Network tab (for API requests)
- [ ] Application logs (if in production)

### 4. Debug Deeper
- [ ] Add console.log statements
- [ ] Use browser debugger (F12)
- [ ] Check database directly
- [ ] Review recent code changes

### 5. Search for Solutions
- [ ] Check [TROUBLESHOOTING/](.) for similar issue
- [ ] Search GitHub issues
- [ ] Check framework docs (Svelte, Express, etc.)
- [ ] Ask team/community

---

## Problem Categories

### Setup Problems
**Symptoms:** App won't start, database connection fails
**Solutions:** [Setup Issues](./SETUP_ISSUES.md)

### Database Problems
**Symptoms:** Migration fails, table doesn't exist
**Solutions:** [Database Issues](./DATABASE_ISSUES.md)

### Form Problems
**Symptoms:** Form won't submit, validation errors
**Solutions:** [Form Issues](./FORM_ISSUES.md)

### Async Problems
**Symptoms:** API call doesn't work, sidebar doesn't update
**Solutions:** [Async Operations](./ASYNC_OPERATIONS.md)

### Performance Problems
**Symptoms:** Page loads slow, queries take forever
**Solutions:** [Performance Issues](./PERFORMANCE_ISSUES.md)

### Deployment Problems
**Symptoms:** Works locally but fails in production
**Solutions:** [Deployment Issues](./DEPLOYMENT_ISSUES.md)

---

## Debugging Tools

### Browser DevTools (F12)
- **Console tab** - JavaScript errors, logging
- **Network tab** - API requests, response times
- **Storage tab** - Cookies, localStorage
- **Application tab** - Service workers, cache
- **Debugger tab** - Step through code

### Terminal
```bash
# View Express logs
npm run dev

# View all running containers
docker ps

# View container logs
docker logs -f container-name

# Check database
psql -U postgres -d bluebonnet
```

### VS Code
- Debug breakpoints (F5)
- Hover to inspect variables
- Integrated terminal
- Git history

### Git
```bash
# See what changed
git diff

# See recent commits
git log --oneline

# Revert to working state
git checkout .
```

---

## Rubber Duck Debugging

Sometimes explaining your problem helps you solve it:

1. **Get a "rubber duck"** (or just say out loud)
2. **Explain your problem** step-by-step
3. **Usually you'll realize the issue** (70% success rate!)

Example:
```
Me: "I'm adding a flight, but it doesn't save."
Rubber duck: ...
Me: "Oh wait, I notice the form has a tripId field..."
Me: "But I'm not setting tripId anywhere..."
Me: "That's the bug!"
```

---

## Common Solutions

### "Module not found"
```
Solution: npm install
Reason: Missing dependencies
```

### "Cannot connect to database"
```
Solution: docker ps, check PostgreSQL running
Reason: Database not started
```

### "TypeError: Cannot read property 'name' of undefined"
```
Solution: Check if data is null/undefined before accessing
Reason: Missing null check
```

### "EACCES: permission denied"
```
Solution: sudo, or fix file permissions
Reason: Permission issue
```

### "npm: command not found"
```
Solution: Install Node.js
Reason: Node not installed
```

---

## If You're Stuck

### Step 1: Take a Break
- Walk around
- Get coffee
- Come back fresh

### Step 2: Simplify
- Remove recent changes
- Isolate the problem
- Test one thing at a time

### Step 3: Ask for Help
- Check documentation
- Search for similar issues
- Ask team member
- Post on community forum

### Step 4: Document It
- Write down what you did
- Record what worked
- Add to this guide
- Help next person

---

## Preventing Problems

### Best Practices
- [ ] Run tests before committing (`npm test`)
- [ ] Check console for errors (daily)
- [ ] Review git diff before pushing
- [ ] Use linting (`npm run lint`)
- [ ] Comment confusing code
- [ ] Add tests for bugs you fix

### Development Habits
- [ ] Make small commits (easy to revert)
- [ ] Test as you code (not after)
- [ ] Read error messages carefully
- [ ] Google full error messages
- [ ] Use version control

---

## Emergency Procedures

### Database Corrupted
```bash
# 1. Backup (if possible)
pg_dump -U postgres bluebonnet > backup.sql

# 2. Reset
npm run db:sync
npm run db:seed-airports

# 3. Restore if needed
psql -U postgres bluebonnet < backup.sql
```

### App Won't Start
```bash
# 1. Check errors
npm run dev  # Look at errors

# 2. Clear cache
npm run cache:clear

# 3. Reinstall
rm node_modules package-lock.json
npm install

# 4. Reset database
npm run db:sync
```

### Code is Broken
```bash
# 1. See what changed
git diff

# 2. Revert last change
git checkout .

# 3. Or go back to last working state
git log --oneline
git checkout commit-hash
```

---

## Related Documentation

- **[Debug Guide](./DEBUG_GUIDE.md)** - Debugging methodology
- **[Setup Issues](./SETUP_ISSUES.md)** - Setup troubleshooting
- **[Database Issues](./DATABASE_ISSUES.md)** - Database problems
- **[Deployment Issues](./DEPLOYMENT_ISSUES.md)** - Production problems
- **[Architecture](../ARCHITECTURE/README.md)** - How system works
- **[Development](../DEVELOPMENT.md)** - Daily workflow

---

**Last Updated:** 2025-12-17
**Most Common Issue:** Database not running (Docker)
**Best Solution:** "Have you tried turning it off and on again?"
