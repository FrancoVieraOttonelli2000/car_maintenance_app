const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../config/database');

const PLANS = {
  monthly:   { amount: 299,  currency: 'eur', months: 1  },
  semestral: { amount: 1649, currency: 'eur', months: 6  },
  annual:    { amount: 2999, currency: 'eur', months: 12 },
};

const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const createPaymentIntent = async (req, res) => {
  const { plan } = req.body;
  const userId = req.user.id;

  if (!PLANS[plan]) return res.status(400).json({ error: 'Plan inválido' });

  try {
    let customerId;
    const [subs] = await db.execute(
      'SELECT stripe_customer_id FROM subscriptions WHERE user_id = ?',
      [userId]
    );

    if (subs.length && subs[0].stripe_customer_id) {
      customerId = subs[0].stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: req.user.email,
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
      // Estos metadatos son los que se comprueban al activar: el plan y el
      // usuario salen de aquí, no de lo que mande la app.
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
  const { paymentIntentId } = req.body;
  const userId = req.user.id;

  if (typeof paymentIntentId !== 'string' || !paymentIntentId.startsWith('pi_')) {
    return res.status(400).json({ error: 'Pago inválido' });
  }

  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (err) {
    console.error('activateSubscription retrieve error:', err);
    return res.status(400).json({ error: 'Pago inválido' });
  }

  // 1) El pago tiene que estar completado.
  if (paymentIntent.status !== 'succeeded') {
    return res.status(400).json({ error: 'El pago no se ha completado' });
  }

  // 2) El pago tiene que ser de este usuario.
  if (paymentIntent.metadata?.user_id !== String(userId)) {
    return res.status(403).json({ error: 'Este pago no pertenece a tu cuenta' });
  }

  // 3) El plan sale del pago, no del body: así no se puede pagar el mensual
  //    y activar el anual. Si la app manda un plan, tiene que coincidir.
  const plan = paymentIntent.metadata?.plan;
  const planInfo = PLANS[plan];
  if (!planInfo || (req.body.plan && req.body.plan !== plan)) {
    return res.status(400).json({ error: 'El plan no coincide con el pago' });
  }

  // 4) El importe cobrado tiene que ser el del plan.
  const received = paymentIntent.amount_received ?? paymentIntent.amount;
  if (received !== planInfo.amount || paymentIntent.currency !== planInfo.currency) {
    return res.status(400).json({ error: 'El importe del pago no coincide con el plan' });
  }

  const customerId = typeof paymentIntent.customer === 'string'
    ? paymentIntent.customer
    : paymentIntent.customer?.id || null;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 5) Cada pago solo se puede usar una vez (UNIQUE en payment_intent_id).
    try {
      await connection.execute(
        'INSERT INTO subscription_payments (user_id, payment_intent_id, plan, amount, currency) VALUES (?, ?, ?, ?, ?)',
        [userId, paymentIntentId, plan, received, paymentIntent.currency]
      );
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        await connection.rollback();
        return res.status(409).json({ error: 'Este pago ya se ha usado' });
      }
      throw err;
    }

    // 6) Renovar suma tiempo: si aún quedan días, se cuenta desde la fecha de
    //    caducidad actual, no desde hoy.
    const [current] = await connection.execute(
      'SELECT status, expires_at FROM subscriptions WHERE user_id = ? FOR UPDATE',
      [userId]
    );
    const now = new Date();
    let base = now;
    if (current.length && current[0].status === 'active') {
      const currentExpiry = new Date(current[0].expires_at);
      if (currentExpiry > now) base = currentExpiry;
    }
    const expiresAt = addMonths(base, planInfo.months);

    await connection.execute(`
      INSERT INTO subscriptions (user_id, stripe_customer_id, stripe_payment_intent_id, plan, status, expires_at)
      VALUES (?, ?, ?, ?, 'active', ?)
      ON DUPLICATE KEY UPDATE
        stripe_customer_id = COALESCE(VALUES(stripe_customer_id), stripe_customer_id),
        stripe_payment_intent_id = VALUES(stripe_payment_intent_id),
        plan = VALUES(plan),
        status = 'active',
        expires_at = VALUES(expires_at),
        updated_at = CURRENT_TIMESTAMP
    `, [userId, customerId, paymentIntentId, plan, expiresAt]);

    await connection.commit();
    res.json({ success: true, plan, expiresAt: expiresAt.toISOString() });
  } catch (err) {
    await connection.rollback();
    console.error('activateSubscription error:', err);
    res.status(500).json({ error: 'Error al activar la suscripción' });
  } finally {
    connection.release();
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
        "UPDATE subscriptions SET status = 'expired' WHERE user_id = ?",
        [userId]
      );
    }

    res.json({ active: isActive, plan: sub.plan, expiresAt: sub.expires_at });
  } catch (err) {
    console.error('getSubscriptionStatus error:', err);
    res.status(500).json({ error: 'Error al consultar la suscripción' });
  }
};

module.exports = { createPaymentIntent, activateSubscription, getSubscriptionStatus, PLANS };
