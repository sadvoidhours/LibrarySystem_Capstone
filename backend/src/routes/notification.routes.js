const express = require('express');
const { param } = require('express-validator');
const { protect } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { myNotifications, markRead } = require('../controllers/notification.controller');

const router = express.Router();
const notificationIdParamValidation = [param('id').isMongoId().withMessage('Invalid notification id')];

router.get('/my', protect, myNotifications);
router.patch('/:id/read', protect, notificationIdParamValidation, validate, markRead);

module.exports = router;
