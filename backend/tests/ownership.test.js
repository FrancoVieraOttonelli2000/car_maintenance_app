// Regression tests for the IDOR fixes: two users (A and B) exist, A owns a
// car, and every endpoint that touches "a car" or "a user's data" must
// refuse B's requests for A's resources, while still working normally for A.
//
// These hit a real database (via app.js -> config/database.js), same as the
// manual verification done throughout development. Run with `npm test`.

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');
const { cleanupTestUser, uniqueSuffix, uniquePlate, giveActiveSubscription } = require('./helpers');

const PASSWORD = 'Test1234!';

describe('Ownership checks (IDOR regression)', () => {
  const emailA = `test-a-${uniqueSuffix()}@example.com`;
  const emailB = `test-b-${uniqueSuffix()}@example.com`;

  let userA;
  let userB;
  let carA;

  beforeAll(async () => {
    const resA = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test A', email: emailA, password: PASSWORD });
    const resB = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test B', email: emailB, password: PASSWORD });

    userA = { id: resA.body.id, token: resA.body.token };
    userB = { id: resB.body.id, token: resB.body.token };
    await giveActiveSubscription(userA.id);
    await giveActiveSubscription(userB.id);

    const carRes = await request(app)
      .post('/api/cars')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        plate: uniquePlate(),
        brand: 'Toyota',
        model: 'Corolla',
        engine: '1.8',
        fuel: 'gasoline',
        year: 2020,
        current_km: 10000,
      });
    carA = carRes.body.id;
  });

  afterAll(async () => {
    await cleanupTestUser(emailA);
    await cleanupTestUser(emailB);
    // Without this, the mysql2 pool keeps its sockets open and Jest hangs
    // after "Ran all test suites." instead of exiting on its own.
    await db.end();
  });

  test('B listing /cars/user/:userId with A\'s id never returns A\'s car', async () => {
    const res = await request(app)
      .get(`/api/cars/user/${userA.id}`)
      .set('Authorization', `Bearer ${userB.token}`);

    expect(res.status).toBe(200);
    expect(res.body.some((c) => c.id === carA)).toBe(false);
  });

  test('B cannot fetch A\'s car by id', async () => {
    const res = await request(app)
      .get(`/api/cars/${carA}`)
      .set('Authorization', `Bearer ${userB.token}`);
    expect(res.status).toBe(404);
  });

  test('B cannot update the km on A\'s car', async () => {
    const res = await request(app)
      .post(`/api/cars/${carA}/km`)
      .set('Authorization', `Bearer ${userB.token}`)
      .send({ km: 99999, date: '2026-01-01' });
    expect(res.status).toBe(404);
  });

  test('there is no direct DELETE route for cars (must go through /api/requests)', async () => {
    const res = await request(app)
      .delete(`/api/cars/${carA}`)
      .set('Authorization', `Bearer ${userB.token}`);
    expect(res.status).toBe(404);
  });

  test('B cannot see A\'s maintenance alerts', async () => {
    const res = await request(app)
      .get(`/api/alerts/${userA.id}`)
      .set('Authorization', `Bearer ${userB.token}`);

    expect(res.status).toBe(200);
    expect(res.body.some((alert) => alert.car_id === carA)).toBe(false);
  });

  test('B cannot view A\'s car maintenance history', async () => {
    const res = await request(app)
      .get(`/api/maintenance/cars/${carA}/maintenance`)
      .set('Authorization', `Bearer ${userB.token}`);
    expect(res.status).toBe(404);
  });

  test('B cannot create a maintenance record on A\'s car', async () => {
    const res = await request(app)
      .post('/api/maintenance')
      .set('Authorization', `Bearer ${userB.token}`)
      .send({ car_id: carA, type_id: 1, km: 5000, date: '2026-01-01', notes: 'attempted injection' });
    expect(res.status).toBe(404);
  });

  test('B cannot query maintenance-plan alerts for A\'s car', async () => {
    const res = await request(app)
      .get(`/api/maintenance-plans/alertas-car/${carA}`)
      .set('Authorization', `Bearer ${userB.token}`);
    expect(res.status).toBe(404);
  });

  test('B cannot view A\'s car fluids', async () => {
    const res = await request(app)
      .get(`/api/car-fluids/${carA}`)
      .set('Authorization', `Bearer ${userB.token}`);
    expect(res.status).toBe(404);
  });

  test('A can still do all of the above on her own car (legitimate case not broken)', async () => {
    const list = await request(app)
      .get(`/api/cars/user/${userA.id}`)
      .set('Authorization', `Bearer ${userA.token}`);
    expect(list.status).toBe(200);
    expect(list.body.some((c) => c.id === carA)).toBe(true);

    const get = await request(app)
      .get(`/api/cars/${carA}`)
      .set('Authorization', `Bearer ${userA.token}`);
    expect(get.status).toBe(200);

    const km = await request(app)
      .post(`/api/cars/${carA}/km`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ km: 10500, date: '2026-01-01' });
    expect(km.status).toBe(200);

    const maint = await request(app)
      .get(`/api/maintenance/cars/${carA}/maintenance`)
      .set('Authorization', `Bearer ${userA.token}`);
    expect(maint.status).toBe(200);
  });
});
