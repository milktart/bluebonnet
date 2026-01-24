# 💻 Development Workflow

Your day-to-day guide for developing Bluebonnet.

---

## Morning Standup

### 1. Pull Latest Changes

```bash
git pull origin main
npm install  # Install any new dependencies
```

### 2. Start Development Server

```bash
# Option A: Docker (recommended)
docker-compose up

# Option B: Local development
npm run dev
```

Server runs on:

- Docker: http://localhost:3500
- Local: http://localhost:3000

### 3. Open Browser DevTools

Press `F12` to open browser developer tools. Keep these open while developing:

- **Console tab** - JavaScript errors
- **Network tab** - API requests
- **Application tab** - Storage, cache

---

## Making a Change

### Find Your Issue

1. Pick an issue from GitHub/Trello
2. Read the feature guide (e.g., [Flight Management](./FEATURES/FLIGHT_MANAGEMENT.md))
3. Understand which files you need to change

### Make Your Changes

```bash
# Create a branch
git checkout -b feature/my-feature

# Make changes to files
# Edit controllers/, views/, routes/, etc.

# Watch for CSS changes
npm run build-css
```

### Test Your Changes

**Manual Testing:**

1. Refresh browser
2. Test the feature
3. Check console for errors
4. Check Network tab for API calls

**Automated Testing:**

```bash
# Run tests
npm test

# Run specific test
npm test -- tests/unit/services/tripService.test.js

# Run in watch mode (auto-reruns on changes)
npm run test:watch

# Check coverage
npm run test:coverage
```

### Code Quality

```bash
# Check code style
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### Commit Your Changes

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "Add field to flight form"

# Push to remote
git push origin feature/my-feature
```

### Create Pull Request

1. Go to GitHub
2. Create Pull Request from your branch to `main`
3. Describe your changes
4. Request review from team

### Address Review Comments

```bash
# Make requested changes
# Edit files...

# Commit again
git add .
git commit -m "Address review comments"
git push
```

### Merge to Main

Once approved:

1. Merge on GitHub
2. Delete branch (on GitHub)
3. Pull latest locally

```bash
git checkout main
git pull origin main
```

---

## Common Workflow Tasks

### Add a New Field to a Form

**Step 1:** Update database model

- Edit `models/Flight.js` (or relevant model)
- Add new field to model definition

**Step 2:** Create migration (if needed)

```bash
npx sequelize-cli migration:generate --name add-new-field-to-flights
# Edit migration file with your changes
npm run db:migrate
```

**Step 3:** Update controller

- Edit `controllers/flightController.js`
- Handle new field in create/update methods

**Step 4:** Update view/form

- Edit `views/partials/flight-form.ejs` (now → Svelte in Phase 1)
- Add new input field

**Step 5:** Test

```bash
npm test
npm run dev  # Test manually
```

### Create a New API Endpoint

**Step 1:** Add route

- Edit `routes/flights.js` (or relevant routes file)
- Add new route handler

**Step 2:** Implement controller method

- Edit `controllers/flightController.js`
- Implement the action

**Step 3:** Test with curl or Postman

```bash
curl http://localhost:3000/api/flights/flight-id
```

**Step 4:** Write tests

```bash
# Create test file
touch tests/unit/controllers/flights.test.js
# Write tests
npm test
```

### Debug an Issue

**Step 1:** Reproduce the issue

- What steps lead to the problem?
- Can you reproduce it consistently?

**Step 2:** Check logs

- Browser console (F12)
- Terminal output
- Network tab for API calls

**Step 3:** Add debugging

```javascript
console.log('Debug info:', variable);
console.error('Error:', error);
```

**Step 4:** Use browser debugger

- Set breakpoint in DevTools
- Step through code
- Inspect variables

**Step 5:** Check tests

```bash
npm run test:watch
# Fix the bug
# Test passes
```

See: [Debug Guide](./TROUBLESHOOTING/DEBUG_GUIDE.md)

### Sync with Main Branch

If main has new changes:

