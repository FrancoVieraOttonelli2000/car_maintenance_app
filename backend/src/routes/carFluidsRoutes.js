const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getCarFluids } = require('../controllers/carFluidsController');

router.get('/:carId', protect, getCarFluids);

module.exports = router;
