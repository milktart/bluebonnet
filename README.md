# Bluebonnet Travel Planner

A comprehensive travel planning application built with Node.js, Express, and PostgreSQL. Users can create trips and manage all travel components including flights, hotels, car rentals, transportation, and events, with support for travel companions and voucher tracking.

## Features

- **Trip Management** - Create and manage complete travel itineraries
- **Multi-Component Support** - Flights, hotels, car rentals, transportation, and events
- **Travel Companions** - Invite companions with configurable permissions
- **Voucher Tracking** - Manage travel credits, upgrade vouchers, and gift cards
- **Interactive Maps** - View trip locations with Leaflet integration
- **Timeline View** - Visualize your entire trip chronologically
- **Real-time Notifications** - Get updates on companion requests and trip invitations
- **Mobile-Friendly** - Responsive design works on all devices

## Quick Start

### Local Development

**Requirements:**

- Node.js 18+
- PostgreSQL 15+
- npm or yarn

**Setup:**

```bash
# Clone the repository
git clone https://github.com/yourusername/bluebonnet.git
cd bluebonnet

# Install dependencies
npm install

# Create .env file (see Environment Variables below)
cp .env.example .env

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

Server runs on http://localhost:3000 with hot-reload.

### Docker Setup (Recommended)

```bash
# Start all services
docker-compose up

# Access the application
open http://localhost:3500
```

Docker Compose includes:

- Node.js app (port 3500)
- PostgreSQL (port 5432)
- Redis (port 6379)
- **Automatic database initialization** (creates tables and seeds airport data on first run)
- Volume mounts for development
- Persistent data storage

## Environment Variables

Create a `.env` file in the root directory:

```bash
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bluebonnet
DB_USER=postgres
DB_PASSWORD=your_password

# Session Secret
SESSION_SECRET=your-secret-key-change-in-production
```

## Project Structure

```
bluebonnet/
├── config/                 # Configuration files
│   ├── database.js        # Database connection config
│   └── passport.js        # Authentication config
├── controllers/           # Request handlers
│   ├── helpers/          # Reusable controller utilities
│   ├── tripController.js
│   ├── flightController.js
│   └── ...
├── models/               # Sequelize ORM models
│   ├── index.js         # Model initialization
│   ├── User.js
│   ├── Trip.js
│   └── ...
├── routes/              # Express routes
│   ├── auth.js
│   ├── trips.js
│   └── ...
├── views/              # EJS templates
│   ├── partials/      # Reusable components
│   └── trips/         # Trip-specific views
├── public/            # Static assets
│   ├── css/          # Tailwind CSS
│   ├── js/           # Client-side JavaScript (ES6 modules)
│   └── dist/         # Built bundles
├── middleware/       # Express middleware
│   ├── auth.js      # Authentication guards
│   └── validation.js # Input validation
├── services/        # External services
│   ├── geocodingService.js
│   └── airportService.js
└── docs/           # Documentation
    ├── ARCHITECTURE.md
    ├── DATABASE_SCHEMA.md
    └── ...
```

## Available Scripts

```bash
# Development
npm run dev              # Start dev server with nodemon
npm run build-css        # Build CSS (watch mode)
npm run build-js:watch   # Build JavaScript bundles (watch mode)

# Production
npm start               # Start production server
npm run build          # Build all assets for production
npm run build:prod     # Build optimized bundles

# Database
npm run migrate        # Run database migrations
npm run migrate:undo   # Rollback last migration

# Testing
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

## Architecture

### MVC Pattern

The application follows a clean MVC architecture:

- **Models** (`models/`) - Sequelize ORM with associations
- **Controllers** (`controllers/`) - Business logic and request handling
- **Views** (`views/`) - EJS templates for server-side rendering
- **Routes** (`routes/`) - URL mapping and middleware

### Key Technologies

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL 15 with Sequelize ORM
- **Cache:** Redis (session storage)
- **Frontend:** Vanilla JavaScript (ES6 modules), Tailwind CSS
- **Maps:** Leaflet.js
- **Build Tools:** esbuild, Tailwind CLI
- **Authentication:** Passport.js with bcrypt

### Three-Sidebar Layout

Dashboard and trip detail pages use a consistent three-sidebar pattern:

- **Primary sidebar** - Always visible, fixed width
- **Secondary sidebar** - On-demand content (forms, details)
- **Tertiary sidebar** - Additional context (maps, vouchers)

