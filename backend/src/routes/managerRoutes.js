const express = require('express');
const router = express.Router();
const { promoteToManager, listUsers } = require('../controllers/managerController');
const { protect, requireManager } = require('../middleware/authMiddleware');

router.post('/promote', protect, requireManager, promoteToManager);
router.get('/users', protect, requireManager, listUsers);

module.exports = router;
