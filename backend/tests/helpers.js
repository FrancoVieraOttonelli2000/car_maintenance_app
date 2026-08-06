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
  await db.execute('DELETE FROM subscriptions WHERE user_id = ?', [userId]);
  await db.execute('DELETE FROM users WHERE id = ?', [userId]);
}

const uniqueSuffix = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

module.exports = { cleanupTestUser, uniqueSuffix };
