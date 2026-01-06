require('dotenv').config();
const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const passport = require('passport');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const compression = require('compression');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./models');
const dateFormatter = require('./utils/dateFormatter');
const logger = require('./utils/logger');
const redis = require('./utils/redis');
const { MS_PER_DAY } = require('./utils/constants');

// Validate required environment variables
const requiredEnvVars = ['SESSION_SECRET'];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  logger.error('Missing required environment variables', { missingVars });
  logger.error(`ERROR: Missing required environment variables: ${missingVars.join(', ')}`);
  logger.error('Please create a .env file based on .env.example');
  process.exit(1);
}

const app = express();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Trust proxy - required for rate limiting behind reverse proxy/load balancer
// This allows Express to trust X-Forwarded-* headers
app.set('trust proxy', 1);

// Middleware
app.use(compression()); // Compress all responses

// CORS configuration for Socket.IO and API requests
app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // Allow the request origin (works for same-origin and configured origins)
      callback(null, origin);
    },
    credentials: true, // Allow cookies and authentication headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In development, disable caching for bundle files to ensure latest code is always loaded
if (process.env.NODE_ENV === 'development') {
  app.use('/dist', (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
  });
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

// Session configuration
// Initialize session store (Redis if available, otherwise memory store)
let sessionStore;
const redisClient = redis.getClient();

if (redisClient && redis.isAvailable()) {
  // Use Redis for session storage in production
  sessionStore = new RedisStore({
    client: redisClient,
    prefix: 'sess:',
  });
  logger.info('Using Redis for session storage');
} else {
  // Fall back to memory store in development
  logger.info('Using memory store for sessions (not recommended for production)');
}

const sessionConfig = {
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: parseInt(process.env.SESSION_MAX_AGE, 10) || MS_PER_DAY, // 24 hours default
    httpOnly: true,
    // In development, allow cross-site cookies without requiring secure
    // In production, use secure + sameSite: none for cross-site access
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : false, // false = no sameSite restriction (allows cookies to be sent in development)
  },
};

const sessionMiddleware = session(sessionConfig);
app.use(sessionMiddleware);

// Passport middleware
require('./config/passport')(passport);

app.use(passport.initialize());
app.use(passport.session());

// Flash messages
app.use(flash());

// Request logging middleware (Phase 3)
const requestLogger = require('./middleware/requestLogger');

app.use(requestLogger);

// Asset version for cache-busting (set once at server start)
const ASSET_VERSION = Date.now();

// Load bundle manifest for esbuild bundles
let bundleManifest = {};
try {
  const manifestPath = path.join(__dirname, 'public/dist/manifest.json');
  logger.debug('Looking for manifest', { manifestPath, cwd: process.cwd(), dirname: __dirname });

  if (fs.existsSync(manifestPath)) {
    bundleManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    logger.info('Loaded bundle manifest', { bundles: Object.keys(bundleManifest) });
    logger.debug('Bundle paths', { bundleManifest });
  } else {
    logger.warn('Bundle manifest not found - run "npm run build-js" to generate bundles', {
      manifestPath,
    });
    // List what's in public/ directory
    const publicPath = path.join(__dirname, 'public');
    if (fs.existsSync(publicPath)) {
      logger.debug('Public directory contents', { files: fs.readdirSync(publicPath) });
    }
  }
} catch (error) {
  logger.error('Error loading bundle manifest', { error: error.message, stack: error.stack });
}

// Helper function to get bundle path
function getBundle(name) {
  return bundleManifest[name] || `/js/entries/${name}.js`;
}

// Global variables and utility functions
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;

  // Asset version for cache-busting
  res.locals.assetVersion = ASSET_VERSION;

  // Bundle paths for templates
  res.locals.getBundle = getBundle;

  // Map configuration
  res.locals.mapTileUrl =
    process.env.MAP_TILE_URL ||
    'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';

  // Make date formatting utilities available to all EJS templates
  res.locals.formatDate = dateFormatter.formatDate;
  res.locals.formatTime = dateFormatter.formatTime;
  res.locals.formatDateTime = dateFormatter.formatDateTime;
  res.locals.formatInTimezone = dateFormatter.formatInTimezone;
  res.locals.getAirportCode = dateFormatter.getAirportCode;
  res.locals.getFlightNum = dateFormatter.getFlightNum;
  res.locals.getCityName = dateFormatter.getCityName;
  res.locals.calculateLayoverDuration = dateFormatter.calculateLayoverDuration;
  res.locals.formatLayoverDisplay = dateFormatter.formatLayoverDisplay;
  res.locals.calculateLayover = dateFormatter.calculateLayover;
  res.locals.getLayoverText = dateFormatter.getLayoverText;

  // Make item color utilities available to all EJS templates
  const {
    getItemHexColor,
    getItemColorStyle,
    getActionColor,
    getApproveColor,
    getDeclineColor,
  } = require('./config/itemColors');
  res.locals.getItemHexColor = getItemHexColor;
  res.locals.getItemColorStyle = getItemColorStyle;
  res.locals.getActionColor = getActionColor;
  res.locals.getApproveColor = getApproveColor;
  res.locals.getDeclineColor = getDeclineColor;

  next();
});

