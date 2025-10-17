const bcrypt = require('bcrypt');
const { User, TravelCompanion } = require('../models');

exports.getAccountSettings = async (req, res) => {
  try {
    // Get companion profiles where this user is linked
    const linkedCompanions = await TravelCompanion.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.render('account/settings', {
      title: 'Account Settings',
      user: req.user,
      linkedCompanions
    });
  } catch (error) {
    console.error('Error loading account settings:', error);
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
          id: { [require('sequelize').Op.ne]: userId }
        }
      });

      if (existingUser) {
        req.flash('error_msg', 'Email address is already taken by another user');
        return res.redirect('/account');
      }
    }

    // Update user profile
    await User.update({
      firstName,
      lastName,
      email: email.toLowerCase()
    }, {
      where: { id: userId }
    });

    // Update the user object in session
    req.user.firstName = firstName;
    req.user.lastName = lastName;
    req.user.email = email.toLowerCase();

    req.flash('success_msg', 'Profile updated successfully');
    res.redirect('/account');
  } catch (error) {
    console.error('Profile update error:', error);
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
    await User.update({
      password: hashedNewPassword
    }, {
      where: { id: userId }
    });

    req.flash('success_msg', 'Password changed successfully');
    res.redirect('/account');
  } catch (error) {
    console.error('Password change error:', error);
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
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.render('partials/account-forms', {
      user: req.user,
      companionProfiles,
      isSidebarRequest: true,
      layout: false  // Don't use main layout, just render the partial
    });
  } catch (error) {
    console.error('Error loading account settings sidebar:', error);
    res.status(500).send('<div class="p-4"><p class="text-red-600">Error loading account settings. Please try again.</p></div>');
  }
};

exports.revokeCompanionAccess = async (req, res) => {
  try {
    const companionId = req.params.companionId;
    const isAjax = req.get('X-Sidebar-Request') === 'true' || req.xhr;

    // Find and update the companion to unlink this user
    const companion = await TravelCompanion.findOne({
      where: {
        id: companionId,
        userId: req.user.id
      }
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
    console.error('Error revoking companion access:', error);
    const errorMsg = 'Error revoking companion access';
    if (req.get('X-Sidebar-Request') === 'true' || req.xhr) {
      return res.status(500).json({ success: false, error: errorMsg });
    }
    req.flash('error_msg', errorMsg);
    res.redirect('/account');
  }
};