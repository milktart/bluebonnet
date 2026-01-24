# 🚀 Getting Started with Bluebonnet

Welcome! This guide will get you running in 10-15 minutes.

---

## Prerequisites

Before starting, make sure you have:

- **Node.js** (v18+) - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **Docker & Docker Compose** (optional, but recommended) - [Download](https://www.docker.com/products/docker-desktop)
- **PostgreSQL** (only if not using Docker) - [Download](https://www.postgresql.org/)
- **A code editor** - VS Code recommended

**Check your versions:**

```bash
node --version    # Should be v18+
npm --version     # Should be v9+
git --version     # Any recent version
docker --version  # For Docker setup (optional)
```

---

## Option 1: Docker Setup (Recommended - 5 minutes)

**Why Docker?** Everything works the same for everyone. No configuration needed.

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/bluebonnet.git
cd bluebonnet-dev
```

### Step 2: Start Services

```bash
docker-compose up --build
```

This will:

- Build the application
- Start PostgreSQL database
- Start Redis cache
- Start Express server
- Initialize database with tables and airport data

### Step 3: Open Application

```
http://localhost:3500
```

**Done!** Your app is running. Skip to [First Steps](#first-steps).

**Troubleshooting Docker?**

- Check [Setup Issues](./TROUBLESHOOTING/SETUP_ISSUES.md)
- Make sure Docker Desktop is running
- Try `docker ps` to verify containers running

---

## Option 2: Local Development Setup (10-15 minutes)

For local development without Docker.

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/bluebonnet.git
cd bluebonnet-dev
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all Node.js packages.

### Step 3: Create Environment File

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bluebonnet
DB_USER=postgres
DB_PASSWORD=your_password
SESSION_SECRET=your-random-secret-here
NODE_ENV=development
PORT=3000
```

### Step 4: Start PostgreSQL

Make sure PostgreSQL is running (on port 5432).

**On macOS:**

```bash
brew services start postgresql
```

**On Linux:**

```bash
sudo service postgresql start
```

**On Windows:** Start PostgreSQL from Services or PostgreSQL installer

### Step 5: Initialize Database

```bash
npm run db:sync              # Create tables
npm run db:seed-airports     # Seed airport data
```

### Step 6: Start Development Server

```bash
npm run dev
```

Server runs on `http://localhost:3000`

---

## First Steps

### 1. Create an Account

- Go to http://localhost:3500 (Docker) or http://localhost:3000 (Local)
- Click "Register"
- Fill in email, password, name
- Click "Register"

### 2. Log In

- Enter your credentials
- Click "Log In"

### 3. Create Your First Trip

- Click "New Trip"
- Enter trip name, start date, end date
- Click "Create"

### 4. Add a Travel Item

- Click "Add Flight"
- Fill in flight details
- Click "Save"

### 5. Explore

- Check out the calendar view
- Add more items (hotels, events, etc.)
- Try the map view
- Invite companions (try creating a companion first)

---

## Common Commands

### Development

```bash
# Start development server (watches for changes)
npm run dev

# Run in production mode
npm start

# Build CSS (watch mode)
npm run build-css

# Build CSS (production, minified)
npm run build-css-prod

# Build JavaScript
npm run build

# Run both CSS and JS builds
npm run build
```

### Database

```bash
# Create/update database tables
npm run db:sync

# Seed airport data
npm run db:seed-airports

# Run migrations
npm run db:migrate

# Undo last migration
npm run db:migrate:undo

# Check migration status
npm run db:migrate:status
```

### Code Quality

```bash
# Run all tests
npm test

# Run tests in watch mode (re-run on file change)
npm run test:watch

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Check code style
npm run lint

# Fix code style issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### Docker

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

# Open shell in container
docker-compose exec app bash
```

### Cache

```bash
# Clear application cache
npm run cache:clear
```

---

## Folder Structure

Quick tour of what's where:

```
bluebonnet/
├── .claude/                 # Documentation (you are here!)
├── controllers/             # Request handlers
├── models/                  # Database models
├── routes/                  # API endpoints
├── views/                   # EJS templates (Phase 1 → Svelte)
├── public/                  # Client-side code
│   ├── js/                  # JavaScript files
│   └── css/                 # Stylesheets
├── services/                # Business logic
├── middleware/              # Auth, validation
├── utils/                   # Utilities
├── tests/                   # Test files
├── data/                    # Static data (airports, airlines)
├── docker-compose.yml       # Docker configuration
├── package.json             # Dependencies
├── .env.example             # Environment template
└── server.js                # Express server
```

---

## Next Steps

### Understand the System

1. Read [Development Workflow](./DEVELOPMENT.md) - 10 min
2. Read [Architecture Overview](./ARCHITECTURE/README.md) - 20 min
3. Check out [FEATURES/](./FEATURES/) for specific features

### Start Contributing

1. Pick a simple issue
2. Follow [CRUD Pattern](./PATTERNS/CRUD_PATTERN.md)
3. Make your changes
4. Run tests (`npm test`)
5. Create a pull request

### Learn New Technologies

- **Svelte?** → [Svelte Basics](./LEARNING_RESOURCES/SVELTE_BASICS.md)
- **Express?** → [Backend Architecture](./ARCHITECTURE/BACKEND/README.md)
- **Database?** → [Database Basics](./LEARNING_RESOURCES/DATABASE_BASICS.md)

---

## Stuck?

### Check These First

1. [Troubleshooting](./TROUBLESHOOTING/) - Common problems
2. [Debug Guide](./TROUBLESHOOTING/DEBUG_GUIDE.md) - Debugging methodology
3. [Setup Issues](./TROUBLESHOOTING/SETUP_ISSUES.md) - Setup problems

### Ask for Help

- Check relevant documentation in [.claude/](./README.md)
- Ask a team member
- Post an issue on GitHub

---

## What's Different Between Options?

### Docker Setup

- ✅ Everything works out of the box
- ✅ Same environment as production
- ✅ Easy to reset (just `docker-compose down`)
- ❌ Slightly larger disk space
- ❌ Docker must be running

### Local Setup

- ✅ Faster to iterate (no container overhead)
- ✅ Easier to debug locally
- ✅ Less resource usage
- ❌ Need PostgreSQL/Redis installed
- ❌ Environment differences possible

**Recommendation:** Start with Docker, switch to local if you prefer it.

---

## Troubleshooting Quick Fixes

| Problem               | Solution                                             |
| --------------------- | ---------------------------------------------------- |
| App won't start       | Check Node.js version (`node -v`), run `npm install` |
| Database error        | Check PostgreSQL running, verify `.env` credentials  |
| Port 3000/3500 in use | Change PORT in `.env`, or kill existing process      |
| Module not found      | Run `npm install`                                    |
| Docker errors         | Make sure Docker Desktop running, try `docker ps`    |

More help? See [Setup Issues](./TROUBLESHOOTING/SETUP_ISSUES.md)

---

## You're Ready!

You now have Bluebonnet running locally. Next:

1. Read [Development Workflow](./DEVELOPMENT.md)
2. Explore the application
3. Make your first contribution

**Welcome to the team! 🚀**

---

**Related:**

- [Development Workflow](./DEVELOPMENT.md) - Daily commands
- [Architecture](./ARCHITECTURE/README.md) - How it works
- [Troubleshooting](./TROUBLESHOOTING/) - When things break

---

**Last Updated:** 2025-12-17
**Preferred Method:** Docker (Option 1)
