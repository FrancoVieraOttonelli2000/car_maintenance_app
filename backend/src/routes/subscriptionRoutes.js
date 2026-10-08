const express = require('express');
const router = express.Router();
const { createPaymentIntent, activateSubscription, getSubscriptionStatus } = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');

// Estas rutas NO llevan requireSubscription: son justo las que se usan para
// conseguir una suscripción.
router.use(protect);

router.post('/create-payment-intent', createPaymentIntent);
router.post('/activate', activateSubscription);
router.get('/status', getSubscriptionStatus);

module.exports = router;
