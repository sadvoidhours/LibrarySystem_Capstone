const express = require('express');
const { param } = require('express-validator');
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  requestBorrowValidation,
  approveRejectValidation,
  scanBorrowValidation,
  scanReturnValidation,
  myBorrowings,
  requestBorrow,
  approveBorrow,
  rejectBorrow,
  scanBorrow,
  scanReturn,
  pendingBorrowings
} = require('../controllers/borrowing.controller');

const router = express.Router();
const borrowingIdParamValidation = [param('id').isMongoId().withMessage('Invalid borrowing id')];

router.get('/my', protect, authorize('student', 'faculty'), myBorrowings);
router.post('/request', protect, authorize('student', 'faculty'), requestBorrowValidation, validate, requestBorrow);
router.get('/pending', protect, authorize('admin', 'superadmin'), pendingBorrowings);
router.patch('/:id/approve', protect, authorize('admin', 'superadmin'), borrowingIdParamValidation, approveRejectValidation, validate, approveBorrow);
router.patch('/:id/reject', protect, authorize('admin', 'superadmin'), borrowingIdParamValidation, approveRejectValidation, validate, rejectBorrow);
router.post('/scan/borrow', protect, authorize('admin', 'superadmin'), scanBorrowValidation, validate, scanBorrow);
router.post('/scan/return', protect, authorize('admin', 'superadmin'), scanReturnValidation, validate, scanReturn);
router.post('/notify/due', protect, authorize('admin', 'superadmin'), require('../controllers/borrowing.controller').sendDueRemindersManual);
router.post('/notify/penalty', protect, authorize('admin', 'superadmin'), require('../controllers/borrowing.controller').sendPenaltyRemindersManual);

module.exports = router;
