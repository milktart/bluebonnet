require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const db = require('./models');
const dateFormatter = require('./utils/dateFormatter');
const logger = require('./utils/logger');

// Validate required environment variables
const requiredEnvVars = ['SESSION_SECRET'];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  logger.error('Missing required environment variables', { missingVars });
  console.error(`ERROR: Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Please create a .env file based on .env.example');
  process.exit(1);
}

const app = express();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(compression()); // Compress all responses
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
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  })
);

// Passport middleware
require('./config/passport')(passport);

app.use(passport.initialize());
app.use(passport.session());

// Flash messages
app.use(flash());

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

  // Make date formatting utilities available to all EJS templates
  res.locals.formatDate = dateFormatter.formatDate;
  res.locals.formatTime = dateFormatter.formatTime;
  res.locals.formatDateTime = dateFormatter.formatDateTime;
  res.locals.getAirportCode = dateFormatter.getAirportCode;
  res.locals.getFlightNum = dateFormatter.getFlightNum;
  res.locals.getCityName = dateFormatter.getCityName;
  res.locals.calculateLayoverDuration = dateFormatter.calculateLayoverDuration;
  res.locals.formatLayoverDisplay = dateFormatter.formatLayoverDisplay;
  res.locals.calculateLayover = dateFormatter.calculateLayover;
  res.locals.getLayoverText = dateFormatter.getLayoverText;

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

// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/account', require('./routes/account'));
app.use('/companions', require('./routes/companions'));
app.use('/companion-relationships', require('./routes/companionRelationships'));
app.use('/api', require('./routes/api'));
app.use('/trips', require('./routes/trips'));
app.use('/trip-invitations', require('./routes/tripInvitations'));
app.use('/notifications', require('./routes/notifications'));
app.use('/flights', require('./routes/flights'));
app.use('/hotels', require('./routes/hotels'));
app.use('/transportation', require('./routes/transportation'));
app.use('/car-rentals', require('./routes/carRentals'));
app.use('/events', require('./routes/events'));
app.use('/vouchers', require('./routes/vouchers'));

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found', req });
});

// Error handler
app.use((err, req, res, _next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  });
  res.status(500).render('error', {
    title: 'Error',
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
});

const PORT = process.env.PORT || 3000;

// Test database connection and start server
// NOTE: Database schema is managed by migrations (npm run db:migrate)
// Run migrations before starting the server in production
db.sequelize
  .authenticate()
  .then(() => {
    logger.info('Database connection established successfully');

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
        port: PORT,
      });
      logger.info('Run "npm run db:migrate" to apply pending database migrations');
    });
  })
  .catch((err) => {
    logger.error('Unable to connect to database', {
      error: err.message,
      stack: err.stack,
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'dev_travel_planner',
    });
    process.exit(1);
  });
