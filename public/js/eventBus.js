/**
 * Event Bus
 * Phase 4 - Frontend Modernization: Event Bus Pattern
 *
 * Lightweight pub/sub event system for component communication
 * Decouples components and enables reactive state management
 *
 * Benefits:
 * - Components don't need to know about each other
 * - Centralized event management
 * - Easy to test and debug
 * - Reduces global namespace pollution
 */

/* eslint-disable no-console */

/**
 * EventBus class - Pub/Sub pattern implementation
 */
class EventBus {
  constructor() {
    this.events = new Map();
    this.debugMode = false;
  }

  /**
   * Subscribe to an event
   * @param {string} eventName - Event name
   * @param {function} handler - Event handler function
   * @returns {function} Unsubscribe function
   */
  on(eventName, handler) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }

    this.events.get(eventName).push(handler);

    if (this.debugMode) {
      console.log(`📡 EventBus: Subscribed to "${eventName}"`);
    }

    // Return unsubscribe function for convenience
    return () => this.off(eventName, handler);
  }

  /**
   * Unsubscribe from an event
   * @param {string} eventName - Event name
   * @param {function} handler - Event handler to remove
   */
  off(eventName, handler) {
    if (!this.events.has(eventName)) return;

    const handlers = this.events.get(eventName);
    const index = handlers.indexOf(handler);

    if (index > -1) {
      handlers.splice(index, 1);
      if (this.debugMode) {
        console.log(`📡 EventBus: Unsubscribed from "${eventName}"`);
      }
    }
  }

  /**
   * Emit an event
   * @param {string} eventName - Event name
   * @param {*} data - Event data (can be any type)
   */
  emit(eventName, data) {
    if (this.debugMode) {
      console.log(`📡 EventBus: Emitting "${eventName}"`, data);
    }

    if (!this.events.has(eventName)) {
      if (this.debugMode) {
        console.log(`📡 EventBus: No subscribers for "${eventName}"`);
      }
      return;
    }

    const handlers = this.events.get(eventName);
    handlers.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for "${eventName}":`, error);
      }
    });
  }

  /**
   * Subscribe to an event, but only fire once
   * @param {string} eventName - Event name
   * @param {function} handler - Event handler function
   * @returns {function} Unsubscribe function
   */
  once(eventName, handler) {
    const onceHandler = (data) => {
      handler(data);
      this.off(eventName, onceHandler);
    };

    return this.on(eventName, onceHandler);
  }

  /**
   * Clear all handlers for an event
   * @param {string} eventName - Event name (optional, clears all if not provided)
   */
  clear(eventName) {
    if (eventName) {
      this.events.delete(eventName);
      if (this.debugMode) {
        console.log(`📡 EventBus: Cleared all handlers for "${eventName}"`);
      }
    } else {
      this.events.clear();
      if (this.debugMode) {
        console.log('📡 EventBus: Cleared all handlers');
      }
    }
  }

  /**
   * Enable or disable debug mode
   * @param {boolean} enabled - Enable debug mode
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
    console.log(`📡 EventBus: Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get all registered event names
   * @returns {string[]} Array of event names
   */
  getEventNames() {
    return Array.from(this.events.keys());
  }

  /**
   * Get subscriber count for an event
   * @param {string} eventName - Event name
   * @returns {number} Number of subscribers
   */
  getSubscriberCount(eventName) {
    return this.events.has(eventName) ? this.events.get(eventName).length : 0;
  }

  /**
   * Get all subscribers for debugging
   * @returns {object} Map of event names to subscriber counts
   */
  getDebugInfo() {
    const info = {};
    this.events.forEach((handlers, eventName) => {
      info[eventName] = handlers.length;
    });
    return info;
  }
}

/**
 * Standard Event Types
 * Centralized registry of all application events
 */
export const EventTypes = {
  // Sidebar events
  SIDEBAR_OPENED: 'sidebar:opened',
  SIDEBAR_CLOSED: 'sidebar:closed',
  SIDEBAR_CONTENT_LOADED: 'sidebar:contentLoaded',
  SIDEBAR_HISTORY_CHANGED: 'sidebar:historyChanged',

  // Notification events
  NOTIFICATION_RECEIVED: 'notification:received',
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_DELETED: 'notification:deleted',
  NOTIFICATION_COUNT_CHANGED: 'notification:countChanged',

  // Trip events
  TRIP_CREATED: 'trip:created',
  TRIP_UPDATED: 'trip:updated',
  TRIP_DELETED: 'trip:deleted',
  TRIP_SELECTED: 'trip:selected',

  // Item events (flights, hotels, transportation, etc.)
  ITEM_CREATED: 'item:created',
  ITEM_UPDATED: 'item:updated',
  ITEM_DELETED: 'item:deleted',

  // Companion events
  COMPANION_ADDED: 'companion:added',
  COMPANION_REMOVED: 'companion:removed',
  COMPANION_UPDATED: 'companion:updated',

  // Voucher events
  VOUCHER_CREATED: 'voucher:created',
  VOUCHER_UPDATED: 'voucher:updated',
  VOUCHER_DELETED: 'voucher:deleted',
  VOUCHER_ATTACHED: 'voucher:attached',
  VOUCHER_DETACHED: 'voucher:detached',

  // User events
  USER_LOGGED_IN: 'user:loggedIn',
  USER_LOGGED_OUT: 'user:loggedOut',
  USER_UPDATED: 'user:updated',

  // Form events
  FORM_SUBMITTED: 'form:submitted',
  FORM_VALIDATION_FAILED: 'form:validationFailed',
  FORM_RESET: 'form:reset',

  // Map events
  MAP_LOADED: 'map:loaded',
  MAP_MARKER_CLICKED: 'map:markerClicked',
  MAP_BOUNDS_CHANGED: 'map:boundsChanged',

  // Socket events
  SOCKET_CONNECTED: 'socket:connected',
  SOCKET_DISCONNECTED: 'socket:disconnected',
  SOCKET_ERROR: 'socket:error',
  SOCKET_RECONNECTED: 'socket:reconnected',

  // UI events
  MODAL_OPENED: 'modal:opened',
  MODAL_CLOSED: 'modal:closed',
  TOAST_SHOWN: 'toast:shown',
  LOADING_STARTED: 'loading:started',
  LOADING_FINISHED: 'loading:finished',

  // Data sync events
  DATA_SYNCED: 'data:synced',
  DATA_SYNC_FAILED: 'data:syncFailed',
  DATA_INVALIDATED: 'data:invalidated',
};

// Create singleton instance
const eventBus = new EventBus();

// Export singleton instance and EventBus class
export { eventBus, EventBus };

// Make available globally for backward compatibility and ease of use
if (typeof window !== 'undefined') {
  window.eventBus = eventBus;
  window.EventBus = EventBus;
  window.EventTypes = EventTypes;
}

export default eventBus;
