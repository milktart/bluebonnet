/**
 * Centralized async request detection and response handling
 * Eliminates repetitive `const isAsync = req.headers['x-async-request'] === 'true'` patterns
 * Provides single point for consistency across all CRUD endpoints
 */

/**
 * Check if request is async (AJAX)
 * @param {Object} req - Express request object
 * @returns {boolean} true if X-Async-Request header is 'true'
 */
function isAsyncRequest(req) {
  return req.get('X-Async-Request') === 'true';
}

/**
 * Send success response (async JSON or redirect)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} options - Response options
 * @param {*} options.data - Data to return in success response
 * @param {string} options.message - Success message
 * @param {number} [options.status=200] - HTTP status code
 * @param {string} [options.redirectUrl] - URL to redirect to if not async
 * @returns {void}
 */
function sendSuccess(req, res, options = {}) {
  const {
    data,
    message = 'Operation completed successfully',
    status = 200,
    redirectUrl = '/',
  } = options;

  const isAsync = isAsyncRequest(req);

  if (isAsync) {
    return res.status(status).json({
      success: true,
      data,
      message,
    });
  }

  // For non-async requests, store message and redirect
  if (message) {
    req.session.successMessage = message;
  }
  return res.redirect(redirectUrl);
}

/**
 * Send error response (async JSON or redirect)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} options - Response options
 * @param {string} options.error - Error message to display
 * @param {string} [options.message] - Additional message text
 * @param {number} [options.status=400] - HTTP status code
 * @param {string} [options.redirectUrl] - URL to redirect to if not async
 * @returns {void}
 */
function sendError(req, res, options = {}) {
  const {
    error = 'An error occurred',
    message,
    status = 400,
    redirectUrl = '/',
  } = options;

  const isAsync = isAsyncRequest(req);

  if (isAsync) {
    return res.status(status).json({
      success: false,
      error,
      message,
    });
  }

  // For non-async requests, store error and redirect
  if (error) {
    req.session.errorMessage = error;
  }
  return res.redirect(redirectUrl);
}

/**
 * Unified response handler for both success and error cases
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} options - Response options
 * @param {boolean} [options.success=true] - Whether this is a success or error
 * @param {*} [options.data] - Data to return on success
 * @param {string} [options.message] - Message to display
 * @param {string} [options.error] - Error message on failure
 * @param {number} [options.status=200] - HTTP status code
 * @param {string} [options.redirectUrl] - URL to redirect to if not async
 * @returns {void}
 */
function sendAsyncOrRedirect(req, res, options = {}) {
  const {
    success = true,
    data,
    message,
    error,
    status = success ? 200 : 400,
    redirectUrl = '/',
  } = options;

  if (success) {
    return sendSuccess(req, res, { data, message, status, redirectUrl });
  } else {
    return sendError(req, res, { error, message, status, redirectUrl });
  }
}

module.exports = {
  isAsyncRequest,
  sendSuccess,
  sendError,
  sendAsyncOrRedirect,
};
