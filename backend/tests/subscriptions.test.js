// Pagos y muro de pago: un pago de Stripe solo activa la suscripción si es
// del usuario, si el plan y el importe coinciden, y solo una vez. Y sin
// suscripción activa, la API devuelve 402 (no solo la app).

const mockPaymentIntents = {};
jest.mock('stripe', () => () => ({
  customers: { create: jest.fn(async () => ({ id: 'cus_test' })) },
  paymentIntents: {
    create: jest.fn(async (params) => ({ id: 'pi_created', client_secret: 'pi_created_secret_x', ...params })),
    retrieve: jest.fn(async (id) => {
      if (!mockPaymentIntents[id]) throw new Error('No such payment_intent');
      return mockPaymentIntents[id];
    }),
  },
}));

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');
const User = require('../src/models/User');
const { cleanupTestUser, uniqueSuffix, uniquePlate } = require('./helpers');

const PASSWORD = 'Test1234!';

const makePI = (id, { userId, plan = 'monthly', amount = 299, status = 'succeeded', currency = 'eur' }) => {
  mockPaymentIntents[id] = {
    id,
    status,
    amount,
    amount_received: status === 'succeeded' ? amount : 0,
    currency,
    customer: 'cus_test',
    metadata: { user_id: String(userId), plan },
  };
  return id;
};

