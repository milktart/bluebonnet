const bcrypt = require('bcrypt');
const logger = require('../utils/logger');
const { User } = require('../models');

/**
 * Get all users (admin only)
 * Returns active users only, excludes soft-deleted accounts
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { isActive: true },
      attributes: ['id', 'email', 'firstName', 'lastName', 'isAdmin', 'lastLogin', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, users });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
};

/**
 * Create a new user (admin only)
 */
exports.createUser = async (req, res) => {
  try {
    const { email, firstName, lastName, password, isAdmin } = req.body;

    // Validate input
    if (!email || !firstName || !lastName || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, first name, last name, and password are required',
      });
    }

    // Validate lastName is single character
    if (lastName.length !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Last name must be a single character (initial)',
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      email: email.toLowerCase(),
      firstName,
      lastName,
      password: hashedPassword,
      isAdmin: isAdmin === true,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        isAdmin: newUser.isAdmin,
        lastLogin: newUser.lastLogin,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    logger.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Error creating user' });
  }
};

/**
 * Update a user (admin only)
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, isAdmin, password } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) {
      // Validate lastName is single character
      if (lastName.length !== 1) {
        return res.status(400).json({
          success: false,
          message: 'Last name must be a single character (initial)',
        });
      }
      user.lastName = lastName;
    }
    if (isAdmin !== undefined) user.isAdmin = isAdmin === true;

    // Update password if provided
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Error updating user' });
  }
};

/**
 * Deactivate a user (soft delete) - admin only
 * Prevents admin from deactivating their own account
 */
exports.deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deactivating own account via admin action
    if (req.user.id === id) {
      return res.status(403).json({
        success: false,
        message: 'You cannot deactivate your own account. Contact support if needed.',
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Soft delete
    user.isActive = false;
    await user.save();

    res.json({ success: true, message: 'User account deactivated' });
  } catch (error) {
    logger.error('Error deactivating user:', error);
    res.status(500).json({ success: false, message: 'Error deactivating user' });
  }
};

/**
 * Get user by ID (admin only)
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: ['id', 'email', 'firstName', 'lastName', 'isAdmin', 'lastLogin', 'createdAt'],
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    logger.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Error fetching user' });
  }
};
