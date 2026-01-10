const express = require('express');

const router = express.Router();
const userController = require('../../../controllers/userController');
const { requireAdmin, ensureAuthenticated } = require('../../../middleware/auth');

/**
 * GET /api/v1/users/search
 * Search users by email (requires authentication)
 * Query params: email=<email>
 * Returns users matching the email
 */
router.get('/search', ensureAuthenticated, userController.searchUsersByEmail);

/**
 * GET /api/v1/users
 * Get all users (admin only)
 * Returns list of active users with their details
 */
router.get('/', requireAdmin, userController.getAllUsers);

/**
 * GET /api/v1/users/:id
 * Get a specific user by ID (admin only)
 */
router.get('/:id', requireAdmin, userController.getUserById);

/**
 * POST /api/v1/users
 * Create a new user (admin only)
 * Body: { email, firstName, lastName, password, isAdmin }
 */
router.post('/', requireAdmin, userController.createUser);

/**
 * PUT /api/v1/users/:id
 * Update a user (admin only)
 * Body: { firstName, lastName, isAdmin }
 */
router.put('/:id', requireAdmin, userController.updateUser);

/**
 * DELETE /api/v1/users/:id
 * Deactivate a user (soft delete) - admin only
 */
router.delete('/:id', requireAdmin, userController.deactivateUser);

module.exports = router;
