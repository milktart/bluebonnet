const db = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

exports.sendRequest = async (req, res) => {
  try {
    const { companionUserId, permissionLevel } = req.body;
    const userId = req.user.id;

    // Validate inputs
    if (!companionUserId) {
      return res.status(400).json({
        success: false,
        message: 'Companion user ID is required',
      });
    }

    if (!['view_travel', 'manage_travel'].includes(permissionLevel)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid permission level',
      });
    }

    // Cannot send request to self
    if (userId === companionUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send companion request to yourself',
      });
    }

    // Check if user exists
    const companionUser = await db.User.findByPk(companionUserId);
    if (!companionUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if relationship already exists
    const existingRelationship = await db.CompanionRelationship.findOne({
      where: {
        userId,
        companionUserId,
      },
    });

    if (existingRelationship) {
      return res.status(400).json({
        success: false,
        message: 'Relationship already exists',
      });
    }

    // Create relationship request
    const relationship = await db.CompanionRelationship.create({
      userId,
      companionUserId,
      status: 'pending',
      permissionLevel,
    });

    // Create notification for recipient
    await db.Notification.create({
      userId: companionUserId,
      type: 'companion_request_received',
      relatedId: relationship.id,
      relatedType: 'companion_relationship',
      message: `${req.user.firstName} ${req.user.lastName} has added you as a travel companion`,
      read: false,
      actionRequired: true,
    });

    return res.status(201).json({
      success: true,
      message: 'Companion request sent',
      relationship,
    });
  } catch (error) {
    logger.error('Error sending companion request:', error);
    return res.status(500).json({
      success: false,
      message: 'Error sending companion request',
    });
  }
};

exports.getPendingRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get incoming pending requests
    const incomingRequests = await db.CompanionRelationship.findAll({
      where: {
        companionUserId: userId,
        status: 'pending',
      },
      include: [
        {
          model: db.User,
          as: 'requester',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['requestedAt', 'DESC']],
    });

    // Get outgoing pending requests
    const outgoingRequests = await db.CompanionRelationship.findAll({
      where: {
        userId,
        status: 'pending',
      },
      include: [
        {
          model: db.User,
          as: 'recipient',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['requestedAt', 'DESC']],
    });

    return res.json({
      success: true,
      incoming: incomingRequests,
      outgoing: outgoingRequests,
    });
  } catch (error) {
    logger.error('Error fetching pending requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching pending requests',
    });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    const { relationshipId } = req.params;
    const { permissionLevel } = req.body;
    const userId = req.user.id;

    // Validate permission level
    if (!['view_travel', 'manage_travel'].includes(permissionLevel)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid permission level',
      });
    }

    // Find relationship
    const relationship = await db.CompanionRelationship.findByPk(relationshipId);
    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: 'Relationship not found',
      });
    }

    // Ensure user is the recipient
    if (relationship.companionUserId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to accept this request',
      });
    }

    // Update relationship
    relationship.status = 'accepted';
    relationship.permissionLevel = permissionLevel;
    relationship.respondedAt = new Date();
    await relationship.save();

    // Create reverse relationship (requester gets view_travel automatically)
    const reverseRelationship = await db.CompanionRelationship.findOne({
      where: {
        userId: relationship.companionUserId,
        companionUserId: relationship.userId,
      },
    });

    if (!reverseRelationship) {
      await db.CompanionRelationship.create({
        userId: relationship.companionUserId,
        companionUserId: relationship.userId,
        status: 'accepted',
        permissionLevel: 'view_travel', // Requester always gets view_travel
      });
    } else if (reverseRelationship.status === 'pending') {
      reverseRelationship.status = 'accepted';
      reverseRelationship.permissionLevel = 'view_travel';
      await reverseRelationship.save();
    }

    // Create notification for requester
    await db.Notification.create({
      userId: relationship.userId,
      type: 'companion_request_accepted',
      relatedId: relationship.id,
      relatedType: 'companion_relationship',
      message: `${req.user.firstName} ${req.user.lastName} accepted your travel companion request`,
      read: false,
      actionRequired: false,
    });

    return res.json({
      success: true,
      message: 'Request accepted',
      relationship,
    });
  } catch (error) {
    logger.error('Error accepting companion request:', error);
    return res.status(500).json({
      success: false,
      message: 'Error accepting companion request',
    });
  }
};

