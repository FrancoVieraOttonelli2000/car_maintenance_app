const express = require('express');
const router = express.Router();
const { promoteToManager, listUsers, deleteUser, getStats } = require('../controllers/managerController');
const { protect, requireManager } = require('../middleware/authMiddleware');

router.post('/promote', protect, requireManager, promoteToManager);
router.get('/stats', protect, requireManager, getStats);
router.get('/users', protect, requireManager, listUsers);
router.delete('/users/:id', protect, requireManager, deleteUser);

module.exports = router;
