const express = require('express');

const router = express.Router();
const carRentalController = require('../controllers/carRentalController');
const { ensureAuthenticated } = require('../middleware/auth');
const { validateCarRental } = require('../middleware/validation');

router.use(ensureAuthenticated);

router.get('/trips/:tripId/form', carRentalController.getAddForm);
router.get('/standalone/form', carRentalController.getAddForm); // Standalone car rental form (same as trip form)
router.get('/:id/form', carRentalController.getEditForm);
router.post('/trips/:tripId/car-rentals', validateCarRental, carRentalController.createCarRental);
router.post('/standalone', validateCarRental, carRentalController.createCarRental); // Standalone car rentals
router.put('/:id', validateCarRental, carRentalController.updateCarRental);
router.delete('/:id', carRentalController.deleteCarRental);
router.post('/:id/restore', carRentalController.restoreCarRental);

module.exports = router;
