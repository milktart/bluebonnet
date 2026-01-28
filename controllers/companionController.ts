import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { validationResult } from 'express-validator';
import { TravelCompanion, User, CompanionPermission } from '../models';
import logger from '../utils/logger';
import apiResponse from '../utils/apiResponse';
import { getMyCompanionsQuery, getMyCompanionsWhere } from '../utils/companionQueryHelper';
import { generateCompanionName } from '../utils/companionNameHelper';
import { isAjaxRequest } from '../middleware/ajaxDetection';
import type {
  CompanionData,
  ApiResponse,
  PermissionUpdate
} from '../types';

// Extend Express Request to include user
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

/**
 * Get all companions for current user
 */
export const listCompanions = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const companions = await TravelCompanion.findAll(getMyCompanionsQuery(req.user.id));

    res.json({
      success: true,
      companions: companions.map((c: any) => ({
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

/**
 * Get companions list sidebar content (AJAX)
 */
export const listCompanionsSidebar = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const companions = await TravelCompanion.findAll(getMyCompanionsQuery(req.user.id));

    res.json({ success: true, companions });
  } catch (error) {
    logger.error(error);
    res.status(500).send(
      '<div class="p-4"><p class="text-red-600">Error loading companions. Please try again.</p></div>'
    );
  }
};

/**
 * Get companions as JSON (for sidebar/dashboard display)
 */
export const getCompanionsJson = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const companions = await TravelCompanion.findAll(getMyCompanionsQuery(req.user.id));

    res.json({
      success: true,
      companions: companions.map((c: any) => ({
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

/**
 * Get all companions with bidirectional relationship info
 * Returns both companions created by user AND companion profiles where user was added
 */
export const getAllCompanions = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
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
              { grantedBy: { [Op.ne]: userId } },
              { grantedBy: userId },
            ],
          },
          required: false,
        },
      ],
      order: [['name', 'ASC']],
    });

    // Build combined map by email to handle bidirectional relationships
    const companionMap = new Map<string, any>();

    // Add companions created by user
    companionsCreated.forEach((companion: any) => {
      const key = companion.email.toLowerCase();
      const permission = companion.permissions?.[0];
      const linkedUser = companion.linkedAccount;
      companionMap.set(key, {
        id: companion.id,
        firstName: companion.firstName,
        lastName: companion.lastName,
        email: companion.email,
        userId: companion.userId,
        canShareTrips: permission?.canView ?? true,
        canManageTrips: false,
        theyShareTrips: false,
        theyManageTrips: permission?.canEdit || false,
        companionId: companion.id,
        hasLinkedUser: !!linkedUser,
        linkedUserFirstName: linkedUser?.firstName || null,
        linkedUserLastName: linkedUser?.lastName || null,
      });
    });

    // Add profiles and mark what they grant us
    companionProfiles.forEach((profile: any) => {
      const creatorEmail = profile.creator?.email || profile.email;
      const key = creatorEmail.toLowerCase();

      let theyGrantPermission = null;
      let weGrantPermission = null;

      if (profile.permissions && profile.permissions.length > 0) {
        profile.permissions.forEach((perm: any) => {
          if (perm.grantedBy === userId) {
            weGrantPermission = perm;
          } else {
            theyGrantPermission = perm;
          }
        });
      }

      if (companionMap.has(key)) {
        const existingEntry = companionMap.get(key);
        existingEntry.theyShareTrips = theyGrantPermission?.canView ?? true;
        existingEntry.canManageTrips = theyGrantPermission?.canEdit || false;
      } else {
        const creatorUser = profile.creator;
        companionMap.set(key, {
          id: profile.id,
          firstName: profile.creator?.firstName || profile.firstName,
          lastName: profile.creator?.lastName || profile.lastName,
          email: creatorEmail,
          userId: profile.creator?.id || profile.userId,
          canShareTrips: weGrantPermission?.canView ?? true,
          canManageTrips: theyGrantPermission?.canEdit || false,
          theyShareTrips: theyGrantPermission?.canView ?? true,
          theyManageTrips: weGrantPermission?.canEdit || false,
          companionId: profile.id,
          hasLinkedUser: !!creatorUser,
          linkedUserFirstName: creatorUser?.firstName || null,
          linkedUserLastName: creatorUser?.lastName || null,
        });
      }
    });

    const companions = Array.from(companionMap.values());
    apiResponse.success(res, companions, `Retrieved ${companions.length} companions`);
  } catch (error) {
    logger.error('GET_ALL_COMPANIONS_ERROR', { error: (error as Error).message });
    apiResponse.internalError(res, 'Error loading companions', error);
  }
};

