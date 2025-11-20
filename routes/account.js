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

// GET companions sidebar content (AJAX)
router.get('/companions-sidebar', accountController.getCompanionsSidebar);

// PUT update profile (name, email)
router.put('/profile', validateProfileUpdate, accountController.updateProfile);

// PUT change password
router.put('/password', validatePasswordChange, accountController.changePassword);

// PUT revoke companion access
router.put('/companions/:companionId/revoke', accountController.revokeCompanionAccess);

// GET vouchers page
router.get('/vouchers', accountController.getVouchers);

// GET vouchers sidebar content (AJAX)
router.get('/vouchers/sidebar', accountController.getVouchersSidebar);

// GET voucher details (AJAX)
router.get('/vouchers/:voucherId/details', accountController.getVoucherDetails);

module.exports = router;
