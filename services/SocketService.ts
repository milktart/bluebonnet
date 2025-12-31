/**
 * WebSocket Service
 * Manages Socket.IO connections and real-time events
 * Phase 4 - Frontend Modernization: Replace polling with WebSockets
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import logger from '../utils/logger';
import { MS_PER_MINUTE } from '../utils/constants';

// WebSocket configuration
const SOCKET_PING_TIMEOUT = parseInt(process.env.SOCKET_PING_TIMEOUT || '', 10) || MS_PER_MINUTE;
const SOCKET_PING_INTERVAL = parseInt(process.env.SOCKET_PING_INTERVAL || '', 10) || 25000;

let io: SocketIOServer | null = null;
const userSocketMap = new Map<string | number, string>(); // userId -> socketId mapping

interface NotificationData {
  id: string | number;
  type: string;
  message: string;
  relatedId?: string | number;
  relatedType?: string;
  actionRequired?: boolean;
  read?: boolean;
  createdAt?: Date;
}

interface NotificationUpdates {
  [key: string]: any;
}

interface TripUpdateData {
  [key: string]: any;
}

/**
 * Initialize Socket.IO server
 */
export function initialize(
  server: any,
  sessionMiddleware: any,
  passport: any
): SocketIOServer | null {
  io = new SocketIOServer(server, {
    cors: {
      origin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        // If CORS_ORIGIN is set, use it; otherwise allow the request origin
        const allowedOrigin = process.env.CORS_ORIGIN || origin;
        callback(null, allowedOrigin as any);
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
    // Allow all transports
    transports: ['websocket', 'polling'],
    // Connection settings
    pingTimeout: SOCKET_PING_TIMEOUT,
    pingInterval: SOCKET_PING_INTERVAL,
    // Allow upgrades from polling to websocket
    allowUpgrades: true,
  });

  // Wrap session middleware for Socket.IO
  io.use((socket: Socket, next: (err?: Error) => void) => {
    sessionMiddleware(socket.request, {}, next);
  });

  // Wrap passport initialization for Socket.IO
  io.use((socket: Socket, next: (err?: Error) => void) => {
    passport.initialize()(socket.request, {}, next);
  });

  io.use((socket: Socket, next: (err?: Error) => void) => {
    passport.session()(socket.request, {}, next);
  });

  // Authentication middleware - extract user from session
  io.use((socket: Socket, next: (err?: Error) => void) => {
    const { request } = socket;

    // Access session through socket handshake
    if ((request as any).user) {
      (socket as any).userId = (request as any).user.id;
      logger.debug('WebSocket authenticated', { userId: (socket as any).userId, socketId: socket.id });
      next();
    } else {
      // Allow connection but mark as unauthenticated
      logger.debug('WebSocket connection without authentication', { socketId: socket.id });
      next();
    }
  });

  // Connection handler
  io.on('connection', (socket: Socket) => {
    logger.info('WebSocket client connected', {
      socketId: socket.id,
      userId: (socket as any).userId,
    });

    // Store user-socket mapping for authenticated users
    if ((socket as any).userId) {
      userSocketMap.set((socket as any).userId, socket.id);

      // Join user-specific room for targeted events
      socket.join(`user:${(socket as any).userId}`);
    }

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info('WebSocket client disconnected', {
        socketId: socket.id,
        userId: (socket as any).userId,
      });

      // Remove from user mapping
      if ((socket as any).userId) {
        userSocketMap.delete((socket as any).userId);
      }
    });

    // Handle client errors
    socket.on('error', (error: any) => {
      logger.error('WebSocket error', {
        socketId: socket.id,
        userId: (socket as any).userId,
        error: error.message,
      });
    });

    // Client-initiated ping for connection testing
    socket.on('ping', (callback: (data: any) => void) => {
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
 */
export function emitNotification(userId: string | number, notification: NotificationData): void {
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
 */
export function emitNotificationUpdate(
  userId: string | number,
  notificationId: string | number,
  updates: NotificationUpdates
): void {
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
 */
export function emitNotificationDeleted(userId: string | number, notificationId: string | number): void {
  if (!io) {
    logger.warn('Socket.IO not initialized, cannot emit notification deletion');
    return;
  }

  io.to(`user:${userId}`).emit('notification:deleted', { id: notificationId });

  logger.debug('Notification deletion emitted', { userId, notificationId });
}

/**
 * Emit trip update event
 */
export function emitTripUpdate(tripId: string | number, data: TripUpdateData): void {
  if (!io) return;

  io.to(`trip:${tripId}`).emit('trip:updated', data);
  logger.debug('Trip update emitted', { tripId });
}

/**
 * Get Socket.IO instance
 */
export function getIO(): SocketIOServer | null {
  return io;
}

/**
 * Get socket ID for a specific user
 */
export function getUserSocket(userId: string | number): string | null {
  return userSocketMap.get(userId) || null;
}

/**
 * Check if user is connected
 */
export function isUserConnected(userId: string | number): boolean {
  return userSocketMap.has(userId);
}

export default {
  initialize,
  emitNotification,
  emitNotificationUpdate,
  emitNotificationDeleted,
  emitTripUpdate,
  getIO,
  getUserSocket,
  isUserConnected,
};
