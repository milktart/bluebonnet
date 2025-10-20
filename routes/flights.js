const express = require('express');
const router = express.Router();
const flightController = require('../controllers/flightController');
const { ensureAuthenticated } = require('../middleware/auth');

router.use(ensureAuthenticated);

router.get('/search', flightController.searchFlight);
router.get('/airports/search', flightController.searchAirports);
router.get('/trips/:tripId/form', flightController.getAddForm);
router.get('/:id/form', flightController.getEditForm);
router.post('/trips/:tripId/flights', flightController.createFlight);
router.post('/flights/standalone', flightController.createFlight); // Standalone flights
router.put('/:id', flightController.updateFlight);
router.delete('/:id', flightController.deleteFlight);

module.exports = router;