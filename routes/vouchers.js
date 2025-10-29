const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');
const voucherAttachmentController = require('../controllers/voucherAttachmentController');
const { ensureAuthenticated } = require('../middleware/auth');

// All routes require authentication
router.use(ensureAuthenticated);

// Voucher Management Routes
router.post('/', voucherController.createVoucher);
router.get('/', voucherController.getUserVouchers);
router.get('/:voucherId', voucherController.getVoucherById);
router.put('/:voucherId', voucherController.updateVoucher);
router.delete('/:voucherId', voucherController.deleteVoucher);
router.post('/:voucherId/reissue-remainder', voucherController.reissueRemainder);
router.patch('/:voucherId/partial-number', voucherAttachmentController.updatePartialVoucherNumber);

// Get available vouchers for a specific flight
router.get('/available-for-flight/:flightId', voucherController.getAvailableVouchersForFlight);

// Flight Voucher Attachment Routes
router.post('/flights/:flightId/attach', voucherAttachmentController.attachVoucher);
router.post('/flights/:flightId/attach-multiple', voucherAttachmentController.attachMultipleVouchers);
router.get('/flights/:flightId/attachments', voucherAttachmentController.getFlightAttachments);
router.put('/flights/:flightId/attachments/:attachmentId', voucherAttachmentController.updateAttachment);
router.delete('/flights/:flightId/attachments/:attachmentId', voucherAttachmentController.removeAttachment);

module.exports = router;
