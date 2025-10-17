const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { ensureAuthenticated } = require('../middleware/auth');

router.use(ensureAuthenticated);

router.post('/trips/:tripId/events', eventController.createEvent);
router.post('/events/standalone', eventController.createEvent); // Standalone events
router.put('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

module.exports = router;