/**
 * Update companion permissions
 */
export const updateCompanionPermissions = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const companionId = req.params.id;
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

    const companion = await TravelCompanion.findOne({
      where: {
        id: companionId,
        [Op.or]: [
          { createdBy: req.user.id },
          { userId: req.user.id },
        ],
      },
    });

    if (!companion) {
      const errorMsg = 'Companion not found';
      res.status(404).json({ success: false, error: errorMsg });
      return;
    }

    // Update or create permission record
    const [permission, created] = await CompanionPermission.findOrCreate({
      where: {
        companionId,
        grantedBy: req.user.id,
      },
      defaults: {
        canView: canShareTrips,
        canEdit: theyManageTrips,
        canManageCompanions: false,
      },
    });

    if (!created) {
      await permission.update({
        canView: canShareTrips,
        canEdit: theyManageTrips,
        canManageCompanions: false,
      });
    }

    const successMsg = 'Companion permissions updated';
    if (isAjax) {
      res.json({
        success: true,
        message: successMsg,
        data: {
          companionId: permission.companionId,
          canShareTrips: permission.canView,
          theyManageTrips: permission.canEdit,
        },
      });
      return;
    }

    res.json({ success: true, message: successMsg });
  } catch (error) {
    logger.error('UPDATE_COMPANION_PERMISSIONS_ERROR', { error: (error as Error).message });
    const errorMsg = 'Error updating companion permissions';
    const isAjax = isAjaxRequest(req);

    if (isAjax) {
      res.status(500).json({ success: false, error: errorMsg });
      return;
    }
    res.status(500).json({ success: false, error: errorMsg });
  }
};

/**
 * Get form to create new companion
 */
export const getCreateCompanion = (
  req: AuthenticatedRequest,
  res: Response
): void => {
  res.json({ success: true, message: 'Use POST to create a companion' });
};

/**
 * Get form to create new companion (sidebar version)
 */
export const getCreateCompanionSidebar = (
  req: AuthenticatedRequest,
  res: Response
): void => {
  res.json({ success: true, message: 'Use POST to create a companion' });
};

/**
 * Create new companion
 */
