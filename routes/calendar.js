const express = require('express');

const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const calendarController = require('../controllers/calendarController');

// GET calendar sidebar content for dashboard (AJAX endpoint)
router.get('/sidebar', ensureAuthenticated, async (req, res) => {
  try {
    await calendarController.getCalendarSidebar(req, res);
  } catch (error) {
    console.error('Error fetching calendar sidebar:', error);
    res.status(500).send('Error loading calendar');
  }
});

module.exports = router;
