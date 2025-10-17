/**
 * Middleware to handle sidebar content rendering
 * If X-Sidebar-Request header is present, render without full layout
 */

exports.setSidebarFlag = (req, res, next) => {
  res.locals.isSidebarRequest = req.get('X-Sidebar-Request') === 'true';
  next();
};
