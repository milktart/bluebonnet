const express = require('express');

const router = express.Router();
const notificationController = require('../controllers/notificationController');
const tripController = require('../controllers/tripController');
const { ensureAuthenticated } = require('../middleware/auth');

// All routes require authentication
router.use(ensureAuthenticated);

// Main notifications page - renders dashboard with notifications tab active
// This MUST come before /sidebar to take precedence
router.get('/', async (req, res, next) => {
  // Delegate to tripController.listTrips with activeTab set to 'notifications'
  // We'll pass options to show the notifications tab
  return tripController.listTrips(req, res, { activeTab: 'notifications' });
});

// Sidebar content endpoint (for AJAX loading in primary sidebar)
router.get('/sidebar', async (req, res) => {
  const logger = require('../utils/logger');
  try {
    logger.info('Fetching notifications sidebar for user:', req.user.id);

    const userId = req.user.id;
    const { Op } = require('sequelize');
    const db = require('../models');

    // Fetch all notifications for this user (unread first)
    const notifications = await db.Notification.findAll({
      where: { userId },
      attributes: [
        'id',
        'userId',
        'type',
        'relatedId',
        'relatedType',
        'message',
        'read',
        'actionRequired',
        'createdAt',
        'updatedAt',
      ],
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [
        ['read', 'ASC'],
        ['createdAt', 'DESC'],
      ], // Unread first, then by date
    });

    logger.info('Found notifications:', notifications.length);

    // Get unread count
    const unreadCount = await db.Notification.count({
      where: {
        userId,
        read: false,
      },
    });

    logger.info('Unread count:', unreadCount);

    // Return notifications as JSON
    return res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    logger.error('Error fetching notifications for sidebar:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
    });
    return res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message,
    });
  }
});

// Get unread count - API endpoint
router.get('/api/count/unread', notificationController.getUnreadCount);

// Get companion request notifications - API endpoint
router.get('/api/companions', notificationController.getCompanionRequestNotifications);

// Get trip invitation notifications - BEFORE generic get /
router.get('/api/trips', notificationController.getTripInvitationNotifications);

// Get all notifications (with optional filter for read status) - API endpoint
router.get('/api', notificationController.getNotifications);

// Mark notification as read
router.put('/:notificationId/read', notificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', notificationController.markAllAsRead);

// Delete notification
router.delete('/:notificationId', notificationController.deleteNotification);

module.exports = router;
