const express = require('express');

const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { ensureAuthenticated } = require('../middleware/auth');

// All routes require authentication
router.use(ensureAuthenticated);

// Get all notifications (with optional filter for read status)
router.get('/', notificationController.getNotifications);

// Get unread count
router.get('/count/unread', notificationController.getUnreadCount);

// Get companion request notifications
router.get('/companions', notificationController.getCompanionRequestNotifications);

// Get trip invitation notifications
router.get('/trips', notificationController.getTripInvitationNotifications);

// Mark notification as read
router.put('/:notificationId/read', notificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', notificationController.markAllAsRead);

// Delete notification
router.delete('/:notificationId', notificationController.deleteNotification);

module.exports = router;
