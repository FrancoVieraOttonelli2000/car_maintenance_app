const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { askCarAssistant } = require('../controllers/carAssistantController');

router.post('/ask', protect, askCarAssistant);

module.exports = router;
