const express = require('express');

const router = express.Router();
const transportationController = require('../controllers/transportationController');
const { ensureAuthenticated } = require('../middleware/auth');
const { validateTransportation } = require('../middleware/validation');

router.use(ensureAuthenticated);

router.get('/trips/:tripId/form', transportationController.getAddForm);
router.get('/standalone/form', transportationController.getAddForm); // Standalone transportation form (same as trip form)
router.get('/:id/form', transportationController.getEditForm);
router.post(
  '/trips/:tripId/transportation',
  validateTransportation,
  transportationController.createTransportation
);
router.post('/standalone', validateTransportation, transportationController.createTransportation); // Standalone transportation
router.put('/:id', validateTransportation, transportationController.updateTransportation);
router.delete('/:id', transportationController.deleteTransportation);
router.post('/:id/restore', transportationController.restoreTransportation);

module.exports = router;
