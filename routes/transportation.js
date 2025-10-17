const express = require('express');
const router = express.Router();
const transportationController = require('../controllers/transportationController');
const { ensureAuthenticated } = require('../middleware/auth');

router.use(ensureAuthenticated);

router.post('/trips/:tripId/transportation', transportationController.createTransportation);
router.post('/transportation/standalone', transportationController.createTransportation); // Standalone transportation
router.put('/:id', transportationController.updateTransportation);
router.delete('/:id', transportationController.deleteTransportation);

module.exports = router;