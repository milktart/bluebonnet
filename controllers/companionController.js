const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const { TravelCompanion, User } = require('../models');
const logger = require('../utils/logger');

// Get all companions for current user
exports.listCompanions = async (req, res) => {
  try {
    const companions = await TravelCompanion.findAll({
      where: {
        createdBy: req.user.id,
        // Exclude account owner's companion profile (where userId equals current user)
        // Must explicitly handle NULL since SQL NULL != value evaluates to NULL (not true)
        [Op.or]: [{ userId: { [Op.is]: null } }, { userId: { [Op.ne]: req.user.id } }],
      },
      include: [
        {
          model: User,
          as: 'linkedAccount',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['name', 'ASC']],
    });

    res.json({
      success: true,
      companions: companions.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        linkedAccount: c.linkedAccount,
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: 'Error loading companions' });
  }
};

// Get companions list sidebar content (AJAX)
exports.listCompanionsSidebar = async (req, res) => {
  try {
    const companions = await TravelCompanion.findAll({
      where: {
        createdBy: req.user.id,
        // Exclude account owner's companion profile (where userId equals current user)
        // Must explicitly handle NULL since SQL NULL != value evaluates to NULL (not true)
        [Op.or]: [{ userId: { [Op.is]: null } }, { userId: { [Op.ne]: req.user.id } }],
      },
      include: [
        {
          model: User,
          as: 'linkedAccount',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['name', 'ASC']],
    });

    res.json({ success: true, companions });
  } catch (error) {
    logger.error(error);
    res
      .status(500)
      .send(
        '<div class="p-4"><p class="text-red-600">Error loading companions. Please try again.</p></div>'
      );
  }
};

// Get companions as JSON (for sidebar/dashboard display)
exports.getCompanionsJson = async (req, res) => {
  try {
    const companions = await TravelCompanion.findAll({
      where: {
        createdBy: req.user.id,
        // Exclude account owner's companion profile (where userId equals current user)
        // Must explicitly handle NULL since SQL NULL != value evaluates to NULL (not true)
        [Op.or]: [{ userId: { [Op.is]: null } }, { userId: { [Op.ne]: req.user.id } }],
      },
      include: [
        {
          model: User,
          as: 'linkedAccount',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['name', 'ASC']],
    });

    res.json({
      success: true,
      companions: companions.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        linkedAccount: c.linkedAccount,
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: 'Error loading companions' });
  }
};

// Get all companions with bidirectional relationship info
// Returns both companions created by user AND companion profiles where user was added
exports.getAllCompanions = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get companions created by user
    const companionsCreated = await TravelCompanion.findAll({
      where: {
        createdBy: userId,
        [Op.or]: [{ userId: { [Op.is]: null } }, { userId: { [Op.ne]: userId } }],
      },
      include: [
        {
          model: User,
          as: 'linkedAccount',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['name', 'ASC']],
    });

    // Get companion profiles (where user was added by others)
    const companionProfiles = await TravelCompanion.findAll({
      where: {
        userId,
        createdBy: { [Op.ne]: userId },
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['name', 'ASC']],
    });

    // Build combined map by email to handle bidirectional relationships
    const companionMap = new Map();

    // Add companions created by user
    companionsCreated.forEach((companion) => {
      const key = companion.email.toLowerCase();
      companionMap.set(key, {
        id: companion.id,
        firstName: companion.firstName,
        lastName: companion.lastName,
        email: companion.email,
        youInvited: true,
        theyInvited: false,
        companionId: companion.id, // ID of the companion record YOU created
        userId: companion.userId, // ID of the user account if they've created one
      });
    });

    // Add profiles (people who added you)
    companionProfiles.forEach((profile) => {
      const key = profile.email.toLowerCase();
      if (companionMap.has(key)) {
        // Bidirectional relationship
        companionMap.get(key).theyInvited = true;
        companionMap.get(key).theyInvitedId = profile.id;
      } else {
        // They invited you, but you didn't create a companion for them
        companionMap.set(key, {
          id: profile.id,
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          youInvited: false,
          theyInvited: true,
          companionId: profile.id, // ID of the companion record THEY created
          userId: profile.userId, // ID of the user account if they've created one
        });
      }
    });

    const companions = Array.from(companionMap.values());

    res.json({
      success: true,
      companions,
    });
  } catch (error) {
    logger.error('GET_ALL_COMPANIONS_ERROR', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, error: 'Error loading companions' });
  }
};

// Get form to create new companion
exports.getCreateCompanion = (req, res) => {
  res.json({ success: true, message: 'Use POST to create a companion' });
};

// Get form to create new companion (sidebar version)
exports.getCreateCompanionSidebar = (req, res) => {
  res.json({ success: true, message: 'Use POST to create a companion' });
};

// Create new companion
exports.createCompanion = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMsg = errors
        .array()
        .map((e) => e.msg)
        .join(', ');
      const isAjax =
        req.get('X-Sidebar-Request') === 'true' ||
        req.xhr ||
        req.get('Content-Type')?.includes('application/json');

      if (isAjax) {
        return res.status(400).json({ success: false, error: errorMsg });
      }
      return res.status(400).json({ success: false, error: errorMsg });
    }

    const { firstName, lastName, name, email, phone } = req.body;
    // Check if this is an API request: X-Sidebar-Request header, xhr flag, JSON content-type, or X-Requested-With
    const isAjax =
      req.get('X-Sidebar-Request') === 'true' ||
      req.xhr ||
      req.get('X-Requested-With') === 'XMLHttpRequest' ||
      req.get('Content-Type')?.includes('application/json');
    const emailLower = email.toLowerCase();

    logger.info('COMPANION_CREATE_REQUEST', {
      isAjax,
      firstName,
      lastName,
      email: emailLower,
    });

    // Check if companion with this email already exists (globally unique)
    const existingCompanion = await TravelCompanion.findOne({
      where: {
        email: emailLower,
      },
    });

    if (existingCompanion) {
      const errorMsg = 'A companion with this email address already exists';
      if (isAjax) {
        return res.status(400).json({ success: false, error: errorMsg });
      }
      return res.status(400).json({ success: false, error: errorMsg });
    }

    // Check if there's already a user account with this email to auto-link
    const existingUser = await User.findOne({
      where: { email: emailLower },
    });

    // Generate display name from firstName/lastName or fallback to name/email
    let companionName;
    if (firstName && lastName) {
      companionName = `${firstName} ${lastName.charAt(0)}.`;
    } else if (firstName) {
      companionName = firstName;
    } else if (name) {
      companionName = name;
    } else {
      const [emailName] = email.split('@');
      companionName = emailName;
    }

    const companion = await TravelCompanion.create({
      firstName: firstName || null,
      lastName: lastName || null,
      name: companionName,
      email: emailLower,
      phone,
      createdBy: req.user.id,
      userId: existingUser ? existingUser.id : null,
    });

    const successMsg = existingUser
      ? 'Travel companion added and linked to existing account'
      : 'Travel companion added successfully';

    if (isAjax) {
      return res.json({
        success: true,
        message: successMsg,
        data: {
          id: companion.id,
          firstName: companion.firstName,
          lastName: companion.lastName,
          name: companion.name,
          email: companion.email,
          phone: companion.phone,
          addedAt: companion.createdAt,
        },
      });
    }

    res.json({ success: true, message: successMsg });
  } catch (error) {
    logger.error('COMPANION_CREATE_ERROR', { error: error.message, stack: error.stack });
    const errorMsg = 'Error adding travel companion';
    const isAjax =
      req.get('X-Sidebar-Request') === 'true' ||
      req.xhr ||
      req.get('Content-Type')?.includes('application/json');

    logger.info('COMPANION_CREATE_ERROR_RESPONSE', { isAjax, errorMsg });

    if (isAjax) {
      return res.status(500).json({ success: false, error: errorMsg });
    }
    res.status(500).json({ success: false, error: errorMsg });
  }
};

