const express = require('express');
const router = express.Router();
const { protect, requireSubscription } = require('../middleware/authMiddleware');
const { getCarFluids } = require('../controllers/carFluidsController');

router.use(protect, requireSubscription);

router.get('/:carId', getCarFluids);

module.exports = router;
