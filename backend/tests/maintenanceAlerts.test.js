// Avisos de mantenimiento: un coche usado no empieza con todo vencido, y
// registrar una operación del plan de fábrica hace que su aviso desaparezca.

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');
const { calcularVencimientoKm } = require('../src/controllers/maintenancePlanController');
const { cleanupTestUser, uniqueSuffix, uniquePlate, giveActiveSubscription } = require('./helpers');

const PASSWORD = 'Test1234!';
const MARCA = `TestMarca${Date.now().toString(36)}`;

describe('calcularVencimientoKm', () => {
  const op = { cada_km: 15000, primera_vez_km: null };

  test('coche nuevo: la primera vez toca al primer intervalo', () => {
    expect(calcularVencimientoKm(op, 10000, { baseKm: 0 })).toEqual({ proximoKm: 15000, kmRestantes: 5000, vencido: false });
    expect(calcularVencimientoKm(op, 20000, { baseKm: 0 }).vencido).toBe(true);
  });

  test('coche dado de alta con muchos km: no sale vencido de entrada', () => {
    const r = calcularVencimientoKm(op, 150000, { baseKm: 150000 });
    expect(r.vencido).toBe(false);
    expect(r.proximoKm).toBe(165000);
  });

  test('con un registro, la próxima vez es ese km + intervalo', () => {
    const r = calcularVencimientoKm(op, 160000, { ultimoKm: 150000, baseKm: 0 });
    expect(r).toEqual({ proximoKm: 165000, kmRestantes: 5000, vencido: false });
  });

  test('respeta primera_vez_km', () => {
    const r = calcularVencimientoKm({ cada_km: 60000, primera_vez_km: 30000 }, 10000, { baseKm: 0 });
    expect(r.proximoKm).toBe(30000);
  });

  test('sin cada_km no hay aviso por km', () => {
    expect(calcularVencimientoKm({ cada_km: null }, 50000).proximoKm).toBeNull();
  });
});

describe('Avisos de un coche (API)', () => {
  const email = `test-alerts-${uniqueSuffix()}@example.com`;
  let user;
  let carId;
  const auth = () => ({ Authorization: `Bearer ${user.token}` });

  beforeAll(async () => {
    await db.execute(
      `INSERT INTO maintenance_plans (marca, modelo, version, operacion, cada_km, cada_meses, primera_vez_km)
       VALUES (?, 'Modelo', 'Base', 'Cambio de aceite y filtro', 15000, 12, NULL),
              (?, 'Modelo', 'Base', 'Correa de distribución', 120000, NULL, NULL)`,
      [MARCA, MARCA]
    );
    const res = await request(app).post('/api/auth/register').send({ name: 'Alerts', email, password: PASSWORD });
    user = { id: res.body.id, token: res.body.token };
    await giveActiveSubscription(user.id);

    const car = await request(app).post('/api/cars').set(auth()).send({
      plate: uniquePlate(), brand: MARCA, model: 'Modelo', version: 'Base',
      engine: '1.6', fuel: 'gasoline', year: 2015, current_km: 150000,
    });
    expect(car.status).toBe(201);
    carId = car.body.id;
  });

  afterAll(async () => {
    await cleanupTestUser(email);
    await db.execute('DELETE FROM maintenance_plans WHERE marca = ?', [MARCA]);
    await db.end();
  });

  test('al dar de alta no se crean registros "Registro inicial" a 0 km', async () => {
    const res = await request(app).get(`/api/maintenance/cars/${carId}/maintenance`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('un coche usado recién dado de alta no tiene avisos vencidos', async () => {
    const generic = await request(app).get(`/api/alerts/${user.id}`).set(auth());
    expect(generic.body.filter((a) => a.car_id === carId)).toEqual([]);

    const plan = await request(app).get(`/api/maintenance-plans/alertas-car/${carId}`).set(auth());
    expect(plan.status).toBe(200);
    expect(plan.body.length).toBe(2);
    expect(plan.body.every((op) => !op.vencido)).toBe(true);
  });

  test('al pasar el siguiente intervalo, el aviso sale vencido', async () => {
    await request(app).post(`/api/cars/${carId}/km`).set(auth()).send({ km: 166000 });
    const plan = await request(app).get(`/api/maintenance-plans/alertas-car/${carId}`).set(auth());
    const aceite = plan.body.find((op) => op.operacion === 'Cambio de aceite y filtro');
    expect(aceite.vencido).toBe(true);
    expect(aceite.proximoKm).toBe(165000);

    const generic = await request(app).get(`/api/alerts/${user.id}`).set(auth());
    expect(generic.body.some((a) => a.car_id === carId)).toBe(true);
  });

  test('registrar la operación del plan quita el aviso', async () => {
    const today = new Date().toISOString().split('T')[0];
    const rec = await request(app).post('/api/maintenance').set(auth()).send({
      car_id: carId, plan_operacion: 'Cambio de aceite y filtro', km: 166000, date: today,
    });
    expect(rec.status).toBe(201);

    const plan = await request(app).get(`/api/maintenance-plans/alertas-car/${carId}`).set(auth());
    const aceite = plan.body.find((op) => op.operacion === 'Cambio de aceite y filtro');
    expect(aceite.vencido).toBe(false);
    expect(aceite.proximoKm).toBe(181000);
    expect(aceite.ultimoKm).toBe(166000);
    expect(aceite.proximaFecha).toBeTruthy(); // cada_meses = 12

    const hist = await request(app).get(`/api/maintenance/cars/${carId}/maintenance`).set(auth());
    expect(hist.body[0].tipo_de_mantenimiento).toBe('Cambio de aceite y filtro');
  });

  test('no se puede registrar una operación que no está en el plan del coche', async () => {
    const res = await request(app).post('/api/maintenance').set(auth()).send({
      car_id: carId, plan_operacion: 'Inventada', km: 166000, date: '2026-01-01',
    });
    expect(res.status).toBe(400);
  });

  test('hay que indicar tipo genérico u operación, no los dos', async () => {
    const both = await request(app).post('/api/maintenance').set(auth()).send({
      car_id: carId, type_id: 1, plan_operacion: 'Cambio de aceite y filtro', km: 1000, date: '2026-01-01',
    });
    expect(both.status).toBe(400);
    const none = await request(app).post('/api/maintenance').set(auth()).send({ car_id: carId, km: 1000, date: '2026-01-01' });
    expect(none.status).toBe(400);
  });

  test('un servicio con más km que el coche actualiza su kilometraje', async () => {
    const today = new Date().toISOString().split('T')[0];
    const rec = await request(app).post('/api/maintenance').set(auth()).send({ car_id: carId, type_id: 1, km: 170000, date: today });
    expect(rec.status).toBe(201);
    const car = await request(app).get(`/api/cars/${carId}`).set(auth());
    expect(car.body.current_km).toBe(170000);
  });

  test('valida km y fecha del servicio', async () => {
    const badKm = await request(app).post('/api/maintenance').set(auth()).send({ car_id: carId, type_id: 1, km: -5, date: '2026-01-01' });
    expect(badKm.status).toBe(400);
    const badDate = await request(app).post('/api/maintenance').set(auth()).send({ car_id: carId, type_id: 1, km: 1000, date: '2026-02-31' });
    expect(badDate.status).toBe(400);
    const future = await request(app).post('/api/maintenance').set(auth()).send({ car_id: carId, type_id: 1, km: 1000, date: '2999-01-01' });
    expect(future.status).toBe(400);
  });
});
