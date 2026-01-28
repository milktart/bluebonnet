/**
 * Companion Sorting Service
 * Unified sorting logic for companions across backend and frontend
 *
 * Sorting strategy: current user first, then alphabetically by first name
 */

/**
 * Sort companions with current user/entry first, then alphabetically
 * @param {Array} companions - Array of companion objects
 * @param {string} sortKey - Key to identify current user (email or userId)
 * @param {string} keyField - Field to use for comparison ('email', 'userId')
 * @returns {Array} Sorted array with current user/entry first
 */
function sortCompanions(companions, sortKey, keyField = 'email') {
  if (!Array.isArray(companions) || companions.length === 0) {
    return companions;
  }

  // Find self
  const selfCompanion = companions.find((c) => {
    if (keyField === 'email') {
      return c.email && c.email.toLowerCase() === sortKey.toLowerCase();
    }
    return c[keyField] === sortKey;
  });

  // Get others sorted alphabetically by first name
  const others = companions
    .filter((c) => {
      if (keyField === 'email') {
        return !c.email || c.email.toLowerCase() !== sortKey.toLowerCase();
      }
      return c[keyField] !== sortKey;
    })
    .sort((a, b) => {
      // Extract first name
      const getFirstName = (companion) => {
        if (companion.firstName) {
          return companion.firstName;
        }
        if (companion.name) {
          return companion.name.split(' ')[0];
        }
        return '';
      };

      const firstNameA = getFirstName(a);
      const firstNameB = getFirstName(b);
      return firstNameA.localeCompare(firstNameB);
    });

  // Return self first (if found), then others
  return selfCompanion ? [selfCompanion, ...others] : others;
}

module.exports = {
  sortCompanions,
};