// Update companion permissions
exports.updateCompanionPermissions = async (req, res) => {
  try {
    const companionId = req.params.id;
    const isAjax = req.get('X-Sidebar-Request') === 'true' || req.xhr;

    const companion = await TravelCompanion.findOne({
      where: {
        id: companionId,
        createdBy: req.user.id,
      },
    });

    if (!companion) {
      const errorMsg = 'Companion not found';
      if (isAjax) {
        return res.status(404).json({ success: false, error: errorMsg });
      }
      return res.status(404).json({ success: false, error: errorMsg });
    }

    // No longer updating canBeAddedByOthers field

    const successMsg = 'Companion permissions updated';
    if (isAjax) {
      return res.json({ success: true, message: successMsg });
    }

    res.json({ success: true, message: successMsg });
  } catch (error) {
    logger.error(error);
    const errorMsg = 'Error updating companion permissions';
    if (req.get('X-Sidebar-Request') === 'true' || req.xhr) {
      return res.status(500).json({ success: false, error: errorMsg });
    }
    res.status(500).json({ success: false, error: errorMsg });
  }
};

// API endpoint for autocomplete search
exports.searchCompanions = async (req, res) => {
  logger.info('COMPANION_SEARCH_ENDPOINT_HIT', {
    path: req.path,
    url: req.originalUrl,
    method: req.method,
  });
  const { q = '' } = req.query;
  try {
    const userId = req.user.id;

    logger.info('COMPANION_SEARCH_START', { query: q, userId, queryLength: q ? q.length : 0 });

    if (!q || q.length < 2) {
      logger.info('COMPANION_SEARCH_SHORT_QUERY', { query: q });
      return res.json([]);
    }

    // Search companions that:
    // 1. User created themselves
    // 2. Match the search query (name or email)
    // 3. Exclude the account owner's companion profile
    const companions = await TravelCompanion.findAll({
      where: {
        [Op.and]: [
          // Creator filter: user created this
          {
            createdBy: userId,
          },
          // Search filter: name or email matches
          {
            [Op.or]: [{ name: { [Op.iLike]: `%${q}%` } }, { email: { [Op.iLike]: `%${q}%` } }],
          },
          // Exclude account owner's companion profile
          {
            [Op.or]: [{ userId: { [Op.is]: null } }, { userId: { [Op.ne]: userId } }],
          },
        ],
      },
      include: [
        {
          model: User,
          as: 'linkedAccount',
          attributes: ['id', 'firstName', 'lastName'],
          required: false,
        },
      ],
      limit: 10,
      order: [['name', 'ASC']],
    });

    logger.info('COMPANION_SEARCH_QUERY_EXECUTED', {
      query: q,
      userId,
      companionsFound: companions.length,
    });

    // Deduplicate by email - since email is now globally unique, we should only return one entry per email
    // Prioritize: user-created companions first, then others marked as addable
    const deduplicatedByEmail = new Map();

    companions.forEach((companion) => {
      const email = companion.email.toLowerCase();

      // Only add if not already in map, OR if this is the user's own creation (prioritize)
      if (!deduplicatedByEmail.has(email) || companion.createdBy === userId) {
        deduplicatedByEmail.set(email, companion);
      }
    });

    const results = Array.from(deduplicatedByEmail.values()).map((companion) => ({
      id: companion.id,
      name: companion.name,
      email: companion.email,
      phone: companion.phone,
      isLinked: !!companion.linkedAccount,
      isOwn: companion.createdBy === userId,
      linkedAccountName: companion.linkedAccount
        ? `${companion.linkedAccount.firstName} ${companion.linkedAccount.lastName}`
        : null,
    }));

    logger.info('COMPANION_SEARCH_RESPONSE', {
      query: q,
      resultsCount: results.length,
      deduplicatedCount: companions.length,
    });
    res.json(results);
  } catch (error) {
    logger.error('COMPANION_SEARCH_ERROR', { query: q, error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Search failed' });
  }
};

// Get edit form for companion
exports.getEditCompanion = async (req, res) => {
  try {
    const companion = await TravelCompanion.findOne({
      where: {
        id: req.params.id,
        createdBy: req.user.id,
        // Prevent editing own companion profile (where userId equals current user)
        // Must explicitly handle NULL since SQL NULL != value evaluates to NULL (not true)
        [Op.or]: [{ userId: { [Op.is]: null } }, { userId: { [Op.ne]: req.user.id } }],
      },
      include: [
        {
          model: User,
          as: 'linkedAccount',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    if (!companion) {
      return res.status(404).json({ success: false, error: 'Companion not found' });
    }

    res.json({
      success: true,
      companion: {
        id: companion.id,
        name: companion.name,
        email: companion.email,
        phone: companion.phone,
        linkedAccount: companion.linkedAccount,
      },
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: 'Error loading companion' });
  }
};

// Get edit form for companion (sidebar version)
exports.getEditCompanionSidebar = async (req, res) => {
  try {
    const companion = await TravelCompanion.findOne({
      where: {
        id: req.params.id,
        createdBy: req.user.id,
        // Prevent editing own companion profile (where userId equals current user)
        // Must explicitly handle NULL since SQL NULL != value evaluates to NULL (not true)
        [Op.or]: [{ userId: { [Op.is]: null } }, { userId: { [Op.ne]: req.user.id } }],
      },
      include: [
        {
          model: User,
          as: 'linkedAccount',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    if (!companion) {
      return res.status(404).json({ success: false, error: 'Companion not found' });
    }

    res.json({
      success: true,
      companion: {
        id: companion.id,
        name: companion.name,
        email: companion.email,
        phone: companion.phone,
        linkedAccount: companion.linkedAccount,
      },
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: 'Error loading companion' });
  }
};

// Update companion details
exports.updateCompanion = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMsg = errors
        .array()
        .map((e) => e.msg)
        .join(', ');
      const isAjax =
        req.get('X-Sidebar-Request') === 'true' ||
        req.xhr ||
        req.get('Content-Type')?.includes('application/json');

      if (isAjax) {
        return res.status(400).json({ success: false, error: errorMsg });
      }
      return res.status(400).json({ success: false, error: errorMsg });
    }

    const { firstName, lastName, name, email, phone } = req.body;
    const companionId = req.params.id;
    const isAjax =
      req.get('X-Sidebar-Request') === 'true' ||
      req.xhr ||
      req.get('X-Requested-With') === 'XMLHttpRequest' ||
      req.get('Content-Type')?.includes('application/json');

    const companion = await TravelCompanion.findOne({
      where: {
        id: companionId,
        createdBy: req.user.id,
        // Prevent editing own companion profile (where userId equals current user)
        // Must explicitly handle NULL since SQL NULL != value evaluates to NULL (not true)
        [Op.or]: [{ userId: { [Op.is]: null } }, { userId: { [Op.ne]: req.user.id } }],
      },
    });

    if (!companion) {
      const errorMsg = 'Companion not found';
      if (isAjax) {
        return res.status(404).json({ success: false, error: errorMsg });
      }
      return res.status(404).json({ success: false, error: errorMsg });
    }

    // Check if email is being changed and if it conflicts (globally unique)
    if (email.toLowerCase() !== companion.email) {
      const existingCompanion = await TravelCompanion.findOne({
        where: {
          email: email.toLowerCase(),
          id: { [Op.ne]: companionId },
        },
      });

      if (existingCompanion) {
        const errorMsg = 'A companion with this email address already exists';
        if (isAjax) {
          return res.status(400).json({ success: false, error: errorMsg });
        }
        return res.status(400).json({ success: false, error: errorMsg });
      }

      // Check if there's a user account to link to
      const existingUser = await User.findOne({
        where: { email: email.toLowerCase() },
      });

      // Generate display name from firstName/lastName or fallback
      let companionName;
      if (firstName && lastName) {
        companionName = `${firstName} ${lastName.charAt(0)}.`;
      } else if (firstName) {
        companionName = firstName;
      } else if (name) {
        companionName = name;
      } else {
        const [emailName] = email.split('@');
        companionName = emailName;
      }

      await companion.update({
        firstName: firstName || null,
        lastName: lastName || null,
        name: companionName,
        email: email.toLowerCase(),
        phone,
        userId: existingUser ? existingUser.id : null,
      });
    } else {
      // Generate display name from firstName/lastName or fallback
      let companionName;
      if (firstName && lastName) {
        companionName = `${firstName} ${lastName.charAt(0)}.`;
      } else if (firstName) {
        companionName = firstName;
      } else if (name) {
        companionName = name;
      } else {
        companionName = companion.name; // keep existing
      }

      await companion.update({
        firstName: firstName || null,
        lastName: lastName || null,
        name: companionName,
        phone,
      });
    }

    const successMsg = 'Companion updated successfully';
    if (isAjax) {
      return res.json({
        success: true,
        message: successMsg,
        data: {
          id: companion.id,
          firstName: companion.firstName,
          lastName: companion.lastName,
          name: companion.name,
          email: companion.email,
          phone: companion.phone,
          updatedAt: companion.updatedAt,
        },
      });
    }

    res.json({ success: true, message: successMsg });
  } catch (error) {
    logger.error(error);
    const errorMsg = 'Error updating companion';
    if (req.get('X-Sidebar-Request') === 'true' || req.xhr) {
      return res.status(500).json({ success: false, error: errorMsg });
    }
    res.status(500).json({ success: false, error: errorMsg });
  }
};

// Delete companion
exports.deleteCompanion = async (req, res) => {
  try {
    const isAjax = req.get('X-Sidebar-Request') === 'true' || req.xhr;

    const companion = await TravelCompanion.findOne({
      where: {
        id: req.params.id,
        createdBy: req.user.id,
        // Prevent deleting own companion profile (where userId equals current user)
        // Must explicitly handle NULL since SQL NULL != value evaluates to NULL (not true)
        [Op.or]: [{ userId: { [Op.is]: null } }, { userId: { [Op.ne]: req.user.id } }],
      },
    });

    if (!companion) {
      const errorMsg = 'Companion not found';
      if (isAjax) {
        return res.status(404).json({ success: false, error: errorMsg });
      }
      return res.status(404).json({ success: false, error: errorMsg });
    }

    await companion.destroy();

    const successMsg = 'Companion deleted successfully';
    if (isAjax) {
      return res.json({ success: true, message: successMsg });
    }

    res.json({ success: true, message: successMsg });
  } catch (error) {
    logger.error(error);
    const errorMsg = 'Error deleting companion';
    if (req.get('X-Sidebar-Request') === 'true' || req.xhr) {
      return res.status(500).json({ success: false, error: errorMsg });
    }
    res.status(500).json({ success: false, error: errorMsg });
  }
};

// Remove linked account (unlink companion from user account)
exports.unlinkCompanion = async (req, res) => {
  try {
    const isAjax = req.get('X-Sidebar-Request') === 'true' || req.xhr;

    const companion = await TravelCompanion.findOne({
      where: {
        id: req.params.id,
        createdBy: req.user.id,
      },
    });

    if (!companion) {
      const errorMsg = 'Companion not found';
      if (isAjax) {
        return res.status(404).json({ success: false, error: errorMsg });
      }
      return res.status(404).json({ success: false, error: errorMsg });
    }

    await companion.update({ userId: null });

    const successMsg = 'Companion account unlinked successfully';
    if (isAjax) {
      return res.json({ success: true, message: successMsg });
    }

    res.json({ success: true, message: successMsg });
  } catch (error) {
    logger.error(error);
    const errorMsg = 'Error unlinking companion';
    if (req.get('X-Sidebar-Request') === 'true' || req.xhr) {
      return res.status(500).json({ success: false, error: errorMsg });
    }
    res.status(500).json({ success: false, error: errorMsg });
  }
};