All sidebars load asynchronously via AJAX for better performance.

## Database

### Schema

The database uses UUID primary keys throughout. Key tables:

- **users** - User accounts and authentication
- **trips** - Main trip records
- **flights, hotels, transportation, car_rentals, events** - Trip components
- **travel_companions** - Companion profiles
- **trip_companions** - Many-to-many trip/companion relationships
- **vouchers** - Travel credits and vouchers
- **notifications** - Real-time notification system

See [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) for complete schema documentation.

### Migrations

The application uses Sequelize migrations for version-controlled schema changes:

```bash
# Run migrations
npm run migrate

# Create new migration
npx sequelize-cli migration:generate --name description

# Rollback
npm run migrate:undo
```

## Authentication

User authentication uses Passport.js with local strategy:

- **Session-based** auth with express-session
- **Password hashing** with bcrypt (10 rounds)
- **Protected routes** via `ensureAuthenticated` middleware
- **Session storage** in Redis for scalability

## Features in Detail

### Travel Companions

The companions system allows users to:

- Create companion profiles
- Send companion requests with permission levels (view/manage)
- Invite companions to trips with custom edit permissions
- Auto-inherit companions to all trip items
- Track companion attendance per item

### Voucher Tracking

Manage travel credits and vouchers:

- Multiple voucher types (credits, upgrades, gift cards)
- Attach vouchers to specific flight segments
- Assign to trip owner or companions
- Track redemption status
- Multi-segment application support

### Maps & Geocoding

- **Leaflet integration** for interactive maps
- **Geocoding service** using OpenStreetMap Nominatim
- **Airport data** with IATA code lookup
- **In-memory caching** for performance
- **Timeline hover effects** highlight map markers

## Testing

Comprehensive testing documentation available:

- **[CLAUDE.md#testing-policy](CLAUDE.md#testing-policy)** - Testing policy and requirements for new code
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Manual testing procedures (36+ test cases)
- **[API_ENDPOINTS.md](API_ENDPOINTS.md)** - API reference with examples

Run automated tests:

```bash
npm test                # All tests
npm run test:unit       # Unit tests only
npm run test:integration # Integration tests
npm run test:coverage   # Coverage report
npm run test:watch      # Watch mode for TDD
```

**Testing Requirements:**

- All new services must have ≥80% test coverage
- All new utilities must have ≥90% test coverage
- All new API endpoints must have ≥70% test coverage
- See [Testing Policy](CLAUDE.md#testing-policy) for full requirements

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment procedures.

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure strong `SESSION_SECRET`
- [ ] Run database migrations
- [ ] Build production assets (`npm run build:prod`)
- [ ] Configure SSL/HTTPS
- [ ] Set up error monitoring (Sentry)
- [ ] Configure Redis session store
- [ ] Enable compression middleware
- [ ] Set up database backups

### Docker Production

```bash
# Build and start
docker-compose -f docker-compose.prod.yml up -d

# Health check
curl http://localhost:3500/health
```

## Documentation

- **[CLAUDE.md](CLAUDE.md)** - Comprehensive project guide for development
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture overview
- **[docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)** - Complete database reference
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Deployment procedures
- **[BUILD.md](BUILD.md)** - Build system documentation
- **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** - Travel Companions implementation
- **[API_ENDPOINTS.md](API_ENDPOINTS.md)** - API endpoint reference
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Testing procedures

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. **Write tests** for new code (see [Testing Policy](CLAUDE.md#testing-policy))
4. Ensure all tests pass (`npm test`)
5. Ensure code is formatted (`npm run format:check`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

**Before submitting a PR:**

- [ ] All tests pass
- [ ] New code has tests with adequate coverage
- [ ] Code follows ESLint rules (`npm run lint`)
- [ ] Code is formatted with Prettier (`npm run format`)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:

- GitHub Issues: [Report an issue](https://github.com/yourusername/bluebonnet/issues)
- Documentation: Start with [CLAUDE.md](CLAUDE.md)

## Roadmap

- [ ] Progressive Web App (PWA) support
- [ ] Mobile API for native apps
- [ ] WebSocket real-time updates (replace polling)
- [ ] Export trips to PDF/iCal
- [ ] Multi-language support
- [ ] Dark mode theme

---

Built with ❤️ using Node.js, Express, and PostgreSQL
