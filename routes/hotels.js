const express = require('express');

const router = express.Router();
const hotelController = require('../controllers/hotelController');
const { ensureAuthenticated } = require('../middleware/auth');
const { validateHotel } = require('../middleware/validation');

router.use(ensureAuthenticated);

router.get('/trips/:tripId/form', hotelController.getAddForm);
router.get('/standalone/form', hotelController.getAddForm); // Standalone hotel form (same as trip form)
router.get('/:id/form', hotelController.getEditForm);
router.post('/trips/:tripId/hotels', validateHotel, hotelController.createHotel);
router.post('/standalone', validateHotel, hotelController.createHotel); // Standalone hotels
router.put('/:id', validateHotel, hotelController.updateHotel);
router.delete('/:id', hotelController.deleteHotel);
router.post('/:id/restore', hotelController.restoreHotel);

module.exports = router;
