const logger = require('./logger');

/**
 * Safely parse companions from form data or array
 * Eliminates 8+ duplicate parsing blocks across controllers
 */
function parseCompanions(companions) {
  if (!companions) return [];

  try {
    const parsed = typeof companions === 'string' ? JSON.parse(companions) : companions;
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    logger.error('Error parsing companions:', error);
    return [];
  }
}

module.exports = { parseCompanions };
