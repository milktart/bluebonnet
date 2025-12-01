const express = require('express');

const router = express.Router();
const flightController = require('../controllers/flightController');
const { ensureAuthenticated } = require('../middleware/auth');

router.use(ensureAuthenticated);

router.get('/search', flightController.searchFlight);
router.get('/airports/search', flightController.searchAirports);
router.get('/trips/:tripId/form', flightController.getAddForm);
router.get('/standalone/form', flightController.getAddForm); // Standalone flight form (same as trip form)
router.get('/:id/form', flightController.getEditForm);
router.post('/trips/:tripId/flights', flightController.createFlight);
router.post('/standalone', flightController.createFlight); // Standalone flights
router.put('/:id', flightController.updateFlight);
router.delete('/:id', flightController.deleteFlight);
router.post('/:id/restore', flightController.restoreFlight);

module.exports = router;
