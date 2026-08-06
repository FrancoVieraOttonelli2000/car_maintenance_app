const express = require('express');
const router = express.Router();
const { createRequest, listRequests, approveRequest, rejectRequest } = require('../controllers/requestController');
const { protect, requireManager } = require('../middleware/authMiddleware');

router.post('/', protect, createRequest);
router.get('/', protect, requireManager, listRequests);
router.post('/:id/approve', protect, requireManager, approveRequest);
router.post('/:id/reject', protect, requireManager, rejectRequest);

module.exports = router;
