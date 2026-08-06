const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../config/database');

const PLANS = {
  monthly:   { amount: 299,  currency: 'eur', months: 1  },
  semestral: { amount: 1649, currency: 'eur', months: 6  },
  annual:    { amount: 2999, currency: 'eur', months: 12 },
};

const createPaymentIntent = async (req, res) => {
  const { plan } = req.body;
  const userId = req.user.id;

  if (!PLANS[plan]) return res.status(400).json({ error: 'Plan inválido' });

  try {
    const [users] = await db.execute('SELECT email FROM users WHERE id = ?', [userId]);
    if (!users.length) return res.status(404).json({ error: 'Usuario no encontrado' });

    let customerId;
    const [subs] = await db.execute(
      'SELECT stripe_customer_id FROM subscriptions WHERE user_id = ?',
      [userId]
    );

    if (subs.length && subs[0].stripe_customer_id) {
      customerId = subs[0].stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: users[0].email,
        metadata: { user_id: String(userId) },
      });
      customerId = customer.id;
    }

    const { amount, currency } = PLANS[plan];
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      metadata: { user_id: String(userId), plan },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      customerId,
    });
  } catch (err) {
    console.error('createPaymentIntent error:', err);
    res.status(500).json({ error: 'Error al procesar la solicitud de pago' });
  }
};

const activateSubscription = async (req, res) => {
  const { paymentIntentId, plan, customerId } = req.body;
  const userId = req.user.id;

  if (!PLANS[plan]) return res.status(400).json({ error: 'Plan inválido' });

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'El pago no se ha completado' });
    }

    const months = PLANS[plan].months;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    await db.execute(`
      INSERT INTO subscriptions (user_id, stripe_customer_id, stripe_payment_intent_id, plan, status, expires_at)
      VALUES (?, ?, ?, ?, 'active', ?)
      ON DUPLICATE KEY UPDATE
        stripe_customer_id = VALUES(stripe_customer_id),
        stripe_payment_intent_id = VALUES(stripe_payment_intent_id),
        plan = VALUES(plan),
        status = 'active',
        expires_at = VALUES(expires_at),
        updated_at = CURRENT_TIMESTAMP
    `, [userId, customerId, paymentIntentId, plan, expiresAt]);

    res.json({ success: true, expiresAt: expiresAt.toISOString() });
  } catch (err) {
    console.error('activateSubscription error:', err);
    res.status(500).json({ error: 'Error al activar la suscripción' });
  }
};

const getSubscriptionStatus = async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await db.execute(
      'SELECT plan, status, expires_at FROM subscriptions WHERE user_id = ?',
      [userId]
    );

    if (!rows.length) return res.json({ active: false });

    const sub = rows[0];
    const expiresAt = new Date(sub.expires_at);
    const isActive = sub.status === 'active' && expiresAt > new Date();

    if (sub.status === 'active' && expiresAt <= new Date()) {
      await db.execute(
        'UPDATE subscriptions SET status = "expired" WHERE user_id = ?',
        [userId]
      );
    }

    res.json({ active: isActive, plan: sub.plan, expiresAt: sub.expires_at });
  } catch (err) {
    console.error('getSubscriptionStatus error:', err);
    res.status(500).json({ error: 'Error al consultar la suscripción' });
  }
};

module.exports = { createPaymentIntent, activateSubscription, getSubscriptionStatus };
