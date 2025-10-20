const express = require('express');
const router = express.Router();
const carRentalController = require('../controllers/carRentalController');
const { ensureAuthenticated } = require('../middleware/auth');

router.use(ensureAuthenticated);

router.get('/trips/:tripId/form', carRentalController.getAddForm);
router.get('/:id/form', carRentalController.getEditForm);
router.post('/trips/:tripId/car-rentals', carRentalController.createCarRental);
router.put('/:id', carRentalController.updateCarRental);
router.delete('/:id', carRentalController.deleteCarRental);

module.exports = router;