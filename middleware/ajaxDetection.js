/**
 * AJAX Detection Middleware
 * Centralizes AJAX request detection logic
 * Eliminates 12+ duplicate detection patterns in companionController.js
 */

/**
 * Detect if request is an AJAX/async request
 * Checks multiple header patterns for broad compatibility
 *
 * Matches:
 * - X-Sidebar-Request: true (custom header for sidebar loads)
 * - X-Requested-With: XMLHttpRequest (standard AJAX header)
 * - X-Async-Request: true (custom async header)
 * - req.xhr (Express flag for XMLHttpRequest)
 * - Content-Type: application/json (JSON payload typically means AJAX)
 *
 * @param {Object} req - Express request object
 * @returns {boolean} True if request appears to be AJAX
 */
function isAjaxRequest(req) {
  // Check custom headers first (most specific)
  if (req.get('X-Sidebar-Request') === 'true') return true;
  if (req.get('X-Async-Request') === 'true') return true;

  // Check standard AJAX indicators
  if (req.xhr) return true;
  if (req.get('X-Requested-With') === 'XMLHttpRequest') return true;

  // Check content type for JSON requests
  const contentType = req.get('Content-Type') || '';
  if (contentType.includes('application/json')) return true;

  return false;
}

/**
 * Middleware to attach isAjax flag to request
 * Can be used in route handlers to check req.isAjax instead of inline detection
 *
 * Usage:
 *   router.use(ajaxDetection);
 *   // In handler:
 *   if (req.isAjax) {
 *     res.json({ ... });
 *   } else {
 *     res.redirect('/...');
 *   }
 *
 * @returns {Function} Express middleware
 */
function middleware() {
  return (req, res, next) => {
    req.isAjax = isAjaxRequest(req);
    next();
  };
}

module.exports = {
  isAjaxRequest,
  middleware,
};
