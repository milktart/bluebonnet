const express = require('express');
const multer = require('multer');

const router = express.Router();
const accountController = require('../controllers/accountController');
const { ensureAuthenticated } = require('../middleware/auth');
const { validateProfileUpdate, validatePasswordChange } = require('../middleware/validation');

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/json') {
      cb(new Error('Only JSON files are allowed'));
    } else {
      cb(null, true);
    }
  },
});

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

// GET export account data
router.get('/export', accountController.exportAccountData);

// POST import account data
router.post('/import', upload.single('file'), accountController.importAccountData);

module.exports = router;
