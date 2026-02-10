const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const { TravelCompanion, User, CompanionPermission } = require('../models');
const logger = require('../utils/logger');
const apiResponse = require('../utils/apiResponse');
const { getMyCompanionsQuery, getMyCompanionsWhere } = require('../utils/companionQueryHelper');
const { generateCompanionName } = require('../utils/companionNameHelper');
const { isAjaxRequest } = require('../middleware/ajaxDetection');

// Get all companions for current user (consolidated from listCompanions, getCompanionsJson, listCompanionsSidebar)
exports.listCompanions = async (req, res) => {
  try {
    const companions = await TravelCompanion.findAll(getMyCompanionsQuery(req.user.id));

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

// Alias for backward compatibility
exports.getCompanionsJson = exports.listCompanions;

// Get all companions with bidirectional relationship info
// Returns both companions created by user AND companion profiles where user was added
exports.getAllCompanions = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get companions created by user with their permissions
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
        {
          model: CompanionPermission,
          as: 'permissions',
          where: { grantedBy: userId },
          required: false,
        },
      ],
      order: [['name', 'ASC']],
    });

    // Get companion profiles (where user was added by others)
    // This gets companions where userId = current user (meaning current user IS the companion)
    // We want to see both:
    // 1. Permissions that the creator granted to us (grantedBy = creator)
    // 2. Permissions that we granted back to the creator (grantedBy = current user)
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
        {
          model: CompanionPermission,
          as: 'permissions',
          where: {
            [Op.or]: [
              { grantedBy: { [Op.ne]: userId } }, // Permissions others granted to us
              { grantedBy: userId }, // Permissions we granted back
            ],
          },
          required: false,
        },
      ],
      order: [['name', 'ASC']],
    });

    // Build combined map by email to handle bidirectional relationships
    const companionMap = new Map();

    // Add companions created by user
    companionsCreated.forEach((companion) => {
      const key = companion.email.toLowerCase();
      const permission = companion.permissions?.[0];
      const linkedUser = companion.linkedAccount;
      companionMap.set(key, {
        id: companion.id,
        name: companion.name,
        firstName: companion.firstName,
        lastName: companion.lastName,
        email: companion.email,
        userId: companion.userId,
        // canShareTrips: What WE grant them - they can view OUR trips
        canShareTrips: permission?.canView ?? true,
        // canManageTrips: What THEY grant us - we can manage THEIR trips (we don't know yet if they added us)
        canManageTrips: false, // Will be set if they're also in our companion profiles (when they added us)
        // theyShareTrips: What THEY grant us - they can view OUR trips (we don't know yet)
        theyShareTrips: false, // Will be set if they're also in our companion profiles
        // theyManageTrips: What WE grant them - they can manage OUR trips
        theyManageTrips: permission?.canEdit || false,
        companionId: companion.id, // ID of the companion record YOU created
        hasLinkedUser: !!linkedUser,
        linkedUserFirstName: linkedUser?.firstName || null,
        linkedUserLastName: linkedUser?.lastName || null,
      });
    });

    // Add profiles (people who added you) and mark what they grant us
    companionProfiles.forEach((profile) => {
      // Use the creator's email as key (the person who added you)
      const creatorEmail = profile.creator?.email || profile.email;
      const key = creatorEmail.toLowerCase();

      // Separate permissions: what they granted us vs what we granted them
      let theyGrantPermission = null; // grantedBy = creator (what they grant to us)
      let weGrantPermission = null; // grantedBy = current user (what we grant to them)

      if (profile.permissions && profile.permissions.length > 0) {
        profile.permissions.forEach((perm) => {
          if (perm.grantedBy === userId) {
            weGrantPermission = perm;
          } else {
            theyGrantPermission = perm;
          }
        });
      }

      if (companionMap.has(key)) {
        // Bidirectional relationship - merge permissions from both directions
        // KEEP the original companion ID (the one we created) - don't overwrite with reverse ID
        const existingEntry = companionMap.get(key);
        // theyShareTrips: Can THEY view OUR trips? (on their companion record - what they allowed us)
        existingEntry.theyShareTrips = theyGrantPermission?.canView ?? true;
        // theyManageTrips: Can THEY manage OUR trips? (already set correctly from our companion record)
        // Note: Don't override - it's already set from the permission we granted them
        // canManageTrips: Can WE manage THEIR trips? (on their companion record - what they allowed us)
        existingEntry.canManageTrips = theyGrantPermission?.canEdit || false;
      } else {
        // They added you, but you haven't added them - create entry with their info
        // Use the creator's name (who created this companion record)
        const creatorUser = profile.creator;
        companionMap.set(key, {
          id: profile.id,
          name: profile.creator?.name || profile.name,
          firstName: profile.creator?.firstName || profile.firstName,
          lastName: profile.creator?.lastName || profile.lastName,
          email: creatorEmail,
          userId: profile.creator?.id || profile.userId,
          // canShareTrips: What WE grant them to view OUR trips - they decided to add us, now we decide (default true)
          canShareTrips: weGrantPermission?.canView ?? true,
          // canManageTrips: Can WE manage THEIR trips? (permission they granted us in their companion record - canEdit)
          canManageTrips: theyGrantPermission?.canEdit || false,
          // theyShareTrips: Can they view OUR trips? (permission they granted us in their companion record - canView)
          theyShareTrips: theyGrantPermission?.canView ?? true,
          // theyManageTrips: Can they manage OUR trips? (we haven't granted them permission yet - false)
          theyManageTrips: weGrantPermission?.canEdit || false,
          companionId: profile.id, // ID of the companion record THEY created
          hasLinkedUser: !!creatorUser,
          linkedUserFirstName: creatorUser?.firstName || null,
          linkedUserLastName: creatorUser?.lastName || null,
        });
      }
    });

    const companions = Array.from(companionMap.values());
    return apiResponse.success(res, companions, `Retrieved ${companions.length} companions`);
  } catch (error) {
    logger.error('GET_ALL_COMPANIONS_ERROR', { error: error.message, stack: error.stack });
    return apiResponse.internalError(res, 'Error loading companions', error);
  }
};

