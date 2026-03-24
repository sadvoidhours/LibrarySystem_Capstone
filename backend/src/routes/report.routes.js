const express = require('express');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { adminOverview, borrowingReport, penaltiesReport } = require('../controllers/report.controller');

const router = express.Router();

router.get('/overview', protect, authorize('admin', 'superadmin'), adminOverview);
router.get('/borrowings', protect, authorize('admin', 'superadmin'), borrowingReport);
router.get('/penalties', protect, authorize('admin', 'superadmin'), penaltiesReport);

module.exports = router;
