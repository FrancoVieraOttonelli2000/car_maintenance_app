// Solicitudes cliente -> gestor (casos límite), sesión (/auth/me, rol desde
// la BD), validación de datos de entrada y límite de intentos de login.

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');
const User = require('../src/models/User');
const { authLimiter } = require('../src/middleware/rateLimit');
const { cleanupTestUser, uniqueSuffix, uniquePlate, giveActiveSubscription } = require('./helpers');

const PASSWORD = 'Test1234!';

describe('Solicitudes, sesión y validación', () => {
  const emailA = `test-valA-${uniqueSuffix()}@example.com`;
  const emailB = `test-valB-${uniqueSuffix()}@example.com`;
  const emailM = `test-valM-${uniqueSuffix()}@example.com`;
  let a; let b; let m;
  let carA; let carB; let plateA;
  const auth = (u) => ({ Authorization: `Bearer ${u.token}` });

  const newCar = (u, overrides = {}) => request(app).post('/api/cars').set(auth(u)).send({
    plate: uniquePlate(), brand: 'Seat', model: 'Ibiza', engine: '1.0', fuel: 'gasoline', year: 2019, current_km: 50000, ...overrides,
  });

  beforeAll(async () => {
    const ra = await request(app).post('/api/auth/register').send({ name: 'Val A', email: emailA, password: PASSWORD });
    const rb = await request(app).post('/api/auth/register').send({ name: 'Val B', email: emailB, password: PASSWORD });
    const rm = await request(app).post('/api/auth/register').send({ name: 'Val M', email: emailM, password: PASSWORD });
    a = { id: ra.body.id, token: ra.body.token };
    b = { id: rb.body.id, token: rb.body.token };
    m = { id: rm.body.id, token: rm.body.token };
    await giveActiveSubscription(a.id);
    await giveActiveSubscription(b.id);
    await User.updateRole(m.id, 'manager');

    plateA = uniquePlate();
    carA = (await newCar(a, { plate: plateA })).body.id;
    carB = (await newCar(b)).body.id;
  });

  afterAll(async () => {
    await cleanupTestUser(emailA);
    await cleanupTestUser(emailB);
    await cleanupTestUser(emailM);
    await db.end();
  });

  // --- Sesión -------------------------------------------------------------

  test('GET /auth/me devuelve los datos actuales del usuario', async () => {
    const res = await request(app).get('/api/auth/me').set(auth(a));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: a.id, name: 'Val A', email: emailA, role: 'client' });
  });

  test('un gestor promovido no necesita volver a iniciar sesión (rol desde la BD)', async () => {
    const res = await request(app).get('/api/requests').set(auth(m));
    expect(res.status).toBe(200);
  });

  test('cabeceras de autorización mal formadas devuelven 401', async () => {
    for (const header of ['Bearer', 'Bearer ', 'Basic abc', 'Bearer not.a.jwt']) {
      const res = await request(app).get('/api/auth/me').set('Authorization', header);
      expect(res.status).toBe(401);
    }
  });

  // --- Solicitudes de borrado --------------------------------------------

  test('no se puede pedir borrar el coche de otro', async () => {
    const res = await request(app).post('/api/requests').set(auth(a)).send({ type: 'delete_vehicle', payload: { car_id: carB } });
    expect(res.status).toBe(404);
  });

  let deleteReqId;
  test('la solicitud de borrado guarda matrícula, marca y modelo', async () => {
    const res = await request(app).post('/api/requests').set(auth(a)).send({ type: 'delete_vehicle', payload: { car_id: carA } });
    expect(res.status).toBe(201);
    deleteReqId = res.body.id;

    const list = await request(app).get('/api/requests').set(auth(m));
    const row = list.body.find((r) => r.id === deleteReqId);
    expect(row.payload).toMatchObject({ car_id: carA, plate: plateA, brand: 'Seat', model: 'Ibiza' });
    expect(row.user_name).toBe('Val A');
    expect(row.user_email).toBe(emailA);
  });

  test('no se puede duplicar una solicitud de borrado pendiente', async () => {
    const res = await request(app).post('/api/requests').set(auth(a)).send({ type: 'delete_vehicle', payload: { car_id: carA } });
    expect(res.status).toBe(409);
  });

  test('si el coche ya no existe al aprobar, la solicitud se rechaza sola', async () => {
    // Simula que el coche desapareció entre la solicitud y la aprobación.
    await db.execute('UPDATE cars SET user_id = ? WHERE id = ?', [b.id, carA]);
    const res = await request(app).post(`/api/requests/${deleteReqId}/approve`).set(auth(m));
    expect(res.status).toBe(409);
    const [[row]] = await db.execute('SELECT status, resolution_note FROM requests WHERE id = ?', [deleteReqId]);
    expect(row.status).toBe('rejected');
    expect(row.resolution_note).toMatch(/ya no existe/);
    await db.execute('UPDATE cars SET user_id = ? WHERE id = ?', [a.id, carA]);
  });

  test('aprobar un borrado elimina también el historial del coche', async () => {
    const today = new Date().toISOString().split('T')[0];
    await request(app).post('/api/maintenance').set(auth(a)).send({ car_id: carA, type_id: 1, km: 50000, date: today });
    const created = await request(app).post('/api/requests').set(auth(a)).send({ type: 'delete_vehicle', payload: { car_id: carA } });
    const res = await request(app).post(`/api/requests/${created.body.id}/approve`).set(auth(m));
    expect(res.status).toBe(200);
    const [rows] = await db.execute('SELECT id FROM maintenance WHERE car_id = ?', [carA]);
    expect(rows).toEqual([]);
  });

  // --- Solicitudes de cambio de datos ------------------------------------

  test('cambiar a un email con formato inválido da 400', async () => {
    const res = await request(app).post('/api/requests').set(auth(a)).send({ type: 'edit_user_data', payload: { field: 'email', new_value: 'no-es-email' } });
    expect(res.status).toBe(400);
  });

  test('cambiar a un email que ya usa otra cuenta da 409', async () => {
    const res = await request(app).post('/api/requests').set(auth(a)).send({ type: 'edit_user_data', payload: { field: 'email', new_value: emailB } });
    expect(res.status).toBe(409);
  });

  test('nombre vacío da 400', async () => {
    const res = await request(app).post('/api/requests').set(auth(a)).send({ type: 'edit_user_data', payload: { field: 'name', new_value: '   ' } });
    expect(res.status).toBe(400);
  });

  test('si el email se ocupa entre la solicitud y la aprobación, se rechaza sola (no 500)', async () => {
    const target = `test-valT-${uniqueSuffix()}@example.com`;
    const created = await request(app).post('/api/requests').set(auth(a)).send({ type: 'edit_user_data', payload: { field: 'email', new_value: target } });
    expect(created.status).toBe(201);
    // Otra cuenta se registra con ese email antes de que el gestor apruebe.
    await request(app).post('/api/auth/register').send({ name: 'Ladrón', email: target, password: PASSWORD });
    const res = await request(app).post(`/api/requests/${created.body.id}/approve`).set(auth(m));
    expect(res.status).toBe(409);
    const me = await request(app).get('/api/auth/me').set(auth(a));
    expect(me.body.email).toBe(emailA);
    await cleanupTestUser(target);
  });

  test('tras aprobar un cambio de nombre, /auth/me ya devuelve el nombre nuevo', async () => {
    const created = await request(app).post('/api/requests').set(auth(a)).send({ type: 'edit_user_data', payload: { field: 'name', new_value: 'Val A Nuevo' } });
    await request(app).post(`/api/requests/${created.body.id}/approve`).set(auth(m));
    const me = await request(app).get('/api/auth/me').set(auth(a));
    expect(me.body.name).toBe('Val A Nuevo');
  });

  test('filtro de estado no válido da 400', async () => {
    const res = await request(app).get('/api/requests?status=hackeo').set(auth(m));
    expect(res.status).toBe(400);
  });

  // --- Validación de coches y registro -----------------------------------

  test('alta de coche con datos inválidos da 400', async () => {
    expect((await newCar(a, { year: 1800 })).status).toBe(400);
    expect((await newCar(a, { current_km: -1 })).status).toBe(400);
    expect((await newCar(a, { current_km: 'mucho' })).status).toBe(400);
    expect((await newCar(a, { plate: '' })).status).toBe(400);
    expect((await newCar(a, { brand: undefined })).status).toBe(400);
  });

  test('matrícula repetida da 409 en vez de 500', async () => {
    const plate = uniquePlate();
    expect((await newCar(a, { plate })).status).toBe(201);
    expect((await newCar(b, { plate })).status).toBe(409);
  });

  test('actualizar km con un valor no numérico da 400', async () => {
    const car = await newCar(b);
    const res = await request(app).post(`/api/cars/${car.body.id}/km`).set(auth(b)).send({ km: 'abc' });
    expect(res.status).toBe(400);
  });

  test('registro con email inválido o sin nombre da 400', async () => {
    const r1 = await request(app).post('/api/auth/register').send({ name: 'X', email: 'malo', password: PASSWORD });
    expect(r1.status).toBe(400);
    const r2 = await request(app).post('/api/auth/register').send({ name: '', email: `x-${uniqueSuffix()}@example.com`, password: PASSWORD });
    expect(r2.status).toBe(400);
  });

  test('JSON mal formado da 400', async () => {
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"email":');
    expect(res.status).toBe(400);
  });

  // --- Límite de intentos ------------------------------------------------

  test('demasiados intentos de login devuelven 429', async () => {
    authLimiter.enabledInTests = true;
    authLimiter.reset();
    try {
      let last;
      for (let i = 0; i < 11; i++) {
        last = await request(app).post('/api/auth/login').send({ email: emailB, password: 'Incorrecta1!' });
      }
      expect(last.status).toBe(429);
    } finally {
      authLimiter.enabledInTests = false;
      authLimiter.reset();
    }
  });
});