// Update companion permissions (canShareTrips, theyManageTrips)
exports.updateCompanionPermissions = async (req, res) => {
  try {
    const companionId = req.params.id;
    // Accept both field name formats for backward compatibility
    let { canShareTrips } = req.body;
    if (canShareTrips === undefined) {
      canShareTrips = req.body.canView !== undefined ? req.body.canView : true;
    }
    let { theyManageTrips } = req.body;
    if (theyManageTrips === undefined) {
      if (req.body.canManageTrips !== undefined) {
        theyManageTrips = req.body.canManageTrips;
      } else {
        theyManageTrips = req.body.canEdit !== undefined ? req.body.canEdit : false;
      }
    }

    const isAjax = isAjaxRequest(req);

    // Verify companion exists and user has permission to update it
    // A user can update permissions if:
    // 1. They created the companion record (createdBy = req.user.id), OR
    // 2. The companion record references them (userId = req.user.id) - e.g., they're the person being shared with
    const companion = await TravelCompanion.findOne({
      where: {
        id: companionId,
        [Op.or]: [
          { createdBy: req.user.id }, // User created this companion
          { userId: req.user.id }, // This companion record represents the current user
        ],
      },
    });

    if (!companion) {
      const errorMsg = 'Companion not found';
      if (isAjax) {
        return res.status(404).json({ success: false, error: errorMsg });
      }
      return res.status(404).json({ success: false, error: errorMsg });
    }

    // Update or create permission record
    // Map friendly names (canShareTrips, theyManageTrips) to database fields (canView, canEdit)
    const [permission, created] = await CompanionPermission.findOrCreate({
      where: {
        companionId,
        grantedBy: req.user.id,
      },
      defaults: {
        canView: canShareTrips,
        canEdit: theyManageTrips,
        canManageCompanions: false, // Keep default false, not used in current UI
      },
    });

    // If record already existed, update it with new values
    if (!created) {
      await permission.update({
        canView: canShareTrips,
        canEdit: theyManageTrips,
        canManageCompanions: false,
      });
    }

    const successMsg = 'Companion permissions updated';
    if (isAjax) {
      return res.json({
        success: true,
        message: successMsg,
        data: {
          companionId: permission.companionId,
          canShareTrips: permission.canView,
          theyManageTrips: permission.canEdit,
        },
      });
    }

    res.json({ success: true, message: successMsg });
  } catch (error) {
    logger.error('UPDATE_COMPANION_PERMISSIONS_ERROR', { error: error.message });
    const errorMsg = 'Error updating companion permissions';
    const isAjax = isAjaxRequest(req);

    if (isAjax) {
      return res.status(500).json({ success: false, error: errorMsg });
    }
    res.status(500).json({ success: false, error: errorMsg });
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
      const isAjax = isAjaxRequest(req);

      if (isAjax) {
        return res.status(400).json({ success: false, error: errorMsg });
      }
      return res.status(400).json({ success: false, error: errorMsg });
    }

    const { firstName, lastName, name, email, phone, canShareTrips, canManageTrips } = req.body;
    const isAjax = isAjaxRequest(req);
    const emailLower = email.toLowerCase();

    // Default permissions: share trips by default, don't manage by default
    const share = canShareTrips !== undefined ? canShareTrips : true;
    const manage = canManageTrips !== undefined ? canManageTrips : false;

    // Check if companion with this email already exists for this user
    const existingCompanion = await TravelCompanion.findOne({
      where: {
        email: emailLower,
        createdBy: req.user.id,
      },
    });

    if (existingCompanion) {
      const errorMsg = 'You already have a companion with this email address';
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
    const companionName = generateCompanionName({
      firstName: firstName || '',
      lastName: lastName || '',
      name: name || '',
      email: emailLower,
    });

    const companion = await TravelCompanion.create({
      firstName: firstName || null,
      lastName: lastName || null,
      name: companionName,
      email: emailLower,
      phone,
      createdBy: req.user.id,
      userId: existingUser ? existingUser.id : null,
    });

    // Create companion permission record
    // Map frontend field names (canShareTrips, canManageTrips) to database field names (canView, canEdit)
    await CompanionPermission.create({
      companionId: companion.id,
      grantedBy: req.user.id,
      canView: share, // canShareTrips -> canView
      canEdit: manage, // canManageTrips (they manage our trips) -> canEdit
      canManageCompanions: false,
    });

    // Also create a reverse companion record if the companion is a registered user
    if (existingUser) {
      const reverseCompanion = await TravelCompanion.findOne({
        where: {
          email: emailLower,
          createdBy: existingUser.id,
          userId: req.user.id,
        },
      });

      if (!reverseCompanion) {
        const newReverseCompanion = await TravelCompanion.create({
          firstName: req.user.firstName || null,
          lastName: req.user.lastName || null,
          name: req.user.firstName || req.user.email.split('@')[0],
          email: req.user.email,
          phone: null,
          createdBy: existingUser.id,
          userId: req.user.id,
        });

        // Create default permissions for reverse companion (no permissions yet)
        await CompanionPermission.create({
          companionId: newReverseCompanion.id,
          grantedBy: existingUser.id,
          canShareTrips: false,
          canManageTrips: false,
        });
      }
    }

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
          userId: companion.userId,
          canShareTrips: share,
          canManageTrips: manage,
          addedAt: companion.createdAt,
          linkedUserFirstName: existingUser ? existingUser.firstName : null,
          linkedUserLastName: existingUser ? existingUser.lastName : null,
        },
      });
    }

    res.json({ success: true, message: successMsg });
  } catch (error) {
    logger.error('COMPANION_CREATE_ERROR', { error: error.message, stack: error.stack });
    const errorMsg = 'Error adding travel companion';
    const isAjax = isAjaxRequest(req);

    if (isAjax) {
      return res.status(500).json({ success: false, error: errorMsg });
    }
    res.status(500).json({ success: false, error: errorMsg });
  }
};