// Sidebar content middleware
const { setSidebarFlag } = require('./middleware/sidebarContent');

app.use(setSidebarFlag);

// Test endpoint to check bundle files (for debugging)
app.get('/debug/bundles', (req, res) => {
  const distPath = path.join(__dirname, 'public/dist');
  const result = {
    __dirname,
    distPath,
    distExists: fs.existsSync(distPath),
    bundleManifest,
    files: [],
  };

  if (fs.existsSync(distPath)) {
    result.files = fs.readdirSync(distPath);
  }

  res.json(result);
});

// Health check endpoint (Phase 7 - DevOps)
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: require('./package.json').version,
  };

  // Check database connection
  try {
    await db.sequelize.authenticate();
    health.database = 'connected';
  } catch (error) {
    health.database = 'disconnected';
    health.status = 'degraded';
    logger.error('Health check: Database connection failed', { error: error.message });
  }

  // Check Redis connection
  try {
    const healthCheckRedisClient = redis.getClient();
    if (healthCheckRedisClient && redis.isAvailable()) {
      await healthCheckRedisClient.ping();
      health.redis = 'connected';
    } else {
      health.redis = 'disabled';
    }
  } catch (error) {
    health.redis = 'disconnected';
    health.status = 'degraded';
    logger.error('Health check: Redis connection failed', { error: error.message });
  }

  // Return appropriate status code
  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Rate limiting middleware disabled for development
// const { authLimiter, apiLimiter, formLimiter } = require('./middleware/rateLimiter');

// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth')); // Rate limiting disabled
app.use('/account', require('./routes/account'));
app.use('/companions', require('./routes/companions'));
app.use('/companion-relationships', require('./routes/companionRelationships'));
app.use('/api', require('./routes/api')); // Rate limiting disabled
app.use('/trips', require('./routes/trips'));
app.use('/trip-invitations', require('./routes/tripInvitations'));
app.use('/flights', require('./routes/flights')); // Rate limiting disabled
app.use('/hotels', require('./routes/hotels'));
app.use('/transportation', require('./routes/transportation'));
app.use('/car-rentals', require('./routes/carRentals'));
app.use('/events', require('./routes/events'));
app.use('/vouchers', require('./routes/vouchers'));

// Mount SvelteKit frontend handler for all non-API routes
// This must come after all API/auth routes so they take precedence
// SvelteKit adapter-node outputs ES modules, so we use a lazy-loading wrapper
let svelteKitHandler = null;
let svelteKitLoadError = null;

app.use(async (req, res, next) => {
  // Skip SvelteKit for API routes (already handled above)
  if (
    req.path.startsWith('/api') ||
    req.path.startsWith('/auth') ||
    req.path.startsWith('/account') ||
    req.path.startsWith('/companions') ||
    req.path.startsWith('/trips') ||
    req.path.startsWith('/flights') ||
    req.path.startsWith('/hotels') ||
    req.path.startsWith('/transportation') ||
    req.path.startsWith('/car-rentals') ||
    req.path.startsWith('/events') ||
    req.path.startsWith('/vouchers') ||
    req.path.startsWith('/companion-relationships') ||
    req.path.startsWith('/trip-invitations')
  ) {
    return next();
  }

  // Load SvelteKit handler on first non-API request
  if (svelteKitHandler === null && svelteKitLoadError === null) {
    try {
      // eslint-disable-next-line import/no-unresolved, import/extensions
      const svelteKitModule = await import('./frontend/build/handler.js');
      svelteKitHandler = svelteKitModule.handler;
      logger.info('SvelteKit frontend handler loaded successfully on first request');
    } catch (error) {
      svelteKitLoadError = error;
      logger.warn('Failed to load SvelteKit frontend handler', {
        error: error.message,
        hint: 'Make sure to build the frontend: npm run build in frontend/ directory',
      });
      return res.status(500).json({ error: 'Frontend handler not available' });
    }
  }

  // Return error if handler failed to load
  if (svelteKitLoadError) {
    return res.status(500).json({ error: 'Frontend handler not available' });
  }

  // Serve with SvelteKit handler
  svelteKitHandler(req, res, next);
});

// Error handling middleware (Phase 3)
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// 404 handler - must come after all routes
app.use(notFoundHandler);

// Error handler - must be last
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Initialize application
// 1. Initialize Redis (if enabled)
// 2. Test database connection
// 3. Start server
async function initializeApp() {
  try {
    // Initialize Redis
    await redis.initRedis();

    // Test database connection
    await db.sequelize.authenticate();
    logger.info('Database connection established successfully');

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
        port: PORT,
        redis: redis.isAvailable() ? 'enabled' : 'disabled',
      });
    });

    // Initialize WebSocket server
    const socketService = require('./services/socketService');
    socketService.initialize(server, sessionMiddleware, passport);
    logger.info('WebSocket server initialized');

    // Graceful shutdown handler
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      await redis.disconnect();
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });
  } catch (err) {
    logger.error('Application initialization failed', {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
}

// Start the application
initializeApp();
