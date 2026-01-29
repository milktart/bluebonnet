const express = require('express');

const router = express.Router();
const eventController = require('../controllers/eventController');
const { ensureAuthenticated } = require('../middleware/auth');
const { validateEvent } = require('../middleware/validation');

router.use(ensureAuthenticated);

router.get('/standalone/form', eventController.getStandaloneForm); // Get standalone form
router.get('/trips/:tripId/form', eventController.getAddForm);
router.get('/:id/form', eventController.getEditForm);
router.get('/:id/sidebar', eventController.getEventSidebar);
router.get('/:id/edit-form', eventController.getEventEditForm);
router.post('/trips/:tripId/events', validateEvent, eventController.createEvent);
router.post('/standalone', validateEvent, eventController.createEvent); // Standalone events
router.put('/:id', validateEvent, eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);
router.post('/:id/restore', eventController.restoreEvent);

module.exports = router;