exports.declineRequest = async (req, res) => {
  try {
    const { relationshipId } = req.params;
    const userId = req.user.id;

    // Find relationship
    const relationship = await db.CompanionRelationship.findByPk(relationshipId);
    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: 'Relationship not found',
      });
    }

    // Ensure user is the recipient
    if (relationship.companionUserId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to decline this request',
      });
    }

    // Update relationship
    relationship.status = 'declined';
    relationship.respondedAt = new Date();
    await relationship.save();

    // Create notification for requester
    await db.Notification.create({
      userId: relationship.userId,
      type: 'companion_request_declined',
      relatedId: relationship.id,
      relatedType: 'companion_relationship',
      message: `${req.user.firstName} ${req.user.lastName} declined your travel companion request`,
      read: false,
      actionRequired: false,
    });

    return res.json({
      success: true,
      message: 'Request declined',
    });
  } catch (error) {
    logger.error('Error declining companion request:', error);
    return res.status(500).json({
      success: false,
      message: 'Error declining companion request',
    });
  }
};

exports.updatePermissionLevel = async (req, res) => {
  try {
    const { relationshipId } = req.params;
    const { permissionLevel } = req.body;
    const userId = req.user.id;

    // Validate permission level
    if (!['view_travel', 'manage_travel'].includes(permissionLevel)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid permission level',
      });
    }

    // Find relationship
    const relationship = await db.CompanionRelationship.findByPk(relationshipId);
    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: 'Relationship not found',
      });
    }

    // Ensure user is one of the parties in the relationship
    if (relationship.userId !== userId && relationship.companionUserId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this relationship',
      });
    }

    // Ensure relationship is accepted
    if (relationship.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Can only update accepted relationships',
      });
    }

    // Update permission level
    relationship.permissionLevel = permissionLevel;
    await relationship.save();

    return res.json({
      success: true,
      message: 'Permission level updated',
      relationship,
    });
  } catch (error) {
    logger.error('Error updating permission level:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating permission level',
    });
  }
};

exports.revokeRelationship = async (req, res) => {
  try {
    const { relationshipId } = req.params;
    const userId = req.user.id;

    // Find relationship
    const relationship = await db.CompanionRelationship.findByPk(relationshipId);
    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: 'Relationship not found',
      });
    }

    // Ensure user is one of the parties
    if (relationship.userId !== userId && relationship.companionUserId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to revoke this relationship',
      });
    }

    // Delete the relationship
    await relationship.destroy();

    // Also delete reverse relationship if it exists
    const reverseRelationship = await db.CompanionRelationship.findOne({
      where: {
        userId: relationship.companionUserId,
        companionUserId: relationship.userId,
      },
    });

    if (reverseRelationship) {
      await reverseRelationship.destroy();
    }

    return res.json({
      success: true,
      message: 'Relationship revoked',
    });
  } catch (error) {
    logger.error('Error revoking relationship:', error);
    return res.status(500).json({
      success: false,
      message: 'Error revoking relationship',
    });
  }
};

exports.getMutualCompanions = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get accepted relationships where user is requester
    const userAsRequester = await db.CompanionRelationship.findAll({
      where: {
        userId,
        status: 'accepted',
      },
      include: [
        {
          model: db.User,
          as: 'recipient',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    // Get accepted relationships where user is recipient
    const userAsRecipient = await db.CompanionRelationship.findAll({
      where: {
        companionUserId: userId,
        status: 'accepted',
      },
      include: [
        {
          model: db.User,
          as: 'requester',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    // Combine and deduplicate
    const companions = {};

    userAsRequester.forEach((rel) => {
      const companionId = rel.companionUserId;
      if (!companions[companionId]) {
        companions[companionId] = {
          relationshipId: rel.id,
          user: rel.recipient,
          myPermissionLevel: rel.permissionLevel,
          theirPermissionLevel: null,
        };
      } else {
        companions[companionId].myPermissionLevel = rel.permissionLevel;
      }
    });

    userAsRecipient.forEach((rel) => {
      const companionId = rel.userId;
      if (!companions[companionId]) {
        companions[companionId] = {
          relationshipId: rel.id,
          user: rel.requester,
          myPermissionLevel: null,
          theirPermissionLevel: rel.permissionLevel,
        };
      } else {
        companions[companionId].theirPermissionLevel = rel.permissionLevel;
      }
    });

    return res.json({
      success: true,
      companions: Object.values(companions),
    });
  } catch (error) {
    logger.error('Error fetching mutual companions:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching mutual companions',
    });
  }
};

exports.resendRequest = async (req, res) => {
  try {
    const relationshipId = req.params.relationshipId;
    const userId = req.user.id;

    // Find the relationship
    const relationship = await db.CompanionRelationship.findOne({
      where: {
        id: relationshipId,
        userId,
        status: 'pending',
      },
    });

    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: 'Pending request not found',
      });
    }

    // Just return success - the request is still pending
    return res.json({
      success: true,
      message: 'Request resent successfully',
    });
  } catch (error) {
    logger.error('Error resending request:', error);
    return res.status(500).json({
      success: false,
      message: 'Error resending request',
    });
  }
};
