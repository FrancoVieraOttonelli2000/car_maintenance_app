// Regression tests for the client -> manager request/approval flow:
// creating a request never applies the change immediately, only an approval
// by a manager does (inside a transaction), and a rejection never applies
// anything. Also checks that the manager-only endpoints stay manager-only.

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');
const User = require('../src/models/User');
const { cleanupTestUser, uniqueSuffix } = require('./helpers');

const PASSWORD = 'Test1234!';

describe('Request approval flow', () => {
  const emailClient = `test-client-${uniqueSuffix()}@example.com`;
  const emailManager = `test-manager-${uniqueSuffix()}@example.com`;

  let client;
  let manager;
  let carId;

  beforeAll(async () => {
    const resClient = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test Client', email: emailClient, password: PASSWORD });
    const resManagerReg = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test Manager', email: emailManager, password: PASSWORD });

    // Bootstrap a manager the same way the very first real manager was
    // created: promote directly at the model layer, not through the API
    // (promoting via the API requires an existing manager, chicken-and-egg).
    await User.updateRole(resManagerReg.body.id, 'manager');
    const resManagerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: emailManager, password: PASSWORD });

    client = { id: resClient.body.id, token: resClient.body.token };
    manager = { id: resManagerLogin.body.id, token: resManagerLogin.body.token };

    const carRes = await request(app)
      .post('/api/cars')
      .set('Authorization', `Bearer ${client.token}`)
      .send({
        plate: `TEST-${uniqueSuffix()}`,
        brand: 'Seat',
        model: 'Ibiza',
        engine: '1.0',
        fuel: 'gasoline',
        year: 2019,
        current_km: 50000,
      });
    carId = carRes.body.id;
  });

  afterAll(async () => {
    await cleanupTestUser(emailClient);
    await cleanupTestUser(emailManager);
    // Without this, the mysql2 pool keeps its sockets open and Jest hangs
    // after "Ran all test suites." instead of exiting on its own.
    await db.end();
  });

  test('a client cannot list or approve/reject requests (manager-only)', async () => {
    const list = await request(app).get('/api/requests').set('Authorization', `Bearer ${client.token}`);
    expect(list.status).toBe(403);

    const approve = await request(app)
      .post('/api/requests/999999/approve')
      .set('Authorization', `Bearer ${client.token}`);
    expect(approve.status).toBe(403);
  });

  test('creating a delete_vehicle request does not delete the car', async () => {
    const res = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ type: 'delete_vehicle', payload: { car_id: carId } });
    expect(res.status).toBe(201);

    const carCheck = await request(app)
      .get(`/api/cars/${carId}`)
      .set('Authorization', `Bearer ${client.token}`);
    expect(carCheck.status).toBe(200);
  });

  test('a manager approving the request actually deletes the car', async () => {
    const pending = await request(app)
      .get('/api/requests?status=pending')
      .set('Authorization', `Bearer ${manager.token}`);
    const reqRow = pending.body.find((r) => r.type === 'delete_vehicle' && r.payload.car_id === carId);
    expect(reqRow).toBeDefined();

    const approve = await request(app)
      .post(`/api/requests/${reqRow.id}/approve`)
      .set('Authorization', `Bearer ${manager.token}`);
    expect(approve.status).toBe(200);

    const carCheck = await request(app)
      .get(`/api/cars/${carId}`)
      .set('Authorization', `Bearer ${client.token}`);
    expect(carCheck.status).toBe(404);
  });

  test('rejecting an edit_user_data request does not change the field', async () => {
    const editRes = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ type: 'edit_user_data', payload: { field: 'name', new_value: 'Should Not Apply' } });
    expect(editRes.status).toBe(201);

    const pending = await request(app)
      .get('/api/requests?status=pending')
      .set('Authorization', `Bearer ${manager.token}`);
    const reqRow = pending.body.find((r) => r.id === editRes.body.id);
    expect(reqRow).toBeDefined();

    const reject = await request(app)
      .post(`/api/requests/${reqRow.id}/reject`)
      .set('Authorization', `Bearer ${manager.token}`)
      .send({ note: 'rejected in test' });
    expect(reject.status).toBe(200);

    const loginCheck = await request(app)
      .post('/api/auth/login')
      .send({ email: emailClient, password: PASSWORD });
    expect(loginCheck.body.name).toBe('Test Client');
  });

  test('approving an edit_user_data request actually changes the field', async () => {
    const editRes = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ type: 'edit_user_data', payload: { field: 'name', new_value: 'Renamed Client' } });
    expect(editRes.status).toBe(201);

    const pending = await request(app)
      .get('/api/requests?status=pending')
      .set('Authorization', `Bearer ${manager.token}`);
    const reqRow = pending.body.find((r) => r.id === editRes.body.id);
    expect(reqRow).toBeDefined();

    const approve = await request(app)
      .post(`/api/requests/${reqRow.id}/approve`)
      .set('Authorization', `Bearer ${manager.token}`);
    expect(approve.status).toBe(200);

    const loginCheck = await request(app)
      .post('/api/auth/login')
      .send({ email: emailClient, password: PASSWORD });
    expect(loginCheck.body.name).toBe('Renamed Client');
  });

  test('cannot request editing a disallowed field like role or password', async () => {
    const res = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ type: 'edit_user_data', payload: { field: 'role', new_value: 'manager' } });
    expect(res.status).toBe(400);
  });

  test('approving a request twice fails the second time (no double-apply)', async () => {
    const editRes = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ type: 'edit_user_data', payload: { field: 'name', new_value: 'Second Approval Test' } });

    const pending = await request(app)
      .get('/api/requests?status=pending')
      .set('Authorization', `Bearer ${manager.token}`);
    const reqRow = pending.body.find((r) => r.id === editRes.body.id);

    const firstApprove = await request(app)
      .post(`/api/requests/${reqRow.id}/approve`)
      .set('Authorization', `Bearer ${manager.token}`);
    expect(firstApprove.status).toBe(200);

    const secondApprove = await request(app)
      .post(`/api/requests/${reqRow.id}/approve`)
      .set('Authorization', `Bearer ${manager.token}`);
    expect(secondApprove.status).toBe(400);
  });
});
