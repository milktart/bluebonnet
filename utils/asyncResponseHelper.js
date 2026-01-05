const {
  redirectAfterSuccess,
  redirectAfterError,
} = require('../controllers/helpers/resourceController');

/**
 * Handle both async AJAX and traditional form submission responses
 * Eliminates 56+ duplicate conditionals across controllers
 */
function sendAsyncResponse(res, success, data, message, tripId, req, tab) {
  const isAsync = req.headers['x-async-request'] === 'true';

  if (isAsync) {
    return res.status(success ? 200 : 500).json({
      success,
      data: success ? data : null,
      message,
    });
  }

  if (success) {
    redirectAfterSuccess(res, req, tripId, tab, message);
  } else {
    redirectAfterError(res, req, tripId, message);
  }
}

module.exports = { sendAsyncResponse };
