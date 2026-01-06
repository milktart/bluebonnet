const express = require('express');

const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');
const { ensureAuthenticated, forwardAuthenticated } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validation');

router.get('/login', forwardAuthenticated, authController.getLogin);

router.post('/login', validateLogin, (req, res, next) => {
  const isJsonRequest = req.get('content-type')?.includes('application/json');

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      if (isJsonRequest) {
        return res.status(401).json({
          success: false,
          message: info?.message || 'Invalid credentials',
        });
      }
      req.flash('error_msg', info?.message || 'Invalid credentials');
      return res.redirect('/auth/login');
    }

    // Check if account is active (soft delete check)
    if (!user.isActive) {
      if (isJsonRequest) {
        return res.status(401).json({
          success: false,
          message: 'This account has been deactivated. Contact support for assistance.',
        });
      }
      req.flash('error_msg', 'This account has been deactivated. Contact support for assistance.');
      return res.redirect('/auth/login');
    }

    req.logIn(user, async (err) => {
      if (err) {
        return next(err);
      }

      // Update lastLogin timestamp
      try {
        await user.update({ lastLogin: new Date() });
      } catch (updateError) {
        // Log error but don't fail the login
        console.error('Error updating lastLogin:', updateError);
      }

      if (isJsonRequest) {
        return res.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isAdmin: user.isAdmin,
          },
        });
      }

      const returnTo = req.session.returnTo || '/';
      delete req.session.returnTo;
      res.redirect(returnTo);
    });
  })(req, res, next);
});

router.get('/register', forwardAuthenticated, authController.getRegister);

router.post('/register', validateRegistration, authController.postRegister);

// Logout (requires authentication)
router.get('/logout', ensureAuthenticated, authController.logout);

// Session verification endpoint - returns 200 if session is valid, 401 if not
// Used by frontend to verify if a session cookie is still valid
router.get('/verify-session', (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({
      authenticated: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        isAdmin: req.user.isAdmin,
      },
    });
  }

  // Session is not valid (cookie exists but session data is gone, or no cookie)
  res.status(401).json({
    authenticated: false,
    message: 'Session is not valid or has expired',
  });
});

module.exports = router;