export const createCompanion = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMsg = errors
        .array()
        .map((e) => e.msg)
        .join(', ');
      const isAjax = isAjaxRequest(req);

      res.status(400).json({ success: false, error: errorMsg });
      return;
    }

    const { firstName, lastName, name, email, phone, canShareTrips, canManageTrips } = req.body;
    const isAjax = isAjaxRequest(req);
    const emailLower = email.toLowerCase();

    const share = canShareTrips !== undefined ? canShareTrips : true;
    const manage = canManageTrips !== undefined ? canManageTrips : false;

    // Check if companion with this email already exists
    const existingCompanion = await TravelCompanion.findOne({
      where: {
        email: emailLower,
        createdBy: req.user.id,
      },
    });

    if (existingCompanion) {
      const errorMsg = 'You already have a companion with this email address';
      res.status(400).json({ success: false, error: errorMsg });
      return;
    }

    // Check if there's already a user account with this email
    const existingUser = await User.findOne({
      where: { email: emailLower },
    });

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
    await CompanionPermission.create({
      companionId: companion.id,
      grantedBy: req.user.id,
      canView: share,
      canEdit: manage,
      canManageCompanions: false,
    });

    // Create reverse companion record if the companion is a registered user
    if (existingUser) {
      const reverseCompanion = await TravelCompanion.findOne({
        where: {
          email: emailLower,
          createdBy: existingUser.id,
          userId: req.user.id,
        },
      });

      if (!reverseCompanion) {
        await TravelCompanion.create({
          firstName: req.user.firstName || null,
          lastName: req.user.lastName || null,
          name: req.user.firstName || req.user.email.split('@')[0],
          email: req.user.email,
          phone: null,
          createdBy: existingUser.id,
          userId: req.user.id,
        });

        await CompanionPermission.create({
          companionId: companion.id,
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
      res.json({
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
      return;
    }

    res.json({ success: true, message: successMsg });
  } catch (error) {
    logger.error('COMPANION_CREATE_ERROR', { error: (error as Error).message });
    const errorMsg = 'Error adding travel companion';
    const isAjax = isAjaxRequest(req);

    if (isAjax) {
      res.status(500).json({ success: false, error: errorMsg });
      return;
    }
    res.status(500).json({ success: false, error: errorMsg });
  }
};

/**
 * API endpoint for autocomplete search
 */
export const searchCompanions = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { q = '' } = req.query;
  try {
    const userId = req.user.id;

    if (!q || (typeof q === 'string' && q.length < 2)) {
      res.json([]);
      return;
    }

    const searchQuery = typeof q === 'string' ? q : '';
    const companions = await TravelCompanion.findAll({
      where: {
        [Op.and]: [
          getMyCompanionsWhere(userId),
          {
            [Op.or]: [
              { name: { [Op.iLike]: `%${searchQuery}%` } },
              { email: { [Op.iLike]: `%${searchQuery}%` } },
            ],
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

    const deduplicatedByEmail = new Map<string, any>();

    companions.forEach((companion: any) => {
      const email = companion.email.toLowerCase();
      if (!deduplicatedByEmail.has(email) || companion.createdBy === userId) {
        deduplicatedByEmail.set(email, companion);
      }
    });

    const results = Array.from(deduplicatedByEmail.values()).map((companion: any) => ({
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

/**
 * Check if an email has a linked user account
 */
export const checkEmailForUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { email } = req.query;
  try {
    if (!email || !email.toString().trim()) {
      res.json({ hasUser: false, user: null });
      return;
    }

    const emailLower = email.toString().toLowerCase().trim();

    const user = await User.findOne({
      where: { email: emailLower },
      attributes: ['id', 'firstName', 'lastName', 'email'],
    });

    if (user) {
      res.json({
        hasUser: true,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      });
      return;
    }

    res.json({ hasUser: false, user: null });
  } catch (error) {
    res.status(500).json({ hasUser: false, error: 'Check failed' });
  }
};

/**
 * Get edit form for companion
 */
export const getEditCompanion = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
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
      res.status(404).json({ success: false, error: 'Companion not found' });
      return;
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

/**
 * Get edit form for companion (sidebar version)
 */
export const getEditCompanionSidebar = getEditCompanion;

/**
 * Update companion details
 */
export const updateCompanion = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMsg = errors
        .array()
        .map((e) => e.msg)
        .join(', ');

      res.status(400).json({ success: false, error: errorMsg });
      return;
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
      res.status(404).json({ success: false, error: errorMsg });
      return;
    }

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
        res.status(400).json({ success: false, error: errorMsg });
        return;
      }

      const existingUser = await User.findOne({
        where: { email: emailLower },
      });

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
      res.json({
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
      return;
    }

    res.json({ success: true, message: successMsg });
  } catch (error) {
    logger.error(error);
    const errorMsg = 'Error updating companion';
    const isAjax = isAjaxRequest(req);
    if (isAjax) {
      res.status(500).json({ success: false, error: errorMsg });
      return;
    }
    res.status(500).json({ success: false, error: errorMsg });
  }
};

/**
 * Delete companion
 */
export const deleteCompanion = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
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
      res.status(404).json({ success: false, error: errorMsg });
      return;
    }

    await companion.destroy();

    const successMsg = 'Companion deleted successfully';
    if (isAjax) {
      res.json({ success: true, message: successMsg });
      return;
    }

    res.json({ success: true, message: successMsg });
  } catch (error) {
    logger.error(error);
    const errorMsg = 'Error deleting companion';
    const isAjax = isAjaxRequest(req);
    if (isAjax) {
      res.status(500).json({ success: false, error: errorMsg });
      return;
    }
    res.status(500).json({ success: false, error: errorMsg });
  }
};

/**
 * Remove linked account (unlink companion from user account)
 */
export const unlinkCompanion = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
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
      res.status(404).json({ success: false, error: errorMsg });
      return;
    }

    await companion.update({ userId: null });

    const successMsg = 'Companion account unlinked successfully';
    if (isAjax) {
      res.json({ success: true, message: successMsg });
      return;
    }

    res.json({ success: true, message: successMsg });
  } catch (error) {
    logger.error(error);
    const errorMsg = 'Error unlinking companion';
    const isAjax = isAjaxRequest(req);
    if (isAjax) {
      res.status(500).json({ success: false, error: errorMsg });
      return;
    }
    res.status(500).json({ success: false, error: errorMsg });
  }
};