// API endpoint for autocomplete search
exports.searchCompanions = async (req, res) => {
  const { q = '' } = req.query;
  try {
    const userId = req.user.id;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    // Search companions that:
    // 1. User created themselves
    // 2. Match the search query (name or email)
    // 3. Exclude the account owner's companion profile
    const companions = await TravelCompanion.findAll({
      where: {
        [Op.and]: [
          getMyCompanionsWhere(userId),
          // Search filter: name or email matches
          {
            [Op.or]: [{ name: { [Op.iLike]: `%${q}%` } }, { email: { [Op.iLike]: `%${q}%` } }],
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

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
};

// Check if an email has a linked user account
exports.checkEmailForUser = async (req, res) => {
  const { email } = req.query;
  try {
    if (!email || !email.trim()) {
      return res.json({ hasUser: false, user: null });
    }

    const emailLower = email.toLowerCase().trim();

    // Search for user with this email
    const user = await User.findOne({
      where: { email: emailLower },
      attributes: ['id', 'firstName', 'lastName', 'email'],
    });

    if (user) {
      return res.json({
        hasUser: true,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      });
    }

    res.json({ hasUser: false, user: null });
  } catch (error) {
    res.status(500).json({ hasUser: false, error: 'Check failed' });
  }
};

// Get edit form for companion (works for both sidebar and regular requests)
exports.getEditCompanion = async (req, res) => {
  try {
    const companion = await TravelCompanion.findOne({
      where: {
        id: req.params.id,
        ...getMyCompanionsWhere(req.user.id),
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

// Get edit form for companion (sidebar version - kept for backward compatibility)
exports.getEditCompanionSidebar = exports.getEditCompanion;

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
      const isAjax = isAjaxRequest(req);

      if (isAjax) {
        return res.status(400).json({ success: false, error: errorMsg });
      }
      return res.status(400).json({ success: false, error: errorMsg });
    }

    const { firstName, lastName, name, email, phone } = req.body;
    const companionId = req.params.id;
    const isAjax = isAjaxRequest(req);

    const companion = await TravelCompanion.findOne({
      where: {
        id: companionId,
        ...getMyCompanionsWhere(req.user.id),
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
    const emailLower = email.toLowerCase();
    if (emailLower !== companion.email) {
      const existingCompanion = await TravelCompanion.findOne({
        where: {
          email: emailLower,
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
        where: { email: emailLower },
      });

      // Generate display name from firstName/lastName or fallback
      const companionName = generateCompanionName({
        firstName: firstName || '',
        lastName: lastName || '',
        name: name || '',
        email: emailLower,
      });

      await companion.update({
        firstName: firstName || null,
        lastName: lastName || null,
        name: companionName,
        email: emailLower,
        phone,
        userId: existingUser ? existingUser.id : null,
      });
    } else {
      // Generate display name from firstName/lastName or fallback, keeping existing if no name provided
      const companionName = generateCompanionName({
        firstName: firstName || '',
        lastName: lastName || '',
        name: name || companion.name,
        email: companion.email,
      });

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
    const isAjax = isAjaxRequest(req);
    if (isAjax) {
      return res.status(500).json({ success: false, error: errorMsg });
    }
    res.status(500).json({ success: false, error: errorMsg });
  }
};

// Delete companion
exports.deleteCompanion = async (req, res) => {
  try {
    const isAjax = isAjaxRequest(req);

    const companion = await TravelCompanion.findOne({
      where: {
        id: req.params.id,
        ...getMyCompanionsWhere(req.user.id),
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
    const isAjax = isAjaxRequest(req);
    if (isAjax) {
      return res.status(500).json({ success: false, error: errorMsg });
    }
    res.status(500).json({ success: false, error: errorMsg });
  }
};

// Remove linked account (unlink companion from user account)
exports.unlinkCompanion = async (req, res) => {
  try {
    const isAjax = isAjaxRequest(req);

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
    const isAjax = isAjaxRequest(req);
    if (isAjax) {
      return res.status(500).json({ success: false, error: errorMsg });
    }
    res.status(500).json({ success: false, error: errorMsg });
  }
};
