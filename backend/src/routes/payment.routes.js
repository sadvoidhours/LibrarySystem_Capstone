const express = require('express');
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { paymentValidation, recordPayment, myPayments, listPayments } = require('../controllers/payment.controller');

const router = express.Router();

router.get('/my', protect, authorize('student', 'admin', 'superadmin'), myPayments);
router.get('/', protect, authorize('admin', 'superadmin'), listPayments);
router.post('/', protect, authorize('student', 'admin', 'superadmin'), paymentValidation, validate, recordPayment);

module.exports = router;
