const bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');
const { User, TravelCompanion, Voucher } = require('../models');
const versionInfo = require('../utils/version');

exports.getAccountSettings = async (req, res) => {
  try {
    // Get companion profiles where this user is linked
    const linkedCompanions = await TravelCompanion.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.render('account/settings', {
      title: 'Account Settings',
      user: req.user,
      linkedCompanions,
      versionInfo,
    });
  } catch (error) {
    logger.error('Error loading account settings:', error);
    req.flash('error_msg', 'Error loading account settings');
    res.redirect('/trips');
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    const userId = req.user.id;

    // Check if email is already taken by another user
    if (email !== req.user.email) {
      const existingUser = await User.findOne({
        where: {
          email: email.toLowerCase(),
          id: { [require('sequelize').Op.ne]: userId },
        },
      });

      if (existingUser) {
        req.flash('error_msg', 'Email address is already taken by another user');
        return res.redirect('/account');
      }
    }

    // Update user profile
    await User.update(
      {
        firstName,
        lastName,
        email: email.toLowerCase(),
      },
      {
        where: { id: userId },
      }
    );

    // Update the user object in session
    req.user.firstName = firstName;
    req.user.lastName = lastName;
    req.user.email = email.toLowerCase();

    req.flash('success_msg', 'Profile updated successfully');
    res.redirect('/account');
  } catch (error) {
    logger.error('Profile update error:', error);
    req.flash('error_msg', 'An error occurred while updating your profile');
    res.redirect('/account');
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    // Verify current password
    const user = await User.findByPk(userId);
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      req.flash('error_msg', 'Current password is incorrect');
      return res.redirect('/account');
    }

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      req.flash('error_msg', 'New passwords do not match');
      return res.redirect('/account');
    }

    // Hash new password and update
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await User.update(
      {
        password: hashedNewPassword,
      },
      {
        where: { id: userId },
      }
    );

    req.flash('success_msg', 'Password changed successfully');
    res.redirect('/account');
  } catch (error) {
    logger.error('Password change error:', error);
    req.flash('error_msg', 'An error occurred while changing your password');
    res.redirect('/account');
  }
};

exports.getAccountSettingsSidebar = async (req, res) => {
  try {
    // Get all companion profiles where this user is linked
    const companionProfiles = await TravelCompanion.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.render('partials/account-forms', {
      user: req.user,
      companionProfiles,
      isSidebarRequest: true,
      layout: false, // Don't use main layout, just render the partial
    });
  } catch (error) {
    logger.error('Error loading account settings sidebar:', error);
    res
      .status(500)
      .send(
        '<div class="p-4"><p class="text-red-600">Error loading account settings. Please try again.</p></div>'
      );
  }
};

exports.getCompanionsSidebar = async (req, res) => {
  try {
    // Simply render the companions sidebar partial
    // The partial will load companion data via JavaScript API calls
    res.render('partials/account-companions-sidebar', {
      user: req.user,
      layout: false, // Don't use main layout, just render the partial
    });
  } catch (error) {
    logger.error('Error loading companions sidebar:', error);
    res
      .status(500)
      .send(
        '<div class="p-4"><p class="text-red-600">Error loading companions. Please try again.</p></div>'
      );
  }
};

exports.revokeCompanionAccess = async (req, res) => {
  try {
    const { companionId } = req.params;
    const isAjax = req.get('X-Sidebar-Request') === 'true' || req.xhr;

    // Find and update the companion to unlink this user
    const companion = await TravelCompanion.findOne({
      where: {
        id: companionId,
        userId: req.user.id,
      },
    });

    if (!companion) {
      const errorMsg = 'Companion access not found';
      if (isAjax) {
        return res.status(404).json({ success: false, error: errorMsg });
      }
      req.flash('error_msg', errorMsg);
      return res.redirect('/account');
    }

    await companion.update({ userId: null });

    const successMsg = 'Companion access revoked successfully';
    if (isAjax) {
      return res.json({ success: true, message: successMsg });
    }

    req.flash('success_msg', successMsg);
    res.redirect('/account');
  } catch (error) {
    logger.error('Error revoking companion access:', error);
    const errorMsg = 'Error revoking companion access';
    if (req.get('X-Sidebar-Request') === 'true' || req.xhr) {
      return res.status(500).json({ success: false, error: errorMsg });
    }
    req.flash('error_msg', errorMsg);
    res.redirect('/account');
  }
};

