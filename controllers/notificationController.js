const { Op } = require('sequelize');
const db = require('../models');
const logger = require('../utils/logger');
const socketService = require('../services/socketService');

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { read } = req.query;

    const where = { userId };
    if (read !== undefined) {
      where.read = read === 'true';
    }

    const notifications = await db.Notification.findAll({
      where,
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
    });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await db.Notification.count({
      where: {
        userId,
        read: false,
      },
    });

    return res.json({
      success: true,
      unreadCount: count,
    });
  } catch (error) {
    logger.error('Error fetching unread count:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching unread count',
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await db.Notification.findByPk(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    // Verify user owns this notification
    if (notification.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this notification',
      });
    }

    notification.read = true;
    await notification.save();

    // Emit WebSocket event for notification update
    socketService.emitNotificationUpdate(userId, notificationId, { read: true });

    return res.json({
      success: true,
      notification,
    });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
    });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await db.Notification.update(
      { read: true },
      {
        where: {
          userId,
          read: false,
        },
      }
    );

    return res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
    });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await db.Notification.findByPk(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    // Verify user owns this notification
    if (notification.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this notification',
      });
    }

    await notification.destroy();

    // Emit WebSocket event for notification deletion
    socketService.emitNotificationDeleted(userId, notificationId);

    return res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    logger.error('Error deleting notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting notification',
    });
  }
};

exports.getCompanionRequestNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await db.Notification.findAll({
      where: {
        userId,
        type: {
          [Op.in]: [
            'companion_request_received',
            'companion_request_accepted',
            'companion_request_declined',
          ],
        },
      },
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    logger.error('Error fetching companion notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching companion notifications',
    });
  }
};

exports.getTripInvitationNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await db.Notification.findAll({
      where: {
        userId,
        type: {
          [Op.in]: [
            'trip_invitation_received',
            'trip_invitation_accepted',
            'trip_invitation_declined',
          ],
        },
      },
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    logger.error('Error fetching trip notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching trip notifications',
    });
  }
};
