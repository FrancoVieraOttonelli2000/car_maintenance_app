// Estadísticas del panel del gestor: solo para gestores, y las cifras
// cambian cuando cambian los datos.

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');
const User = require('../src/models/User');
const { cleanupTestUser, uniqueSuffix, uniquePlate, giveActiveSubscription } = require('./helpers');

const PASSWORD = 'Test1234!';

describe('Estadísticas del gestor', () => {
  const emailManager = `test-stats-manager-${uniqueSuffix()}@example.com`;
  const emailClient = `test-stats-client-${uniqueSuffix()}@example.com`;
  let manager;
  let client;

  const getStats = () => request(app).get('/api/managers/stats').set('Authorization', `Bearer ${manager.token}`);

  beforeAll(async () => {
    const m = await request(app).post('/api/auth/register').send({ name: 'Gestor', email: emailManager, password: PASSWORD });
    await User.updateRole(m.body.id, 'manager');
    const login = await request(app).post('/api/auth/login').send({ email: emailManager, password: PASSWORD });
    manager = { id: login.body.id, token: login.body.token };
  });

  afterAll(async () => {
    await cleanupTestUser(emailClient);
    await cleanupTestUser(emailManager);
    await db.end();
  });

  test('un cliente o alguien sin sesión no puede verlas', async () => {
    const c = await request(app).post('/api/auth/register').send({ name: 'Cliente', email: emailClient, password: PASSWORD });
    client = { id: c.body.id, token: c.body.token };

    const asClient = await request(app).get('/api/managers/stats').set('Authorization', `Bearer ${client.token}`);
    expect(asClient.status).toBe(403);
    const anonymous = await request(app).get('/api/managers/stats');
    expect(anonymous.status).toBe(401);
  });

  test('devuelve todas las cifras como números', async () => {
    const res = await getStats();
    expect(res.status).toBe(200);
    const { users, subscriptions, cars, requests, maintenance } = res.body;
    for (const v of [users.total, users.clients, users.managers, users.newLast30Days, subscriptions.active,
      cars.total, requests.pending, requests.resolvedLast7Days, maintenance.last30Days]) {
      expect(typeof v).toBe('number');
    }
    expect(users.managers).toBeGreaterThanOrEqual(1);
    expect(users.clients + users.managers).toBe(users.total);
  });

  test('las cifras reflejan los cambios', async () => {
    const before = (await getStats()).body;

    await giveActiveSubscription(client.id);
    const car = await request(app)
      .post('/api/cars')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ plate: uniquePlate(), brand: 'Seat', model: 'Ibiza', engine: '1.0', fuel: 'gasoline', year: 2019, current_km: 50000 });
    await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ type: 'delete_vehicle', payload: { car_id: car.body.id } });

    const after = (await getStats()).body;
    expect(after.subscriptions.active).toBe(before.subscriptions.active + 1);
    expect(after.cars.total).toBe(before.cars.total + 1);
    expect(after.requests.pending).toBe(before.requests.pending + 1);
  });
});