exports.getVouchers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, type } = req.query;

    const where = {
      [Sequelize.Op.or]: [{ userId }, { userId: null }],
    };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const vouchers = await Voucher.findAll({
      where,
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Calculate remaining balance and expiration info for each voucher
    const vouchersWithInfo = vouchers.map((v) => {
      const vData = v.toJSON();
      vData.remainingBalance = v.getRemainingBalance();
      vData.daysUntilExpiration = v.getDaysUntilExpiration();
      vData.isExpired = v.getIsExpired();
      vData.usagePercent = Math.round((v.usedAmount / v.totalValue) * 100);
      return vData;
    });

    res.render('account/vouchers', {
      title: 'Travel Vouchers & Credits',
      user: req.user,
      vouchers: vouchersWithInfo,
    });
  } catch (error) {
    logger.error('Error loading vouchers:', error);
    req.flash('error_msg', 'Error loading vouchers');
    res.redirect('/account');
  }
};

exports.getVouchersSidebar = async (req, res) => {
  try {
    const userId = req.user.id;

    const vouchers = await Voucher.findAll({
      where: {
        [Sequelize.Op.or]: [{ userId }, { userId: null }],
      },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Calculate remaining balance and expiration info for each voucher
    const vouchersWithInfo = vouchers.map((v) => {
      const vData = v.toJSON();
      vData.remainingBalance = v.getRemainingBalance();
      vData.daysUntilExpiration = v.getDaysUntilExpiration();
      vData.isExpired = v.getIsExpired();
      vData.usagePercent = v.totalValue
        ? Math.round(((v.usedAmount || 0) / v.totalValue) * 100)
        : 0;
      return vData;
    });

    // Separate open and closed vouchers
    const openVouchers = vouchersWithInfo.filter(
      (v) => v.status === 'OPEN' || v.status === 'PARTIALLY_USED'
    );
    const closedVouchers = vouchersWithInfo.filter(
      (v) =>
        v.status === 'USED' ||
        v.status === 'EXPIRED' ||
        v.status === 'TRANSFERRED' ||
        v.status === 'CANCELLED'
    );

    res.render('partials/vouchers-sidebar', {
      openVouchers,
      closedVouchers,
      user: req.user,
      isSidebarRequest: true,
      layout: false,
    });
  } catch (error) {
    logger.error('Error loading vouchers sidebar:', error);
    res
      .status(500)
      .send(
        '<div class="p-4"><p class="text-red-600">Error loading vouchers. Please try again.</p></div>'
      );
  }
};

exports.getVoucherDetails = async (req, res) => {
  try {
    const { voucherId } = req.params;
    const userId = req.user.id;

    const voucher = await Voucher.findByPk(voucherId, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    if (!voucher) {
      return res
        .status(404)
        .send('<div class="p-4"><p class="text-red-600">Voucher not found</p></div>');
    }

    // Check authorization: user must be owner or voucher must be non-owner-bound
    if (voucher.userId && voucher.userId !== userId) {
      return res
        .status(403)
        .send(
          '<div class="p-4"><p class="text-red-600">Unauthorized to access this voucher</p></div>'
        );
    }

    // Calculate values
    const voucherData = voucher.toJSON();
    voucherData.remainingBalance = voucher.getRemainingBalance();
    voucherData.daysUntilExpiration = voucher.getDaysUntilExpiration();
    voucherData.isExpired = voucher.getIsExpired();
    voucherData.usagePercent = voucher.totalValue
      ? Math.round(((voucher.usedAmount || 0) / voucher.totalValue) * 100)
      : 0;

    res.render('partials/voucher-details-tertiary', {
      voucher: voucherData,
      layout: false,
    });
  } catch (error) {
    logger.error('Error loading voucher details:', error);
    res
      .status(500)
      .send(
        '<div class="p-4"><p class="text-red-600">Error loading voucher details. Please try again.</p></div>'
      );
  }
};
