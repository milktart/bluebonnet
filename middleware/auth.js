module.exports = {
  ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    req.session.returnTo = req.originalUrl;
    req.flash('error_msg', 'Please log in to view this resource');
    res.redirect('/auth/login');
  },

  forwardAuthenticated(req, res, next) {
    if (!req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
  },

  requireAdmin(req, res, next) {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    return next();
  },
};
