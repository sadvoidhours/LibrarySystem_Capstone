const express = require('express');
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

router.get('/my', protect, authorize('student', 'faculty'), myBorrowings);
router.post('/request', protect, authorize('student', 'faculty'), requestBorrowValidation, validate, requestBorrow);
router.get('/pending', protect, authorize('admin', 'superadmin'), pendingBorrowings);
router.patch('/:id/approve', protect, authorize('admin', 'superadmin'), approveRejectValidation, validate, approveBorrow);
router.patch('/:id/reject', protect, authorize('admin', 'superadmin'), approveRejectValidation, validate, rejectBorrow);
router.post('/scan/borrow', protect, authorize('admin', 'superadmin'), scanBorrowValidation, validate, scanBorrow);
router.post('/scan/return', protect, authorize('admin', 'superadmin'), scanReturnValidation, validate, scanReturn);

module.exports = router;
