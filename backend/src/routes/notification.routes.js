const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const { myNotifications, markRead } = require('../controllers/notification.controller');

const router = express.Router();

router.get('/my', protect, myNotifications);
router.patch('/:id/read', protect, markRead);

module.exports = router;
