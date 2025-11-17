const bcrypt = require('bcrypt');
const logger = require('../utils/logger');
const { User, TravelCompanion, CompanionRelationship, Notification } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

exports.getLogin = (req, res) => {
  res.render('login', { title: 'Login' });
};

exports.getRegister = (req, res) => {
  res.render('register', { title: 'Register' });
};

exports.postRegister = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });

    if (existingUser) {
      req.flash('error_msg', 'Email already registered');
      return res.redirect('/auth/register');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      linkedAt: new Date()
    });

    // Auto-link any existing travel companions with this email
    const companionsToLink = await TravelCompanion.findAll({
      where: {
        email: email.toLowerCase(),
        userId: null // Only link companions that aren't already linked
      }
    });

    if (companionsToLink.length > 0) {
      // Link all companions to this new user account
      await Promise.all(
        companionsToLink.map(companion =>
          companion.update({ userId: newUser.id, linkedAt: new Date() })
        )
      );

      // Process companion relationships for this newly linked account
      // Find all pending companion requests where this new user is the recipient
      const pendingRequests = await CompanionRelationship.findAll({
        where: {
          companionUserId: newUser.id,
          status: 'pending'
        }
      });

      // For each pending request, create notifications
      for (const relationship of pendingRequests) {
        // Create notification for new account about the request
        await Notification.create({
          userId: newUser.id,
          type: 'companion_request_received',
          relatedId: relationship.id,
          relatedType: 'companion_relationship',
          message: `You have a pending travel companion request`,
          read: false,
          actionRequired: true
        });
      }

      // Check if any manage_travel relationships need to be downgraded
      const manageRelationships = await CompanionRelationship.findAll({
        where: {
          companionUserId: newUser.id,
          status: 'accepted',
          permissionLevel: 'manage_travel'
        }
      });

      // Downgrade manage_travel to view_travel since user now has an account
      for (const relationship of manageRelationships) {
        relationship.permissionLevel = 'view_travel';
        await relationship.save();
      }

      const companionCount = companionsToLink.length;
      req.flash('success_msg',
        `Registration successful! ${companionCount} travel companion${companionCount > 1 ? 's' : ''} automatically linked to your account. Please log in.`
      );
    } else {
      req.flash('success_msg', 'Registration successful! Please log in.');
    }

    res.redirect('/auth/login');
  } catch (error) {
    logger.error(error);
    req.flash('error_msg', 'An error occurred during registration');
    res.redirect('/auth/register');
  }
};

exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash('success_msg', 'You are logged out');
    res.redirect('/');
  });
};