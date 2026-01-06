const bcrypt = require('bcrypt');
const logger = require('../utils/logger');
const { User, TravelCompanion, CompanionRelationship, Notification } = require('../models');

exports.getLogin = (req, res) => {
  res.render('login', { title: 'Login' });
};

exports.getRegister = (req, res) => {
  res.render('register', { title: 'Register' });
};

exports.postRegister = async (req, res) => {
  try {
    const { email, password, firstName, lastName, name } = req.body;
    const isJsonRequest = req.get('content-type')?.includes('application/json');

    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });

    if (existingUser) {
      if (isJsonRequest) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }
      req.flash('error_msg', 'Email already registered');
      return res.redirect('/auth/register');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Support both firstName/lastName and name fields
    const [first, last] = name ? name.split(' ') : [firstName, lastName];

    // Check if this email should be made admin via ADMIN_EMAIL env var
    const isAdminEmail = email.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase();

    const newUser = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName: first,
      lastName: last,
      isAdmin: isAdminEmail,
      linkedAt: new Date(),
    });

    // Auto-link any existing travel companions with this email
    const companionsToLink = await TravelCompanion.findAll({
      where: {
        email: email.toLowerCase(),
        userId: null, // Only link companions that aren't already linked
      },
    });

    if (companionsToLink.length > 0) {
      // Link all companions to this new user account
      await Promise.all(
        companionsToLink.map((companion) =>
          companion.update({ userId: newUser.id, linkedAt: new Date() })
        )
      );

      // Process companion relationships for this newly linked account
      // Find all pending companion requests where this new user is the recipient
      const pendingRequests = await CompanionRelationship.findAll({
        where: {
          companionUserId: newUser.id,
          status: 'pending',
        },
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
          actionRequired: true,
        });
      }

      // Check if any manage_travel relationships need to be downgraded
      const manageRelationships = await CompanionRelationship.findAll({
        where: {
          companionUserId: newUser.id,
          status: 'accepted',
          permissionLevel: 'manage_travel',
        },
      });

      // Downgrade manage_travel to view_travel since user now has an account
      for (const relationship of manageRelationships) {
        relationship.permissionLevel = 'view_travel';
        await relationship.save();
      }
    }

    if (isJsonRequest) {
      return res.json({
        success: true,
        message: 'Registration successful! Please log in.',
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        },
      });
    }

    req.flash('success_msg', 'Registration successful! Please log in.');
    res.redirect('/auth/login');
  } catch (error) {
    logger.error(error);
    if (req.get('content-type')?.includes('application/json')) {
      return res
        .status(500)
        .json({ success: false, message: 'An error occurred during registration' });
    }
    req.flash('error_msg', 'An error occurred during registration');
    res.redirect('/auth/register');
  }
};

exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash('success_msg', 'You are logged out');
    res.redirect('/');
  });
};
