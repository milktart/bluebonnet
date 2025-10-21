const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');
const { ensureAuthenticated } = require('../middleware/auth');

router.use(ensureAuthenticated);

router.get('/trips/:tripId/form', hotelController.getAddForm);
router.get('/:id/form', hotelController.getEditForm);
router.post('/trips/:tripId/hotels', hotelController.createHotel);
router.put('/:id', hotelController.updateHotel);
router.delete('/:id', hotelController.deleteHotel);
router.post('/:id/restore', hotelController.restoreHotel);

module.exports = router;