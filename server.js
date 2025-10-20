require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const path = require('path');
const db = require('./models');

const app = express();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// Passport middleware
require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

// Flash messages
app.use(flash());

// Global variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

// Sidebar content middleware
const { setSidebarFlag } = require('./middleware/sidebarContent');
app.use(setSidebarFlag);

// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/account', require('./routes/account'));
app.use('/companions', require('./routes/companions'));
app.use('/api', require('./routes/api'));
app.use('/trips', require('./routes/trips'));
app.use('/flights', require('./routes/flights'));
app.use('/hotels', require('./routes/hotels'));
app.use('/transportation', require('./routes/transportation'));
app.use('/car-rentals', require('./routes/carRentals'));
app.use('/events', require('./routes/events'));

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const PORT = process.env.PORT || 3000;

// Sync database and start server
db.sequelize.sync({ alter: true }).then(async () => {
  // Alter events table to make tripId nullable for standalone events
  try {
    await db.sequelize.query(`
      ALTER TABLE "events"
      ALTER COLUMN "tripId" DROP NOT NULL;
    `);
    console.log('Events table constraint updated');
  } catch (err) {
    // Constraint might not exist yet or already be nullable, that's fine
    console.log('Constraint update skipped (may not exist yet)');
  }

  console.log('Database synced');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Unable to sync database:', err);
});
