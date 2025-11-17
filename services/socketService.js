/**
 * WebSocket Service
 * Manages Socket.IO connections and real-time events
 * Phase 4 - Frontend Modernization: Replace polling with WebSockets
 */

const { Server } = require('socket.io');
const logger = require('../utils/logger');

let io = null;
const userSocketMap = new Map(); // userId -> socketId mapping

/**
 * Initialize Socket.IO server
 * @param {object} server - HTTP server instance
 * @param {function} sessionMiddleware - Express session middleware
 * @param {object} passport - Passport instance
 */
function initialize(server, sessionMiddleware, passport) {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
    },
    // Connection settings
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Wrap session middleware for Socket.IO
  io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
  });

  // Wrap passport initialization for Socket.IO
  io.use((socket, next) => {
    passport.initialize()(socket.request, {}, next);
  });

  io.use((socket, next) => {
    passport.session()(socket.request, {}, next);
  });

  // Authentication middleware - extract user from session
  io.use((socket, next) => {
    const { request } = socket;

    // Access session through socket handshake
    if (request.user) {
      socket.userId = request.user.id;
      logger.debug('WebSocket authenticated', { userId: socket.userId, socketId: socket.id });
      next();
    } else {
      // Allow connection but mark as unauthenticated
      logger.debug('WebSocket connection without authentication', { socketId: socket.id });
      next();
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    logger.info('WebSocket client connected', {
      socketId: socket.id,
      userId: socket.userId,
    });

    // Store user-socket mapping for authenticated users
    if (socket.userId) {
      userSocketMap.set(socket.userId, socket.id);

      // Join user-specific room for targeted events
      socket.join(`user:${socket.userId}`);
    }

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info('WebSocket client disconnected', {
        socketId: socket.id,
        userId: socket.userId,
      });

      // Remove from user mapping
      if (socket.userId) {
        userSocketMap.delete(socket.userId);
      }
    });

    // Handle client errors
    socket.on('error', (error) => {
      logger.error('WebSocket error', {
        socketId: socket.id,
        userId: socket.userId,
        error: error.message,
      });
    });

    // Client-initiated ping for connection testing
    socket.on('ping', (callback) => {
      if (typeof callback === 'function') {
        callback({ timestamp: Date.now() });
      }
    });
  });

  logger.info('Socket.IO server initialized');
  return io;
}

/**
 * Emit notification event to specific user
 * @param {number} userId - User ID to send notification to
 * @param {object} notification - Notification data
 */
function emitNotification(userId, notification) {
  if (!io) {
    logger.warn('Socket.IO not initialized, cannot emit notification');
    return;
  }

  io.to(`user:${userId}`).emit('notification:new', notification);

  logger.debug('Notification emitted', {
    userId,
    notificationId: notification.id,
    type: notification.type,
  });
}

/**
 * Emit notification update (e.g., marked as read)
 * @param {number} userId - User ID
 * @param {number} notificationId - Notification ID
 * @param {object} updates - Updated fields
 */
function emitNotificationUpdate(userId, notificationId, updates) {
  if (!io) {
    logger.warn('Socket.IO not initialized, cannot emit notification update');
    return;
  }

  io.to(`user:${userId}`).emit('notification:updated', {
    id: notificationId,
    ...updates,
  });

  logger.debug('Notification update emitted', { userId, notificationId, updates });
}

/**
 * Emit notification deletion
 * @param {number} userId - User ID
 * @param {number} notificationId - Notification ID
 */
function emitNotificationDeleted(userId, notificationId) {
  if (!io) {
    logger.warn('Socket.IO not initialized, cannot emit notification deletion');
    return;
  }

  io.to(`user:${userId}`).emit('notification:deleted', { id: notificationId });

  logger.debug('Notification deletion emitted', { userId, notificationId });
}

/**
 * Emit trip update event
 * @param {number} tripId - Trip ID
 * @param {object} data - Trip update data
 */
function emitTripUpdate(tripId, data) {
  if (!io) return;

  io.to(`trip:${tripId}`).emit('trip:updated', data);
  logger.debug('Trip update emitted', { tripId });
}

/**
 * Get Socket.IO instance
 * @returns {object|null} Socket.IO server instance
 */
function getIO() {
  return io;
}

/**
 * Get socket ID for a specific user
 * @param {number} userId - User ID
 * @returns {string|null} Socket ID or null if not connected
 */
function getUserSocket(userId) {
  return userSocketMap.get(userId) || null;
}

/**
 * Check if user is connected
 * @param {number} userId - User ID
 * @returns {boolean} True if user has active WebSocket connection
 */
function isUserConnected(userId) {
  return userSocketMap.has(userId);
}

module.exports = {
  initialize,
  emitNotification,
  emitNotificationUpdate,
  emitNotificationDeleted,
  emitTripUpdate,
  getIO,
  getUserSocket,
  isUserConnected,
};
