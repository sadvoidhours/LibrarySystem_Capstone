const express = require('express');
const { body, param } = require('express-validator');
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  createAdminValidation,
  createAdmin,
  getOverview,
  getUserGrowthReport,
  listUsers,
  updateUserRole,
  deleteBookRecord,
  deleteUserRecord,
  restoreUserRecord,
  getAuditLogs,
  generateBookBarcodes,
  sendBrevoTest
} = require('../controllers/superadmin.controller');

const router = express.Router();
const userIdParamValidation = [param('id').isMongoId().withMessage('Invalid user id')];
const bookIdParamValidation = [param('id').isMongoId().withMessage('Invalid book id')];

router.use(protect, authorize('superadmin'));

router.post('/admins', createAdminValidation, validate, createAdmin);
router.get('/overview', getOverview);
router.get('/user-growth', getUserGrowthReport);
router.get('/admins', listUsers);
router.get('/users', listUsers);
router.patch('/users/:id/role', userIdParamValidation, body('role').isIn(['student', 'faculty', 'admin', 'superadmin']), validate, updateUserRole);
router.delete('/books/:id', bookIdParamValidation, validate, deleteBookRecord);
router.patch('/users/:id/archive', userIdParamValidation, validate, deleteUserRecord);
router.patch('/users/:id/restore', userIdParamValidation, validate, restoreUserRecord);
router.get('/audit-logs', getAuditLogs);
router.post('/barcodes/books/batch', generateBookBarcodes);
router.post('/brevo/test', body('to').optional().isEmail(), body('subject').optional().isString().isLength({ min: 1, max: 120 }), body('message').optional().isString().isLength({ min: 1, max: 2000 }), validate, sendBrevoTest);

module.exports = router;
