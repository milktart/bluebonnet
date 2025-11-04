const express = require('express');
const router = express.Router();
const companionController = require('../controllers/companionController');
const { ensureAuthenticated } = require('../middleware/auth');
const { body } = require('express-validator');

// All companion routes require authentication
router.use(ensureAuthenticated);

// Validation middleware for companion creation/update
const validateCompanion = [
  body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().trim()
];

// GET companions list
router.get('/', companionController.listCompanions);

// GET companions sidebar content (AJAX)
router.get('/sidebar', companionController.listCompanionsSidebar);

// GET companions as JSON (for dashboard/sidebar display)
router.get('/api/json', companionController.getCompanionsJson);

// GET create companion form
router.get('/create', companionController.getCreateCompanion);

// GET create companion form (sidebar version)
router.get('/sidebar/create', companionController.getCreateCompanionSidebar);

// POST create companion
router.post('/', validateCompanion, companionController.createCompanion);

// GET edit companion form
router.get('/:id/edit', companionController.getEditCompanion);

// GET edit companion form (sidebar version)
router.get('/:id/sidebar/edit', companionController.getEditCompanionSidebar);

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

module.exports = router;