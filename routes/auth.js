const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');
const { forwardAuthenticated } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validation');

router.get('/login', forwardAuthenticated, authController.getLogin);

router.post('/login', validateLogin, passport.authenticate('local', {
  failureRedirect: '/auth/login',
  failureFlash: true
}), (req, res) => {
  const returnTo = req.session.returnTo || '/';
  delete req.session.returnTo;
  res.redirect(returnTo);
});

router.get('/register', forwardAuthenticated, authController.getRegister);

router.post('/register', validateRegistration, authController.postRegister);

router.get('/logout', authController.logout);

module.exports = router;