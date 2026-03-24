const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  createAdminValidation,
  createAdmin,
  getOverview,
  listUsers,
  updateUserRole,
  deleteBookRecord,
  deleteUserRecord,
  getAuditLogs,
  generateBookBarcodes,
  sendMailtrapTest
} = require('../controllers/superadmin.controller');

const router = express.Router();

router.use(protect, authorize('superadmin'));

router.post('/admins', createAdminValidation, validate, createAdmin);
router.get('/overview', getOverview);
router.get('/admins', listUsers);
router.get('/users', listUsers);
router.patch('/users/:id/role', body('role').isIn(['student', 'faculty', 'admin', 'superadmin']), validate, updateUserRole);
router.delete('/books/:id', deleteBookRecord);
router.delete('/users/:id', deleteUserRecord);
router.get('/audit-logs', getAuditLogs);
router.post('/barcodes/books/batch', generateBookBarcodes);
router.post('/mailtrap/test', body('to').optional().isEmail(), body('subject').optional().isString().isLength({ min: 1, max: 120 }), body('message').optional().isString().isLength({ min: 1, max: 2000 }), validate, sendMailtrapTest);

module.exports = router;
