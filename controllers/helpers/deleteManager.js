// Delete manager - handles soft delete and restore functionality
// Uses session to store deleted items for undo capability
// Timeouts stored separately to avoid JSON serialization issues

const DELETED_ITEMS_KEY = 'deletedItems';
const DELETE_TIMEOUT = 30 * 1000; // 30 seconds before permanent deletion

// Track timeouts in memory (separate from session)
const timeoutMap = new Map();

/**
 * Store a deleted item in session for potential restoration
 * @param {Object} session - Express session object
 * @param {string} itemType - Type of item (event, flight, hotel, etc)
 * @param {string} itemId - ID of the item
 * @param {Object} itemData - Full item data to restore
 * @param {string} itemName - Display name of the item
 */
function storeDeletedItem(session, itemType, itemId, itemData, itemName) {
  if (!session[DELETED_ITEMS_KEY]) {
    session[DELETED_ITEMS_KEY] = {};
  }

  const key = `${itemType}:${itemId}`;
  const sessionId = session.id;

  // Store item data (without timeout object)
  session[DELETED_ITEMS_KEY][key] = {
    itemType,
    itemId,
    itemData,
    itemName,
    deletedAt: new Date().toISOString()
  };

  // Store timeout separately in memory map
  const timeoutKey = `${sessionId}:${key}`;
  const existingTimeout = timeoutMap.get(timeoutKey);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  timeoutMap.set(
    timeoutKey,
    setTimeout(() => {
      // Clean up timeout from map
      timeoutMap.delete(timeoutKey);
      // Clean up from session if it still exists
      if (session[DELETED_ITEMS_KEY] && session[DELETED_ITEMS_KEY][key]) {
        delete session[DELETED_ITEMS_KEY][key];
        session.save((err) => {
          if (err) logger.error('Error saving session after timeout:', err);
        });
      }
    }, DELETE_TIMEOUT)
  );

  session.save();
}

/**
 * Retrieve and remove a deleted item from session
 * @param {Object} session - Express session object
 * @param {string} itemType - Type of item
 * @param {string} itemId - ID of the item
 * @returns {Object|null} - The deleted item data or null if not found
 */
function retrieveDeletedItem(session, itemType, itemId) {
  if (!session[DELETED_ITEMS_KEY]) {
    return null;
  }

  const key = `${itemType}:${itemId}`;
  const deletedItem = session[DELETED_ITEMS_KEY][key];

  if (deletedItem) {
    // Clear the timeout
    const timeoutKey = `${session.id}:${key}`;
    const timeout = timeoutMap.get(timeoutKey);
    if (timeout) {
      clearTimeout(timeout);
      timeoutMap.delete(timeoutKey);
    }

    // Remove from session
    delete session[DELETED_ITEMS_KEY][key];
    session.save();

    return deletedItem;
  }

  return null;
}

/**
 * Check if a deleted item exists in session
 * @param {Object} session - Express session object
 * @param {string} itemType - Type of item
 * @param {string} itemId - ID of the item
 * @returns {boolean}
 */
function hasDeletedItem(session, itemType, itemId) {
  if (!session[DELETED_ITEMS_KEY]) {
    return false;
  }

  const key = `${itemType}:${itemId}`;
  return !!session[DELETED_ITEMS_KEY][key];
}

module.exports = {
  storeDeletedItem,
  retrieveDeletedItem,
  hasDeletedItem
};
