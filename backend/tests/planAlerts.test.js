// Los Avisos usan el plan de fábrica cuando el coche lo tiene, para que el
// inicio no diga "todo al día" mientras la ficha muestra operaciones vencidas.

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');
const { cleanupTestUser, uniqueSuffix, uniquePlate, giveActiveSubscription } = require('./helpers');

const PASSWORD = 'Test1234!';
const MARCA = `PlanMarca${Date.now().toString(36)}`;

describe('Avisos con plan de fábrica', () => {
  const email = `test-planalerts-${uniqueSuffix()}@example.com`;
  let user;
  let planCarId;
  let genericCarId;
  const auth = () => ({ Authorization: `Bearer ${user.token}` });
  const getAlerts = () => request(app).get(`/api/alerts/${user.id}`).set(auth());

  beforeAll(async () => {
    await db.execute(
      `INSERT INTO maintenance_plans (marca, modelo, version, operacion, cada_km, cada_meses, primera_vez_km)
       VALUES (?, 'Astra', 'Base', 'Aceite motor + filtro', 10000, 12, NULL),
              (?, 'Astra', 'Base', 'Bujías', 60000, NULL, NULL),
              (?, 'Astra', 'Base', 'Correa distribución', 100000, NULL, NULL)`,
      [MARCA, MARCA, MARCA]
    );
    const res = await request(app).post('/api/auth/register').send({ name: 'Plan', email, password: PASSWORD });
    user = { id: res.body.id, token: res.body.token };
    await giveActiveSubscription(user.id);

    const planCar = await request(app).post('/api/cars').set(auth()).send({
      plate: uniquePlate(), brand: MARCA, model: 'Astra', version: 'Base',
      engine: '1.4', fuel: 'gasoline', year: 2020, current_km: 34000,
    });
    planCarId = planCar.body.id;

    // Coche sin plan de fábrica: sigue usando los avisos genéricos.
    const genericCar = await request(app).post('/api/cars').set(auth()).send({
      plate: uniquePlate(), brand: `SinPlan${Date.now().toString(36)}`, model: 'X', version: 'Base',
      engine: '1.0', fuel: 'gasoline', year: 2018, current_km: 50000,
    });
    genericCarId = genericCar.body.id;
  });

  afterAll(async () => {
    await cleanupTestUser(email);
    await db.execute('DELETE FROM maintenance_plans WHERE marca = ?', [MARCA]);
    await db.end();
  });

  test('recién dado de alta no hay avisos', async () => {
    const res = await getAlerts();
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('al subir los km, las operaciones vencidas del plan salen en Avisos', async () => {
    await request(app).post(`/api/cars/${planCarId}/km`).set(auth()).send({ km: 70000 });

    const res = await getAlerts();
    const carAlerts = res.body.filter((a) => a.car_id === planCarId);
    expect(carAlerts.map((a) => a.type_name).sort()).toEqual(['Aceite motor + filtro', 'Bujías']);
    expect(carAlerts.every((a) => a.source === 'plan')).toBe(true);

    const aceite = carAlerts.find((a) => a.type_name === 'Aceite motor + filtro');
    expect(aceite.overdue_km).toBe(30000);
    expect(aceite.due_km).toBe(40000);
    expect(carAlerts.find((a) => a.type_name === 'Bujías').overdue_km).toBe(10000);

    // Coinciden con lo que muestra la ficha del coche.
    const plan = await request(app).get(`/api/maintenance-plans/alertas-car/${planCarId}`).set(auth());
    expect(plan.body.filter((op) => op.vencido).length).toBe(carAlerts.length);

    // Los tipos genéricos no se duplican para un coche con plan.
    expect(carAlerts.some((a) => a.source === 'generic')).toBe(false);
  });

  test('registrar la operación quita el aviso', async () => {
    const today = new Date().toISOString().split('T')[0];
    await request(app).post('/api/maintenance').set(auth()).send({
      car_id: planCarId, plan_operacion: 'Bujías', km: 70000, date: today,
    });
    const res = await getAlerts();
    const names = res.body.filter((a) => a.car_id === planCarId).map((a) => a.type_name);
    expect(names).toEqual(['Aceite motor + filtro']);
  });

  test('un coche sin plan sigue usando los avisos genéricos', async () => {
    await request(app).post(`/api/cars/${genericCarId}/km`).set(auth()).send({ km: 62000 });
    const res = await getAlerts();
    const generic = res.body.filter((a) => a.car_id === genericCarId);
    expect(generic.length).toBeGreaterThan(0);
    expect(generic.every((a) => a.source === 'generic')).toBe(true);
  });
});
