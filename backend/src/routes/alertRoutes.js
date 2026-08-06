const express = require('express');
const router = express.Router();
const { getUserAlerts } = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:userId', protect, getUserAlerts);

module.exports = router;
