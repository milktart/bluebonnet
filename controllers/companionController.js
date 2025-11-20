const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const { TravelCompanion, User } = require('../models');
const logger = require('../utils/logger');

// Get all companions for current user
exports.listCompanions = async (req, res) => {
  try {
    const companions = await TravelCompanion.findAll({
      where: { createdBy: req.user.id },
      include: [
        {
          model: User,
          as: 'linkedAccount',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['name', 'ASC']],
    });

    res.render('companions/list', {
      title: 'Travel Companions',
      companions,
    });
  } catch (error) {
    logger.error(error);
    req.flash('error_msg', 'Error loading companions');
    res.redirect('/');
  }
};

// Get companions list sidebar content (AJAX)
exports.listCompanionsSidebar = async (req, res) => {
  try {
    const companions = await TravelCompanion.findAll({
      where: { createdBy: req.user.id },
      include: [
        {
          model: User,
          as: 'linkedAccount',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['name', 'ASC']],
    });

    res.render('partials/companions-list', {
      companions,
      layout: false, // Don't use main layout, just render the partial
    });
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
      where: { createdBy: req.user.id },
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

// Get form to create new companion
exports.getCreateCompanion = (req, res) => {
  res.render('companions/create', { title: 'Add Travel Companion' });
};

// Get form to create new companion (sidebar version)
exports.getCreateCompanionSidebar = (req, res) => {
  try {
    res.render('partials/companions-create', {
      layout: false,
    });
  } catch (error) {
    logger.error(error);
    res
      .status(500)
      .send(
        '<div class="p-4"><p class="text-red-600">Error loading form. Please try again.</p></div>'
      );
  }
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
      const isAjax = req.get('X-Sidebar-Request') === 'true' || req.xhr;

      if (isAjax) {
        return res.status(400).json({ success: false, error: errorMsg });
      }
      req.flash('error_msg', errorMsg);
      return res.redirect('/companions/create');
    }

    const { name, email, phone, canBeAddedByOthers } = req.body;
    const isAjax = req.get('X-Sidebar-Request') === 'true' || req.xhr;

    // Check if companion with this email already exists for this user
    const existingCompanion = await TravelCompanion.findOne({
      where: {
        email: email.toLowerCase(),
        createdBy: req.user.id,
      },
    });

    if (existingCompanion) {
      const errorMsg = 'You already have a companion with this email address';
      if (isAjax) {
        return res.status(400).json({ success: false, error: errorMsg });
      }
      req.flash('error_msg', errorMsg);
      return res.redirect('/companions/create');
    }

    // Check if there's already a user account with this email to auto-link
    const existingUser = await User.findOne({
      where: { email: email.toLowerCase() },
    });

    const companion = await TravelCompanion.create({
      name,
      email: email.toLowerCase(),
      phone,
      canBeAddedByOthers: !!canBeAddedByOthers,
      createdBy: req.user.id,
      userId: existingUser ? existingUser.id : null,
    });

    const successMsg = existingUser
      ? 'Travel companion added and linked to existing account'
      : 'Travel companion added successfully';

    if (isAjax) {
      return res.json({ success: true, message: successMsg, companion });
    }

    req.flash('success_msg', successMsg);
    res.redirect('/companions');
  } catch (error) {
    logger.error(error);
    const errorMsg = 'Error adding travel companion';
    if (req.get('X-Sidebar-Request') === 'true' || req.xhr) {
      return res.status(500).json({ success: false, error: errorMsg });
    }
    req.flash('error_msg', errorMsg);
    res.redirect('/companions/create');
  }
};

// Update companion permissions
exports.updateCompanionPermissions = async (req, res) => {
  try {
    const { canBeAddedByOthers } = req.body;
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
      req.flash('error_msg', errorMsg);
      return res.redirect('/companions');
    }

    await companion.update({
      canBeAddedByOthers: !!canBeAddedByOthers,
    });

    const successMsg = 'Companion permissions updated';
    if (isAjax) {
      return res.json({ success: true, message: successMsg });
    }

    req.flash('success_msg', successMsg);
    res.redirect('/companions');
  } catch (error) {
    logger.error(error);
    const errorMsg = 'Error updating companion permissions';
    if (req.get('X-Sidebar-Request') === 'true' || req.xhr) {
      return res.status(500).json({ success: false, error: errorMsg });
    }
    req.flash('error_msg', errorMsg);
    res.redirect('/companions');
  }
};

// API endpoint for autocomplete search
exports.searchCompanions = async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.user.id;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    // Search companions that:
    // 1. User created themselves, OR
    // 2. Other users created but marked as canBeAddedByOthers=true
    const companions = await TravelCompanion.findAll({
      where: {
        [Op.or]: [{ createdBy: userId }, { canBeAddedByOthers: true }],
        [Op.or]: [{ name: { [Op.iLike]: `%${q}%` } }, { email: { [Op.iLike]: `%${q}%` } }],
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

    const results = companions.map((companion) => ({
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
    logger.error(error);
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
      req.flash('error_msg', 'Companion not found');
      return res.redirect('/companions');
    }

    res.render('companions/edit', {
      title: 'Edit Travel Companion',
      companion,
    });
  } catch (error) {
    logger.error(error);
    req.flash('error_msg', 'Error loading companion');
    res.redirect('/companions');
  }
};

// Get edit form for companion (sidebar version)
exports.getEditCompanionSidebar = async (req, res) => {
  try {
    const companion = await TravelCompanion.findOne({
      where: {
        id: req.params.id,
        createdBy: req.user.id,
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
      return res
        .status(404)
        .send('<div class="p-4"><p class="text-red-600">Companion not found</p></div>');
    }

    res.render('partials/companions-edit', {
      companion,
      layout: false,
    });
  } catch (error) {
    logger.error(error);
    res
      .status(500)
      .send(
        '<div class="p-4"><p class="text-red-600">Error loading companion. Please try again.</p></div>'
      );
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
      const isAjax = req.get('X-Sidebar-Request') === 'true' || req.xhr;

      if (isAjax) {
        return res.status(400).json({ success: false, error: errorMsg });
      }
      req.flash('error_msg', errorMsg);
      return res.redirect(`/companions/${req.params.id}/edit`);
    }

    const { name, email, phone, canBeAddedByOthers } = req.body;
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
      req.flash('error_msg', errorMsg);
      return res.redirect('/companions');
    }

    // Check if email is being changed and if it conflicts
    if (email.toLowerCase() !== companion.email) {
      const existingCompanion = await TravelCompanion.findOne({
        where: {
          email: email.toLowerCase(),
          createdBy: req.user.id,
          id: { [Op.ne]: companionId },
        },
      });

      if (existingCompanion) {
        const errorMsg = 'You already have a companion with this email address';
        if (isAjax) {
          return res.status(400).json({ success: false, error: errorMsg });
        }
        req.flash('error_msg', errorMsg);
        return res.redirect(`/companions/${companionId}/edit`);
      }

      // Check if there's a user account to link to
      const existingUser = await User.findOne({
        where: { email: email.toLowerCase() },
      });

      await companion.update({
        name,
        email: email.toLowerCase(),
        phone,
        canBeAddedByOthers: !!canBeAddedByOthers,
        userId: existingUser ? existingUser.id : null,
      });
    } else {
      await companion.update({
        name,
        phone,
        canBeAddedByOthers: !!canBeAddedByOthers,
      });
    }

    const successMsg = 'Companion updated successfully';
    if (isAjax) {
      return res.json({ success: true, message: successMsg, companion });
    }

    req.flash('success_msg', successMsg);
    res.redirect('/companions');
  } catch (error) {
    logger.error(error);
    const errorMsg = 'Error updating companion';
    if (req.get('X-Sidebar-Request') === 'true' || req.xhr) {
      return res.status(500).json({ success: false, error: errorMsg });
    }
    req.flash('error_msg', errorMsg);
    res.redirect(`/companions/${req.params.id}/edit`);
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
      },
    });

    if (!companion) {
      const errorMsg = 'Companion not found';
      if (isAjax) {
        return res.status(404).json({ success: false, error: errorMsg });
      }
      req.flash('error_msg', errorMsg);
      return res.redirect('/companions');
    }

    await companion.destroy();

    const successMsg = 'Companion deleted successfully';
    if (isAjax) {
      return res.json({ success: true, message: successMsg });
    }

    req.flash('success_msg', successMsg);
    res.redirect('/companions');
  } catch (error) {
    logger.error(error);
    const errorMsg = 'Error deleting companion';
    if (req.get('X-Sidebar-Request') === 'true' || req.xhr) {
      return res.status(500).json({ success: false, error: errorMsg });
    }
    req.flash('error_msg', errorMsg);
    res.redirect('/companions');
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
      req.flash('error_msg', errorMsg);
      return res.redirect('/companions');
    }

    await companion.update({ userId: null });

    const successMsg = 'Companion account unlinked successfully';
    if (isAjax) {
      return res.json({ success: true, message: successMsg });
    }

    req.flash('success_msg', successMsg);
    res.redirect('/companions');
  } catch (error) {
    logger.error(error);
    const errorMsg = 'Error unlinking companion';
    if (req.get('X-Sidebar-Request') === 'true' || req.xhr) {
      return res.status(500).json({ success: false, error: errorMsg });
    }
    req.flash('error_msg', errorMsg);
    res.redirect('/companions');
  }
};
