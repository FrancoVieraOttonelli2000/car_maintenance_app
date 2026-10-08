const express = require('express');
const router = express.Router();
const { protect, requireSubscription } = require('../middleware/authMiddleware');
const { assistantLimiter } = require('../middleware/rateLimit');
const { askCarAssistant } = require('../controllers/carAssistantController');

router.use(protect, requireSubscription);

router.post('/ask', assistantLimiter, askCarAssistant);

module.exports = router;
