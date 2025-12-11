/**
 * WebSocket Client
 * Manages Socket.IO connection and real-time events
 * Phase 4 - Frontend Modernization: Replace polling with WebSockets & Event Bus
 */

/* global io */
/* eslint-disable no-console */

import { eventBus, EventTypes } from './eventBus.js';

// Import constants
const {
  SOCKET_POLL_INTERVAL,
  SOCKET_RECONNECT_DELAY,
  SOCKET_RECONNECT_DELAY_MAX,
} = window.CONSTANTS || {};

// Import Socket.IO client library (loaded via CDN in base template)
let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Wait for Socket.IO library to load
 * @returns {Promise} Resolves when io is available
 */
function waitForSocketIO() {
  return new Promise((resolve, reject) => {
    if (typeof io !== 'undefined') {
      resolve();
      return;
    }

    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait
    const checkInterval = setInterval(() => {
      attempts += 1;
      if (typeof io !== 'undefined') {
        clearInterval(checkInterval);
        resolve();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        reject(new Error('Socket.IO library failed to load'));
      }
    }, SOCKET_POLL_INTERVAL || 100);
  });
}

/**
 * Initialize WebSocket connection
 * @returns {Promise<object>} Socket.IO client instance
 */
export async function initializeSocket() {
  if (socket && socket.connected) {
    return socket;
  }

  // Wait for Socket.IO library to load
  try {
    await waitForSocketIO();
  } catch (error) {
    throw error;
  }

  // Connect to Socket.IO server (same origin)
  // Note: Using polling transport until reverse proxy is configured for WebSocket
  socket = io({
    transports: ['polling'], // Use polling-only until nginx/proxy supports WebSocket
    reconnection: true,
    reconnectionDelay: SOCKET_RECONNECT_DELAY || 1000,
    reconnectionDelayMax: SOCKET_RECONNECT_DELAY_MAX || 5000,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
  });

  // Connection event handlers
  socket.on('connect', () => {
    reconnectAttempts = 0;

    // Emit event bus notification
    eventBus.emit(EventTypes.SOCKET_CONNECTED, { socketId: socket.id });

    // Emit any queued events after reconnection
    if (window.socketEventQueue && window.socketEventQueue.length > 0) {
      window.socketEventQueue.forEach((event) => {
        socket.emit(event.name, event.data);
      });
      window.socketEventQueue = [];
    }
  });

  socket.on('disconnect', (reason) => {
    // Emit event bus notification
    eventBus.emit(EventTypes.SOCKET_DISCONNECTED, { reason });
  });

  socket.on('connect_error', (error) => {
    reconnectAttempts += 1;

    // Emit event bus notification
    eventBus.emit(EventTypes.SOCKET_ERROR, { error: error.message, attempts: reconnectAttempts });

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      // Could implement fallback to polling here if needed
    }
  });

  socket.on('reconnect', (attemptNumber) => {
    // Emit event bus notification
    eventBus.emit(EventTypes.SOCKET_RECONNECTED, { attemptNumber });
  });

  socket.on('reconnect_failed', () => {
    // Emit event bus notification
    eventBus.emit(EventTypes.SOCKET_ERROR, { error: 'Reconnection failed' });
  });

  return socket;
}

/**
 * Get current socket instance
 * @returns {object|null} Socket.IO client instance
 */
export function getSocket() {
  return socket;
}

/**
 * Disconnect WebSocket
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Emit event to server
 * @param {string} eventName - Event name
 * @param {object} data - Event data
 */
export function emitEvent(eventName, data) {
  if (socket && socket.connected) {
    socket.emit(eventName, data);
  } else {
    // Queue event for when connection is restored
    if (!window.socketEventQueue) {
      window.socketEventQueue = [];
    }
    window.socketEventQueue.push({ name: eventName, data });
  }
}

/**
 * Listen for event from server
 * @param {string} eventName - Event name
 * @param {function} handler - Event handler function
 */
export function onEvent(eventName, handler) {
  if (!socket) {
    initializeSocket();
  }
  socket.on(eventName, handler);
}

/**
 * Remove event listener
 * @param {string} eventName - Event name
 * @param {function} handler - Event handler function (optional)
 */
export function offEvent(eventName, handler) {
  if (socket) {
    socket.off(eventName, handler);
  }
}

// Make functions available globally for backward compatibility
if (typeof window !== 'undefined') {
  window.initializeSocket = initializeSocket;
  window.getSocket = getSocket;
  window.disconnectSocket = disconnectSocket;
  window.emitSocketEvent = emitEvent;
  window.onSocketEvent = onEvent;
  window.offSocketEvent = offEvent;
}
