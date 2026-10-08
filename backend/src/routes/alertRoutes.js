const express = require('express');
const router = express.Router();
const { getUserAlerts } = require('../controllers/alertController');
const { protect, requireSubscription } = require('../middleware/authMiddleware');

router.use(protect, requireSubscription);

router.get('/:userId', getUserAlerts);

module.exports = router;
