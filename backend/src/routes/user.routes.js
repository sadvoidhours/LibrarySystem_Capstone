const express = require('express');
const { param } = require('express-validator');
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
	getMe,
	updateMe,
	deleteMe,
	changePasswordValidation,
	changePassword,
	myBarcodeQR,
	listPendingUsers,
	verifyUser,
	rejectUser
} = require('../controllers/user.controller');

const router = express.Router();
const userIdParamValidation = [param('id').isMongoId().withMessage('Invalid user id')];

router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);
router.delete('/me', protect, deleteMe);
router.patch('/me/password', protect, changePasswordValidation, validate, changePassword);
router.get('/me/barcode', protect, myBarcodeQR);
router.get('/pending-verification', protect, authorize('admin', 'superadmin'), listPendingUsers);
router.patch('/:id/verify', protect, authorize('admin', 'superadmin'), userIdParamValidation, validate, verifyUser);
router.patch('/:id/reject', protect, authorize('admin', 'superadmin'), userIdParamValidation, validate, rejectUser);

module.exports = router;
