const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const tripController = require('../controllers/tripController');

router.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    return tripController.listTrips(req, res);
  }
  res.render('index', { title: 'Welcome to Travel Planner' });
});

// GET certificates page with sidebar open (sticky URL)
router.get('/certificates', ensureAuthenticated, (req, res) => {
  tripController.listTrips(req, res, { openCertificatesSidebar: true });
});

// GET certificate details page (with tertiary sidebar open)
router.get('/certificates/:voucherId', ensureAuthenticated, (req, res) => {
  tripController.listTrips(req, res, { openCertificatesSidebar: true, openCertificateDetails: req.params.voucherId });
});

module.exports = router;