```bash
git fetch origin
git rebase origin/main
# Resolve any conflicts if needed
git push origin feature/my-feature --force-with-lease
```

### Undo Recent Changes

```bash
# Discard changes to a file
git checkout -- filename

# Discard all local changes
git checkout .

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1
```

---

## Development Habits

### ✅ Good Habits

- [ ] Test as you code (don't wait until end)
- [ ] Commit small, logical changes
- [ ] Write descriptive commit messages
- [ ] Review your own code before requesting review
- [ ] Check console for errors daily
- [ ] Run tests before pushing
- [ ] Read related documentation

### ❌ Avoid

- Large commits with many changes
- Committing without testing
- Ignoring console errors
- Skipping linting/formatting
- Breaking existing tests
- Pushing directly to main

---

## Code Review Etiquette

### Requesting Review

- ✅ Self-review first (catch obvious issues)
- ✅ Explain what you changed in PR description
- ✅ Reference related issue
- ✅ Test locally before requesting

### Reviewing Others' Code

- ✅ Be constructive and kind
- ✅ Explain "why" not just "what"
- ✅ Ask questions if unclear
- ✅ Approve when satisfied
- ❌ Approve without reading
- ❌ Demand perfection (good is fine)

---

## Tools to Know

### Git

```bash
git status          # See what changed
git diff            # See changes in detail
git log --oneline   # See recent commits
git branch -a       # See all branches
git stash           # Temporarily save changes
git reset --hard    # Completely undo changes
```

### NPM

```bash
npm install         # Install dependencies
npm update          # Update dependencies
npm list            # Show installed packages
npm outdated        # Show outdated packages
```

### Docker

```bash
docker-compose up   # Start services
docker-compose down # Stop services
docker ps           # Show running containers
docker logs -f app  # View app logs
```

### Database

```bash
npm run db:sync              # Sync models to DB
npm run db:migrate           # Run migrations
npm run db:seed-airports     # Seed data
```

---

## Before Pushing

**Always check:**

- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code formatted (`npm run format:check`)
- [ ] No console errors (F12)
- [ ] Manually tested feature
- [ ] Commit message is descriptive

---

## Debugging Checklist

When something breaks:

1. **Check basics**
   - [ ] Is server running? (`npm run dev`)
   - [ ] Is database running? (`docker ps`)
   - [ ] Did you install dependencies? (`npm install`)

2. **Check errors**
   - [ ] Browser console (F12)
   - [ ] Terminal output
   - [ ] Network tab for failed requests

3. **Debug deeper**
   - [ ] Add console.log statements
   - [ ] Use browser debugger
   - [ ] Check git diff for recent changes
   - [ ] Try undoing last change

4. **Search for help**
   - [ ] Check [Troubleshooting](./TROUBLESHOOTING/)
   - [ ] Check [Patterns](./PATTERNS/)
   - [ ] Ask team member

---

## Daily Checklist

**Start of Day:**

- [ ] `git pull origin main`
- [ ] `npm install`
- [ ] Start dev server (`npm run dev` or `docker-compose up`)
- [ ] Check Slack/GitHub for updates

**During Day:**

- [ ] Keep console open (F12)
- [ ] Test as you code
- [ ] Commit regularly (small commits)
- [ ] Run tests before push

**End of Day:**

- [ ] Push changes
- [ ] Request code review
- [ ] Leave notes for tomorrow

---

## Need Help?

- **Setup problem?** → [Setup Issues](./TROUBLESHOOTING/SETUP_ISSUES.md)
- **Something broken?** → [Troubleshooting](./TROUBLESHOOTING/)
- **How to do X?** → [Patterns](./PATTERNS/)
- **How does X work?** → [Features](./FEATURES/)

---

**Related:**

- [Getting Started](./GETTING_STARTED.md) - Initial setup
- [Patterns](./PATTERNS/) - How to implement features
- [Testing](./TESTING/) - How to write tests
- [Troubleshooting](./TROUBLESHOOTING/) - Common issues

---

**Last Updated:** 2025-12-17
