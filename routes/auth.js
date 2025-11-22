const express = require('express');

const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');
const { ensureAuthenticated, forwardAuthenticated } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validation');

router.get('/login', forwardAuthenticated, authController.getLogin);

router.post(
  '/login',
  validateLogin,
  passport.authenticate('local', {
    failureRedirect: '/auth/login',
    failureFlash: true,
  }),
  (req, res) => {
    const returnTo = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(returnTo);
  }
);

router.get('/register', forwardAuthenticated, authController.getRegister);

router.post('/register', validateRegistration, authController.postRegister);

// Logout (requires authentication)
router.get('/logout', ensureAuthenticated, authController.logout);

module.exports = router;