describe('Suscripciones y muro de pago', () => {
  const emailA = `test-subA-${uniqueSuffix()}@example.com`;
  const emailB = `test-subB-${uniqueSuffix()}@example.com`;
  const emailM = `test-subM-${uniqueSuffix()}@example.com`;
  let userA; let userB; let manager;
  const auth = (u) => ({ Authorization: `Bearer ${u.token}` });

  beforeAll(async () => {
    const a = await request(app).post('/api/auth/register').send({ name: 'Sub A', email: emailA, password: PASSWORD });
    const b = await request(app).post('/api/auth/register').send({ name: 'Sub B', email: emailB, password: PASSWORD });
    const m = await request(app).post('/api/auth/register').send({ name: 'Sub M', email: emailM, password: PASSWORD });
    userA = { id: a.body.id, token: a.body.token };
    userB = { id: b.body.id, token: b.body.token };
    await User.updateRole(m.body.id, 'manager');
    manager = { id: m.body.id, token: m.body.token }; // token viejo con role client
  });

  afterAll(async () => {
    await cleanupTestUser(emailA);
    await cleanupTestUser(emailB);
    await cleanupTestUser(emailM);
    await db.end();
  });

  test('sin suscripción, las rutas de la app devuelven 402', async () => {
    for (const path of ['/api/cars/user/0', '/api/alerts/0', '/api/maintenance/types', '/api/maintenance-plans/marcas']) {
      const res = await request(app).get(path).set(auth(userA));
      expect(res.status).toBe(402);
      expect(res.body.code).toBe('SUBSCRIPTION_REQUIRED');
    }
    const ask = await request(app).post('/api/car-assistant/ask').set(auth(userA)).send({ carId: 1, questionType: 'oil' });
    expect(ask.status).toBe(402);
  });

  test('sin suscripción sí se puede consultar el estado y crear el pago', async () => {
    const status = await request(app).get('/api/subscriptions/status').set(auth(userA));
    expect(status.status).toBe(200);
    expect(status.body.active).toBe(false);

    const pi = await request(app).post('/api/subscriptions/create-payment-intent').set(auth(userA)).send({ plan: 'monthly' });
    expect(pi.status).toBe(200);
    expect(pi.body.clientSecret).toBeDefined();
  });

  test('los gestores no necesitan suscripción (el rol se lee de la BD, no del token)', async () => {
    const res = await request(app).get('/api/maintenance/types').set(auth(manager));
    expect(res.status).toBe(200);
  });

  test('no se puede activar con un pago no completado', async () => {
    const id = makePI(`pi_pending_${uniqueSuffix()}`, { userId: userA.id, status: 'requires_payment_method' });
    const res = await request(app).post('/api/subscriptions/activate').set(auth(userA)).send({ paymentIntentId: id, plan: 'monthly' });
    expect(res.status).toBe(400);
  });

  test('no se puede activar con el pago de otro usuario', async () => {
    const id = makePI(`pi_other_${uniqueSuffix()}`, { userId: userB.id });
    const res = await request(app).post('/api/subscriptions/activate').set(auth(userA)).send({ paymentIntentId: id, plan: 'monthly' });
    expect(res.status).toBe(403);
  });

  test('no se puede pagar el mensual y activar el anual', async () => {
    const id = makePI(`pi_cheap_${uniqueSuffix()}`, { userId: userA.id, plan: 'monthly', amount: 299 });
    const res = await request(app).post('/api/subscriptions/activate').set(auth(userA)).send({ paymentIntentId: id, plan: 'annual' });
    expect(res.status).toBe(400);
    const status = await request(app).get('/api/subscriptions/status').set(auth(userA));
    expect(status.body.active).toBe(false);
  });

  test('no se activa si el importe cobrado no es el del plan', async () => {
    const id = makePI(`pi_amount_${uniqueSuffix()}`, { userId: userA.id, plan: 'annual', amount: 299 });
    const res = await request(app).post('/api/subscriptions/activate').set(auth(userA)).send({ paymentIntentId: id });
    expect(res.status).toBe(400);
  });

  let firstPaymentId;
  let firstExpiry;

  test('un pago correcto activa la suscripción y desbloquea la API', async () => {
    firstPaymentId = makePI(`pi_ok_${uniqueSuffix()}`, { userId: userA.id, plan: 'monthly', amount: 299 });
    const res = await request(app).post('/api/subscriptions/activate').set(auth(userA)).send({ paymentIntentId: firstPaymentId, plan: 'monthly' });
    expect(res.status).toBe(200);
    expect(res.body.plan).toBe('monthly');
    firstExpiry = new Date(res.body.expiresAt);
    const days = (firstExpiry - Date.now()) / 86400000;
    expect(days).toBeGreaterThan(27);
    expect(days).toBeLessThan(32);

    const cars = await request(app).get('/api/cars/user/0').set(auth(userA));
    expect(cars.status).toBe(200);
  });

  test('el mismo pago no se puede usar dos veces', async () => {
    const res = await request(app).post('/api/subscriptions/activate').set(auth(userA)).send({ paymentIntentId: firstPaymentId, plan: 'monthly' });
    expect(res.status).toBe(409);
  });

  test('renovar antes de que caduque suma el tiempo a la fecha actual de caducidad', async () => {
    const id = makePI(`pi_renew_${uniqueSuffix()}`, { userId: userA.id, plan: 'semestral', amount: 1649 });
    const res = await request(app).post('/api/subscriptions/activate').set(auth(userA)).send({ paymentIntentId: id });
    expect(res.status).toBe(200);
    const newExpiry = new Date(res.body.expiresAt);
    const expected = new Date(firstExpiry);
    expected.setMonth(expected.getMonth() + 6);
    expect(Math.abs(newExpiry - expected)).toBeLessThan(5000);
  });

  test('una suscripción caducada vuelve a bloquear la API', async () => {
    await db.execute("UPDATE subscriptions SET expires_at = DATE_SUB(NOW(), INTERVAL 1 DAY) WHERE user_id = ?", [userA.id]);
    const res = await request(app).get('/api/cars/user/0').set(auth(userA));
    expect(res.status).toBe(402);
    const status = await request(app).get('/api/subscriptions/status').set(auth(userA));
    expect(status.body.active).toBe(false);
  });

  test('tras caducar, una renovación cuenta desde hoy', async () => {
    const id = makePI(`pi_after_${uniqueSuffix()}`, { userId: userA.id, plan: 'monthly', amount: 299 });
    const res = await request(app).post('/api/subscriptions/activate').set(auth(userA)).send({ paymentIntentId: id });
    expect(res.status).toBe(200);
    const days = (new Date(res.body.expiresAt) - Date.now()) / 86400000;
    expect(days).toBeGreaterThan(27);
    expect(days).toBeLessThan(32);
  });
});
