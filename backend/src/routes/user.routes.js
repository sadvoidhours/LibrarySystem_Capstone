const express = require('express');
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
	getMe,
	updateMe,
	changePasswordValidation,
	changePassword,
	myBarcodeQR,
	listPendingUsers,
	verifyUser,
	rejectUser
} = require('../controllers/user.controller');

const router = express.Router();

router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);
router.patch('/me/password', protect, changePasswordValidation, validate, changePassword);
router.get('/me/barcode', protect, myBarcodeQR);
router.get('/pending-verification', protect, authorize('admin', 'superadmin'), listPendingUsers);
router.patch('/:id/verify', protect, authorize('admin', 'superadmin'), verifyUser);
router.patch('/:id/reject', protect, authorize('admin', 'superadmin'), rejectUser);

module.exports = router;
