const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');

router.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/trips');
  }
  res.render('index', { title: 'Welcome to Travel Planner' });
});

module.exports = router;