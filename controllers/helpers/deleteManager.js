// Delete manager - handles soft delete and restore functionality
const logger = require('../utils/logger');
// Uses session to store deleted items for undo capability
const logger = require('../utils/logger');
// Timeouts stored separately to avoid JSON serialization issues
const logger = require('../utils/logger');

const logger = require('../utils/logger');
const DELETED_ITEMS_KEY = 'deletedItems';
const logger = require('../utils/logger');
const DELETE_TIMEOUT = 30 * 1000; // 30 seconds before permanent deletion
const logger = require('../utils/logger');

const logger = require('../utils/logger');
// Track timeouts in memory (separate from session)
const logger = require('../utils/logger');
const timeoutMap = new Map();
const logger = require('../utils/logger');

const logger = require('../utils/logger');
/**
const logger = require('../utils/logger');
 * Store a deleted item in session for potential restoration
const logger = require('../utils/logger');
 * @param {Object} session - Express session object
const logger = require('../utils/logger');
 * @param {string} itemType - Type of item (event, flight, hotel, etc)
const logger = require('../utils/logger');
 * @param {string} itemId - ID of the item
const logger = require('../utils/logger');
 * @param {Object} itemData - Full item data to restore
const logger = require('../utils/logger');
 * @param {string} itemName - Display name of the item
const logger = require('../utils/logger');
 */
const logger = require('../utils/logger');
function storeDeletedItem(session, itemType, itemId, itemData, itemName) {
const logger = require('../utils/logger');
  if (!session[DELETED_ITEMS_KEY]) {
const logger = require('../utils/logger');
    session[DELETED_ITEMS_KEY] = {};
const logger = require('../utils/logger');
  }
const logger = require('../utils/logger');

const logger = require('../utils/logger');
  const key = `${itemType}:${itemId}`;
const logger = require('../utils/logger');
  const sessionId = session.id;
const logger = require('../utils/logger');

const logger = require('../utils/logger');
  // Store item data (without timeout object)
const logger = require('../utils/logger');
  session[DELETED_ITEMS_KEY][key] = {
const logger = require('../utils/logger');
    itemType,
const logger = require('../utils/logger');
    itemId,
const logger = require('../utils/logger');
    itemData,
const logger = require('../utils/logger');
    itemName,
const logger = require('../utils/logger');
    deletedAt: new Date().toISOString()
const logger = require('../utils/logger');
  };
const logger = require('../utils/logger');

const logger = require('../utils/logger');
  // Store timeout separately in memory map
const logger = require('../utils/logger');
  const timeoutKey = `${sessionId}:${key}`;
const logger = require('../utils/logger');
  const existingTimeout = timeoutMap.get(timeoutKey);
const logger = require('../utils/logger');
  if (existingTimeout) {
const logger = require('../utils/logger');
    clearTimeout(existingTimeout);
const logger = require('../utils/logger');
  }
const logger = require('../utils/logger');

const logger = require('../utils/logger');
  timeoutMap.set(
const logger = require('../utils/logger');
    timeoutKey,
const logger = require('../utils/logger');
    setTimeout(() => {
const logger = require('../utils/logger');
      // Clean up timeout from map
const logger = require('../utils/logger');
      timeoutMap.delete(timeoutKey);
const logger = require('../utils/logger');
      // Clean up from session if it still exists
const logger = require('../utils/logger');
      if (session[DELETED_ITEMS_KEY] && session[DELETED_ITEMS_KEY][key]) {
const logger = require('../utils/logger');
        delete session[DELETED_ITEMS_KEY][key];
const logger = require('../utils/logger');
        session.save((err) => {
const logger = require('../utils/logger');
          if (err) logger.error('Error saving session after timeout:', err);
const logger = require('../utils/logger');
        });
const logger = require('../utils/logger');
      }
const logger = require('../utils/logger');
    }, DELETE_TIMEOUT)
const logger = require('../utils/logger');
  );
const logger = require('../utils/logger');

const logger = require('../utils/logger');
  session.save();
const logger = require('../utils/logger');
}
const logger = require('../utils/logger');

const logger = require('../utils/logger');
/**
const logger = require('../utils/logger');
 * Retrieve and remove a deleted item from session
const logger = require('../utils/logger');
 * @param {Object} session - Express session object
const logger = require('../utils/logger');
 * @param {string} itemType - Type of item
const logger = require('../utils/logger');
 * @param {string} itemId - ID of the item
const logger = require('../utils/logger');
 * @returns {Object|null} - The deleted item data or null if not found
const logger = require('../utils/logger');
 */
const logger = require('../utils/logger');
function retrieveDeletedItem(session, itemType, itemId) {
const logger = require('../utils/logger');
  if (!session[DELETED_ITEMS_KEY]) {
const logger = require('../utils/logger');
    return null;
const logger = require('../utils/logger');
  }
const logger = require('../utils/logger');

const logger = require('../utils/logger');
  const key = `${itemType}:${itemId}`;
const logger = require('../utils/logger');
  const deletedItem = session[DELETED_ITEMS_KEY][key];
const logger = require('../utils/logger');

const logger = require('../utils/logger');
  if (deletedItem) {
const logger = require('../utils/logger');
    // Clear the timeout
const logger = require('../utils/logger');
    const timeoutKey = `${session.id}:${key}`;
const logger = require('../utils/logger');
    const timeout = timeoutMap.get(timeoutKey);
const logger = require('../utils/logger');
    if (timeout) {
const logger = require('../utils/logger');
      clearTimeout(timeout);
const logger = require('../utils/logger');
      timeoutMap.delete(timeoutKey);
const logger = require('../utils/logger');
    }
const logger = require('../utils/logger');

const logger = require('../utils/logger');
    // Remove from session
const logger = require('../utils/logger');
    delete session[DELETED_ITEMS_KEY][key];
const logger = require('../utils/logger');
    session.save();
const logger = require('../utils/logger');

const logger = require('../utils/logger');
    return deletedItem;
const logger = require('../utils/logger');
  }
const logger = require('../utils/logger');

const logger = require('../utils/logger');
  return null;
const logger = require('../utils/logger');
}
const logger = require('../utils/logger');

const logger = require('../utils/logger');
/**
const logger = require('../utils/logger');
 * Check if a deleted item exists in session
const logger = require('../utils/logger');
 * @param {Object} session - Express session object
const logger = require('../utils/logger');
 * @param {string} itemType - Type of item
const logger = require('../utils/logger');
 * @param {string} itemId - ID of the item
const logger = require('../utils/logger');
 * @returns {boolean}
const logger = require('../utils/logger');
 */
const logger = require('../utils/logger');
function hasDeletedItem(session, itemType, itemId) {
const logger = require('../utils/logger');
  if (!session[DELETED_ITEMS_KEY]) {
const logger = require('../utils/logger');
    return false;
const logger = require('../utils/logger');
  }
const logger = require('../utils/logger');

const logger = require('../utils/logger');
  const key = `${itemType}:${itemId}`;
const logger = require('../utils/logger');
  return !!session[DELETED_ITEMS_KEY][key];
const logger = require('../utils/logger');
}
const logger = require('../utils/logger');

const logger = require('../utils/logger');
module.exports = {
const logger = require('../utils/logger');
  storeDeletedItem,
const logger = require('../utils/logger');
  retrieveDeletedItem,
const logger = require('../utils/logger');
  hasDeletedItem
const logger = require('../utils/logger');
};
const logger = require('../utils/logger');
