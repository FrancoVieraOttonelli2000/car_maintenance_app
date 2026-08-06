const express = require('express');
const router = express.Router();
const { createPaymentIntent, activateSubscription, getSubscriptionStatus } = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-payment-intent', protect, createPaymentIntent);
router.post('/activate', protect, activateSubscription);
router.get('/status', protect, getSubscriptionStatus);

module.exports = router;
