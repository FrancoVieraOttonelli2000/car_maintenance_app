// Borrado de usuarios por parte de un gestor: puede borrar clientes y otros
// gestores (con todos sus datos), nunca a sí mismo, y un cliente no puede
// borrar a nadie.

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');
const User = require('../src/models/User');
const { cleanupTestUser, uniqueSuffix, uniquePlate, giveActiveSubscription } = require('./helpers');

const PASSWORD = 'Test1234!';

async function register(email, name) {
  const res = await request(app).post('/api/auth/register').send({ name, email, password: PASSWORD });
  return { id: res.body.id, token: res.body.token, email };
}

async function login(email) {
  const res = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
  return { id: res.body.id, token: res.body.token, email };
}

const count = async (sql, params) => {
  const [rows] = await db.execute(sql, params);
  return rows[0].n;
};

describe('Gestor borra usuarios', () => {
  const emails = {
    manager: `test-del-manager-${uniqueSuffix()}@example.com`,
    otherManager: `test-del-manager2-${uniqueSuffix()}@example.com`,
    client: `test-del-client-${uniqueSuffix()}@example.com`,
    bystander: `test-del-bystander-${uniqueSuffix()}@example.com`,
  };

  let manager;
  let otherManager;
  let client;
  let bystander;
  let clientCarId;
  let bystanderRequestId;

  beforeAll(async () => {
    const m = await register(emails.manager, 'Gestor');
    const m2 = await register(emails.otherManager, 'Gestor 2');
    client = await register(emails.client, 'Cliente');
    bystander = await register(emails.bystander, 'Otro cliente');

    await User.updateRole(m.id, 'manager');
    await User.updateRole(m2.id, 'manager');
    manager = await login(emails.manager);
    otherManager = await login(emails.otherManager);

    // El cliente a borrar tiene suscripción, un coche con historial y una solicitud.
    await giveActiveSubscription(client.id);
    const car = await request(app)
      .post('/api/cars')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ plate: uniquePlate(), brand: 'Seat', model: 'Ibiza', engine: '1.0', fuel: 'gasoline', year: 2019, current_km: 50000 });
    clientCarId = car.body.id;
    await request(app)
      .post(`/api/cars/${clientCarId}/km`)
      .set('Authorization', `Bearer ${client.token}`)
      .send({ km: 51000 });
    const [types] = await db.execute('SELECT id FROM maintenance_types LIMIT 1');
    await request(app)
      .post('/api/maintenance')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ car_id: clientCarId, type_id: types[0]?.id, km: 51000, date: '2026-01-15' });
    await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ type: 'delete_vehicle', payload: { car_id: clientCarId } });

    // Solicitud de otro cliente resuelta por el segundo gestor: tiene que
    // sobrevivir cuando se borre a ese gestor.
    const req = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${bystander.token}`)
      .send({ type: 'edit_user_data', payload: { field: 'name', new_value: 'Nombre nuevo' } });
    bystanderRequestId = req.body.id;
    await request(app)
      .post(`/api/requests/${bystanderRequestId}/reject`)
      .set('Authorization', `Bearer ${otherManager.token}`);
  });

  afterAll(async () => {
    for (const email of Object.values(emails)) {
      await cleanupTestUser(email);
    }
    await db.end();
  });

  test('un cliente no puede borrar usuarios', async () => {
    const res = await request(app)
      .delete(`/api/managers/users/${bystander.id}`)
      .set('Authorization', `Bearer ${client.token}`);
    expect(res.status).toBe(403);
    expect(await User.findById(bystander.id)).toBeDefined();
  });

  test('sin token no se puede borrar', async () => {
    const res = await request(app).delete(`/api/managers/users/${bystander.id}`);
    expect(res.status).toBe(401);
  });

  test('un gestor no puede borrarse a sí mismo', async () => {
    const res = await request(app)
      .delete(`/api/managers/users/${manager.id}`)
      .set('Authorization', `Bearer ${manager.token}`);
    expect(res.status).toBe(400);
    expect(await User.findById(manager.id)).toBeDefined();
  });

  test('ID inexistente o no válido', async () => {
    const missing = await request(app)
      .delete('/api/managers/users/999999999')
      .set('Authorization', `Bearer ${manager.token}`);
    expect(missing.status).toBe(404);

    const invalid = await request(app)
      .delete('/api/managers/users/abc')
      .set('Authorization', `Bearer ${manager.token}`);
    expect(invalid.status).toBe(400);
  });

  test('borrar un cliente elimina también sus coches, historial, solicitudes y suscripción', async () => {
    expect(await count('SELECT COUNT(*) n FROM maintenance WHERE car_id = ?', [clientCarId])).toBeGreaterThan(0);

    const res = await request(app)
      .delete(`/api/managers/users/${client.id}`)
      .set('Authorization', `Bearer ${manager.token}`);
    expect(res.status).toBe(200);

    expect(await User.findById(client.id)).toBeUndefined();
    expect(await count('SELECT COUNT(*) n FROM cars WHERE user_id = ?', [client.id])).toBe(0);
    expect(await count('SELECT COUNT(*) n FROM maintenance WHERE car_id = ?', [clientCarId])).toBe(0);
    expect(await count('SELECT COUNT(*) n FROM car_km_logs WHERE car_id = ?', [clientCarId])).toBe(0);
    expect(await count('SELECT COUNT(*) n FROM requests WHERE user_id = ?', [client.id])).toBe(0);
    expect(await count('SELECT COUNT(*) n FROM subscriptions WHERE user_id = ?', [client.id])).toBe(0);

    // Su sesión deja de valer al momento.
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${client.token}`);
    expect(me.status).toBe(401);
  });

  test('un gestor puede borrar a otro gestor; las solicitudes que resolvió se conservan', async () => {
    const res = await request(app)
      .delete(`/api/managers/users/${otherManager.id}`)
      .set('Authorization', `Bearer ${manager.token}`);
    expect(res.status).toBe(200);
    expect(await User.findById(otherManager.id)).toBeUndefined();

    const [rows] = await db.execute('SELECT status, resolved_by FROM requests WHERE id = ?', [bystanderRequestId]);
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('rejected');
    expect(rows[0].resolved_by).toBeNull();

    // El otro cliente no se ha tocado.
    expect(await User.findById(bystander.id)).toBeDefined();
  });
});
