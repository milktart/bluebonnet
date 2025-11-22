const notificationService = require('../../../services/notificationService');
const db = require('../../../models');
const logger = require('../../../utils/logger');
const socketService = require('../../../services/socketService');

// Mock dependencies
jest.mock('../../../models', () => ({
  Notification: {
    create: jest.fn(),
    bulkCreate: jest.fn(),
  },
}));

jest.mock('../../../utils/logger', () => ({
  debug: jest.fn(),
  error: jest.fn(),
}));

jest.mock('../../../services/socketService', () => ({
  emitNotification: jest.fn(),
}));

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification and emit via WebSocket', async () => {
      const notificationData = {
        userId: 'user-123',
        type: 'trip_updated',
        message: 'Your trip has been updated',
        relatedId: 'trip-456',
        relatedType: 'Trip',
        actionRequired: false,
        read: false,
      };

      const mockNotification = {
        id: 'notification-789',
        ...notificationData,
        createdAt: new Date('2025-01-15T10:00:00Z'),
      };

      db.Notification.create.mockResolvedValue(mockNotification);

      const result = await notificationService.createNotification(notificationData);

      expect(db.Notification.create).toHaveBeenCalledWith(notificationData);
      expect(db.Notification.create).toHaveBeenCalledTimes(1);

      expect(socketService.emitNotification).toHaveBeenCalledWith('user-123', {
        id: 'notification-789',
        type: 'trip_updated',
        message: 'Your trip has been updated',
        relatedId: 'trip-456',
        relatedType: 'Trip',
        actionRequired: false,
        read: false,
        createdAt: mockNotification.createdAt,
      });

      expect(logger.debug).toHaveBeenCalledWith('Notification created and emitted', {
        userId: 'user-123',
        notificationId: 'notification-789',
        type: 'trip_updated',
      });

      expect(result).toEqual(mockNotification);
    });

    it('should handle database errors', async () => {
      const notificationData = {
        userId: 'user-123',
        type: 'test',
        message: 'Test message',
      };

      const error = new Error('Database error');
      db.Notification.create.mockRejectedValue(error);

      await expect(notificationService.createNotification(notificationData)).rejects.toThrow('Database error');

      expect(logger.error).toHaveBeenCalledWith('Error creating notification', {
        error: 'Database error',
        data: notificationData,
      });

      expect(socketService.emitNotification).not.toHaveBeenCalled();
    });

    it('should create notification with minimal data', async () => {
      const notificationData = {
        userId: 'user-999',
        type: 'system',
        message: 'System notification',
      };

      const mockNotification = {
        id: 'notification-111',
        ...notificationData,
        relatedId: null,
        relatedType: null,
        actionRequired: false,
        read: false,
        createdAt: new Date(),
      };

      db.Notification.create.mockResolvedValue(mockNotification);

      const result = await notificationService.createNotification(notificationData);

      expect(result).toEqual(mockNotification);
      expect(socketService.emitNotification).toHaveBeenCalled();
    });
  });

  describe('createNotifications', () => {
    it('should create multiple notifications and emit via WebSocket', async () => {
      const notificationsData = [
        {
          userId: 'user-123',
          type: 'trip_created',
          message: 'New trip created',
          relatedId: 'trip-1',
          relatedType: 'Trip',
          actionRequired: false,
          read: false,
        },
        {
          userId: 'user-456',
          type: 'invitation',
          message: 'You have been invited to a trip',
          relatedId: 'trip-2',
          relatedType: 'Trip',
          actionRequired: true,
          read: false,
        },
      ];

      const mockNotifications = [
        {
          id: 'notification-1',
          ...notificationsData[0],
          createdAt: new Date('2025-01-15T10:00:00Z'),
        },
        {
          id: 'notification-2',
          ...notificationsData[1],
          createdAt: new Date('2025-01-15T10:01:00Z'),
        },
      ];

      db.Notification.bulkCreate.mockResolvedValue(mockNotifications);

      const result = await notificationService.createNotifications(notificationsData);

      expect(db.Notification.bulkCreate).toHaveBeenCalledWith(notificationsData);
      expect(db.Notification.bulkCreate).toHaveBeenCalledTimes(1);

      expect(socketService.emitNotification).toHaveBeenCalledTimes(2);

      expect(socketService.emitNotification).toHaveBeenNthCalledWith(1, 'user-123', {
        id: 'notification-1',
        type: 'trip_created',
        message: 'New trip created',
        relatedId: 'trip-1',
        relatedType: 'Trip',
        actionRequired: false,
        read: false,
        createdAt: mockNotifications[0].createdAt,
      });

      expect(socketService.emitNotification).toHaveBeenNthCalledWith(2, 'user-456', {
        id: 'notification-2',
        type: 'invitation',
        message: 'You have been invited to a trip',
        relatedId: 'trip-2',
        relatedType: 'Trip',
        actionRequired: true,
        read: false,
        createdAt: mockNotifications[1].createdAt,
      });

      expect(logger.debug).toHaveBeenCalledWith('Multiple notifications created and emitted', {
        count: 2,
      });

      expect(result).toEqual(mockNotifications);
    });

    it('should handle empty array', async () => {
      const notificationsData = [];
      db.Notification.bulkCreate.mockResolvedValue([]);

      const result = await notificationService.createNotifications(notificationsData);

      expect(db.Notification.bulkCreate).toHaveBeenCalledWith([]);
      expect(socketService.emitNotification).not.toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith('Multiple notifications created and emitted', {
        count: 0,
      });
      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const notificationsData = [
        {
          userId: 'user-123',
          type: 'test',
          message: 'Test',
        },
      ];

      const error = new Error('Bulk create failed');
      db.Notification.bulkCreate.mockRejectedValue(error);

      await expect(notificationService.createNotifications(notificationsData)).rejects.toThrow('Bulk create failed');

      expect(logger.error).toHaveBeenCalledWith('Error creating notifications', {
        error: 'Bulk create failed',
      });

      expect(socketService.emitNotification).not.toHaveBeenCalled();
    });

    it('should create single notification via bulk method', async () => {
      const notificationsData = [
        {
          userId: 'user-single',
          type: 'reminder',
          message: 'Single reminder',
        },
      ];

      const mockNotifications = [
        {
          id: 'notification-single',
          ...notificationsData[0],
          createdAt: new Date(),
        },
      ];

      db.Notification.bulkCreate.mockResolvedValue(mockNotifications);

      const result = await notificationService.createNotifications(notificationsData);

      expect(result).toEqual(mockNotifications);
      expect(socketService.emitNotification).toHaveBeenCalledTimes(1);
      expect(logger.debug).toHaveBeenCalledWith('Multiple notifications created and emitted', {
        count: 1,
      });
    });
  });
});
