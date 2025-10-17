const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');
const { ensureAuthenticated } = require('../middleware/auth');

router.use(ensureAuthenticated);

router.post('/trips/:tripId/hotels', hotelController.createHotel);
router.put('/:id', hotelController.updateHotel);
router.delete('/:id', hotelController.deleteHotel);

module.exports = router;