const express = require('express');

const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const tripController = require('../controllers/tripController');

// Home page - redirects to trips if authenticated, otherwise shows landing page
router.get('/', (req, res, next) => {
  if (req.isAuthenticated()) {
    return tripController.listTrips(req, res);
  }
  next();
});

// Landing page for non-authenticated users
router.get('/', (req, res) => {
  res.render('index', { title: 'Welcome to Travel Planner' });
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

module.exports = router;
