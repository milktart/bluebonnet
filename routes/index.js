const express = require('express');

const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const tripController = require('../controllers/tripController');

// Home page - let SvelteKit handle the landing page for all users
// Authenticated users should see the landing page, not be redirected to trips
router.get('/', (req, res, next) => {
  // Always let SvelteKit handle the root path
  next();
});

// Legacy routes - redirect to new structure
// /settings → /manage/account
router.get('/settings', ensureAuthenticated, (req, res) => {
  res.redirect('/manage/account');
});

// /certificates → /manage/certificates
router.get('/certificates', ensureAuthenticated, (req, res) => {
  res.redirect('/manage/certificates');
});

// /certificates/:voucherId → /manage/certificates/:voucherId
router.get('/certificates/:voucherId', ensureAuthenticated, (req, res) => {
  res.redirect(`/manage/certificates/${req.params.voucherId}`);
});

// /companions → /manage/companions
router.get('/companions', ensureAuthenticated, (req, res) => {
  res.redirect('/manage/companions');
});

// ===== Tab Navigation URLs =====

// GET upcoming trips (accessible at both / and /trips/upcoming)
router.get('/trips/upcoming', ensureAuthenticated, (req, res) => {
  tripController.listTrips(req, res, { activeTab: 'upcoming' });
});

// GET past trips
router.get('/trips/past', ensureAuthenticated, (req, res) => {
  tripController.listTrips(req, res, { activeTab: 'past' });
});

// ===== Settings Menu URLs =====

// GET manage page (settings tab, no sidebar open)
router.get('/manage', ensureAuthenticated, (req, res) => {
  tripController.listTrips(req, res, { showSettingsTab: true });
});

// GET account settings within manage
router.get('/manage/account', ensureAuthenticated, (req, res) => {
  tripController.listTrips(req, res, { openSettingsSidebar: true, openAccountSettings: true });
});

// GET certificates within manage
router.get('/manage/certificates', ensureAuthenticated, (req, res) => {
  tripController.listTrips(req, res, { openSettingsSidebar: true, openCertificatesSidebar: true });
});

// GET companions within manage
router.get('/manage/companions', ensureAuthenticated, (req, res) => {
  tripController.listTrips(req, res, { openCompanionsSidebar: true });
});

// GET certificate details within manage
router.get('/manage/certificates/:voucherId', ensureAuthenticated, (req, res) => {
  tripController.listTrips(req, res, {
    openSettingsSidebar: true,
    openCertificatesSidebar: true,
    openCertificateDetails: req.params.voucherId,
  });
});

// ===== Sidebar Content Routes =====

// GET primary sidebar content for dashboard (AJAX endpoint for refresh)
// Returns the primary sidebar content for the specified active tab
router.get('/dashboard/primary-sidebar', ensureAuthenticated, async (req, res) => {
  try {
    const activeTab = req.query.activeTab || 'upcoming';

    // Reuse the trip controller to fetch and render the primary sidebar content
    // This endpoint returns only the primary sidebar HTML, not the full page
    await tripController.getPrimarySidebarContent(req, res, { activeTab });
  } catch (error) {
    console.error('Error fetching primary sidebar content:', error);
    res.status(500).send('Error loading sidebar content');
  }
});

// Calendar routes
const calendarRouter = require('./calendar');

router.use('/calendar', calendarRouter);

// GET dashboard API data (returns all standalone items for map refresh)
router.get('/dashboard/api', ensureAuthenticated, async (req, res) => {
  try {
    // Return all standalone items (flights, hotels, transportation, carRentals, events)
    // This is used for async map refresh after editing standalone items
    await tripController.getDashboardApiData(req, res);
  } catch (error) {
    console.error('Error fetching dashboard API data:', error);
    res.status(500).json({ error: 'Error loading dashboard data' });
  }
});

// GET new item menu (used in dashboard secondary sidebar)
router.get('/new-item-menu', ensureAuthenticated, (req, res) => {
  res.json({
    success: true,
    items: [
      { label: 'Flight', value: 'flight' },
      { label: 'Hotel', value: 'hotel' },
      { label: 'Event', value: 'event' },
      { label: 'Transportation', value: 'transportation' },
      { label: 'Car Rental', value: 'car-rental' },
    ],
  });
});

// GET form for creating a new trip (sidebar form)
router.get('/trips/form', ensureAuthenticated, async (req, res) => {
  try {
    return require('../controllers/tripController').getCreateForm(req, res);
  } catch (error) {
    res.status(500).send('Error loading trip form');
  }
});

// GET form for adding a new item - unified endpoint for both trip and standalone contexts
// /forms/add/:type - standalone item form
// /forms/add/:type/:tripId - trip item form
router.get('/forms/add/:type/:tripId?', ensureAuthenticated, (req, res) => {
  const { type, tripId } = req.params;

  // Validate item type
  const validTypes = ['flight', 'hotel', 'transportation', 'carRental', 'car-rental', 'event'];
  if (!validTypes.includes(type)) {
    return res.status(400).send('Invalid item type');
  }

  // Route to appropriate controller based on type
  switch (type) {
    case 'flight':
      return require('../controllers/flightController').getAddForm(req, res);
    case 'hotel':
      return require('../controllers/hotelController').getAddForm(req, res);
    case 'transportation':
      return require('../controllers/transportationController').getAddForm(req, res);
    case 'carRental':
    case 'car-rental':
      return require('../controllers/carRentalController').getAddForm(req, res);
    case 'event':
      return require('../controllers/eventController').getAddForm(req, res);
    default:
      return res.status(400).send('Invalid item type');
  }
});

module.exports = router;
