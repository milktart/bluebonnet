const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');
const { forwardAuthenticated } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validation');

router.get('/login', forwardAuthenticated, authController.getLogin);

router.post('/login', validateLogin, passport.authenticate('local', {
  successRedirect: '/trips',
  failureRedirect: '/auth/login',
  failureFlash: true
}));

router.get('/register', forwardAuthenticated, authController.getRegister);

router.post('/register', validateRegistration, authController.postRegister);

router.get('/logout', authController.logout);

module.exports = router;