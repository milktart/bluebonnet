const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const { ensureAuthenticated } = require('../middleware/auth');
const { validateTrip } = require('../middleware/validation');

router.use(ensureAuthenticated);

router.get('/', tripController.listTrips);
router.post('/', validateTrip, tripController.createTrip);
router.get('/:id/api', tripController.getTripDataJson);
router.get('/:id/sidebar', tripController.getTripSidebarHtml);
router.get('/:id', tripController.viewTrip);
router.get('/:id/edit', tripController.getEditTrip);
router.get('/:id/edit/sidebar', tripController.getEditTripSidebar);
router.put('/:id', validateTrip, tripController.updateTrip);
router.delete('/:id', tripController.deleteTrip);
router.get('/:id/map', tripController.getMapView);
router.delete('/:id/companions/self/remove', tripController.removeSelfFromTrip);

module.exports = router;