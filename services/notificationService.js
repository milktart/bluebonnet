/**
 * Notification Service
 * Handles notification creation and WebSocket emission
 * Phase 4 - Frontend Modernization: WebSocket Integration
 */

const db = require('../models');
const logger = require('../utils/logger');
const socketService = require('./socketService');

/**
 * Create a notification and emit via WebSocket
 * @param {object} data - Notification data
 * @returns {Promise<object>} Created notification
 */
async function createNotification(data) {
  try {
    const notification = await db.Notification.create(data);

    // Emit WebSocket event to user
    socketService.emitNotification(data.userId, {
      id: notification.id,
      type: notification.type,
      message: notification.message,
      relatedId: notification.relatedId,
      relatedType: notification.relatedType,
      actionRequired: notification.actionRequired,
      read: notification.read,
      createdAt: notification.createdAt,
    });

    logger.debug('Notification created and emitted', {
      userId: data.userId,
      notificationId: notification.id,
      type: data.type,
    });

    return notification;
  } catch (error) {
    logger.error('Error creating notification', { error: error.message, data });
    throw error;
  }
}

/**
 * Create multiple notifications and emit via WebSocket
 * @param {Array<object>} notificationsData - Array of notification data
 * @returns {Promise<Array<object>>} Created notifications
 */
async function createNotifications(notificationsData) {
  try {
    const notifications = await db.Notification.bulkCreate(notificationsData);

    // Emit WebSocket events for each notification
    notifications.forEach((notification, index) => {
      const data = notificationsData[index];
      socketService.emitNotification(data.userId, {
        id: notification.id,
        type: notification.type,
        message: notification.message,
        relatedId: notification.relatedId,
        relatedType: notification.relatedType,
        actionRequired: notification.actionRequired,
        read: notification.read,
        createdAt: notification.createdAt,
      });
    });

    logger.debug('Multiple notifications created and emitted', {
      count: notifications.length,
    });

    return notifications;
  } catch (error) {
    logger.error('Error creating notifications', { error: error.message });
    throw error;
  }
}

module.exports = {
  createNotification,
  createNotifications,
};
