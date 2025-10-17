const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { ensureAuthenticated } = require('../middleware/auth');
const { validateProfileUpdate, validatePasswordChange } = require('../middleware/validation');

// All account routes require authentication
router.use(ensureAuthenticated);

// GET account settings page
router.get('/', accountController.getAccountSettings);

// GET account settings sidebar content (AJAX)
router.get('/sidebar', accountController.getAccountSettingsSidebar);

// PUT update profile (name, email)
router.put('/profile', validateProfileUpdate, accountController.updateProfile);

// PUT change password
router.put('/password', validatePasswordChange, accountController.changePassword);

// PUT revoke companion access
router.put('/companions/:companionId/revoke', accountController.revokeCompanionAccess);

module.exports = router;