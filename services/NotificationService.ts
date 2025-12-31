/**
 * Notification Service
 * Handles notification creation and WebSocket emission
 * Phase 4 - Frontend Modernization: WebSocket Integration
 */

import db from '../models';
import logger from '../utils/logger';
import socketService from './SocketService';

interface NotificationData {
  userId: string | number;
  type: string;
  message: string;
  relatedId?: string | number;
  relatedType?: string;
  actionRequired?: boolean;
  read?: boolean;
  [key: string]: any;
}

interface NotificationEmitData {
  id: string | number;
  type: string;
  message: string;
  relatedId?: string | number;
  relatedType?: string;
  actionRequired?: boolean;
  read?: boolean;
  createdAt?: Date;
}

/**
 * Create a notification and emit via WebSocket
 */
export async function createNotification(data: NotificationData): Promise<any> {
  try {
    const notification = await (db as any).Notification.create(data);

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
    } as NotificationEmitData);

    logger.debug('Notification created and emitted', {
      userId: data.userId,
      notificationId: notification.id,
      type: data.type,
    });

    return notification;
  } catch (error) {
    logger.error('Error creating notification', { error: (error as Error).message, data });
    throw error;
  }
}

/**
 * Create multiple notifications and emit via WebSocket
 */
export async function createNotifications(notificationsData: NotificationData[]): Promise<any[]> {
  try {
    const notifications = await (db as any).Notification.bulkCreate(notificationsData);

    // Emit WebSocket events for each notification
    notifications.forEach((notification: any, index: number) => {
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
      } as NotificationEmitData);
    });

    logger.debug('Multiple notifications created and emitted', {
      count: notifications.length,
    });

    return notifications;
  } catch (error) {
    logger.error('Error creating notifications', { error: (error as Error).message });
    throw error;
  }
}

export default {
  createNotification,
  createNotifications,
};
