const db = require('../src/config/database');

// Deletes a test user and everything hanging off it. MySQL doesn't actually
// enforce the inline `REFERENCES` column hints used in schema.sql (only real
// `FOREIGN KEY ... ON DELETE ...` clauses are enforced, which this project
// only uses for `subscriptions`), so we clean up dependents by hand to avoid
// leaving orphaned rows behind after each test run.
async function cleanupTestUser(email) {
  const [users] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
  if (!users.length) return;
  const userId = users[0].id;

  const [cars] = await db.execute('SELECT id FROM cars WHERE user_id = ?', [userId]);
  for (const car of cars) {
    await db.execute('DELETE FROM maintenance WHERE car_id = ?', [car.id]);
    await db.execute('DELETE FROM car_km_logs WHERE car_id = ?', [car.id]);
  }
  await db.execute('DELETE FROM cars WHERE user_id = ?', [userId]);
  await db.execute('DELETE FROM requests WHERE user_id = ? OR resolved_by = ?', [userId, userId]);
  await db.execute('DELETE FROM subscription_payments WHERE user_id = ?', [userId]);
  await db.execute('DELETE FROM subscriptions WHERE user_id = ?', [userId]);
  await db.execute('DELETE FROM users WHERE id = ?', [userId]);
}

const uniqueSuffix = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// Matrícula única de menos de 20 caracteres (el límite de la columna).
const uniquePlate = () => `T${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();

// Da a un usuario una suscripción activa directamente en la BD, para los
// tests que no van de pagos pero usan rutas protegidas por el muro de pago.
async function giveActiveSubscription(userId, months = 1) {
  await db.execute(
    `INSERT INTO subscriptions (user_id, plan, status, expires_at)
     VALUES (?, 'monthly', 'active', DATE_ADD(NOW(), INTERVAL ? MONTH))
     ON DUPLICATE KEY UPDATE status = 'active', expires_at = VALUES(expires_at)`,
    [userId, months]
  );
}

module.exports = { cleanupTestUser, uniqueSuffix, uniquePlate, giveActiveSubscription };
