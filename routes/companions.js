const express = require('express');

const router = express.Router();
const { body } = require('express-validator');
// Import TypeScript controller - will work after build
const companionController = require('../controllers/companionController');
const { ensureAuthenticated } = require('../middleware/auth');
const { middleware: ajaxDetection } = require('../middleware/ajaxDetection');

// All companion routes require authentication
router.use(ensureAuthenticated);

// Apply AJAX detection middleware to populate req.isAjax
router.use(ajaxDetection());

// Validation middleware for companion creation/update
const validateCompanion = [
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('name').optional().trim(),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().trim(),
];

// GET companions list (unified endpoint - AJAX detection determines response format)
router.get('/', companionController.listCompanions);

// GET companions as JSON (for dashboard/sidebar display)
router.get('/api/json', companionController.getCompanionsJson);

// GET all companions with bidirectional relationship info
router.get('/api/all', companionController.getAllCompanions);

// GET create companion form
router.get('/create', companionController.getCreateCompanion);

// POST create companion
router.post('/', validateCompanion, companionController.createCompanion);

// GET edit companion form (unified endpoint - works for both sidebar and regular)
router.get('/:id/edit', companionController.getEditCompanion);

// PUT update companion
router.put('/:id', validateCompanion, companionController.updateCompanion);

// DELETE companion
router.delete('/:id', companionController.deleteCompanion);

// PUT update companion permissions
router.put('/:id/permissions', companionController.updateCompanionPermissions);

// PUT unlink companion from account
router.put('/:id/unlink', companionController.unlinkCompanion);

// API endpoint for autocomplete search
router.get('/api/search', companionController.searchCompanions);

// API endpoint to check if email has a linked user account
router.get('/api/check-email', companionController.checkEmailForUser);

// Backward compatibility: kept for any legacy requests but now point to consolidated endpoints
router.get('/sidebar', companionController.listCompanions);
router.get('/sidebar/create', companionController.getCreateCompanion);
router.get('/:id/sidebar/edit', companionController.getEditCompanion);

module.exports = router;
