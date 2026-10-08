const db = require('../config/database');

class Car {
  static async create(car) {
    const { user_id, plate, brand, model, engine, fuel, year, current_km, version } = car;
    const [result] = await db.execute(
      'INSERT INTO cars (user_id, plate, brand, model, engine, fuel, year, current_km, initial_km, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [user_id, plate, brand, model, engine || null, fuel || null, year, current_km, current_km, version || null]
    );
    return result.insertId;
  }

  static async findByUserId(userId) {
    const [rows] = await db.execute('SELECT * FROM cars WHERE user_id = ? ORDER BY id', [userId]);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM cars WHERE id = ?', [id]);
    return rows[0];
  }

  static async findByIdAndUserId(id, userId) {
    const [rows] = await db.execute('SELECT * FROM cars WHERE id = ? AND user_id = ?', [id, userId]);
    return rows[0];
  }

  // Solo lo llama approveRequest (dentro de su transacción). Borra primero el
  // historial del coche y después el coche: según la versión de MariaDB/MySQL
  // los REFERENCES del schema se aplican como claves foráneas reales (y
  // entonces borrar el coche primero falla) o se ignoran (y quedarían filas
  // huérfanas). Así funciona en los dos casos.
  static async delete(id, userId, executor = db) {
    const [owned] = await executor.execute(
      'SELECT id FROM cars WHERE id = ? AND user_id = ? FOR UPDATE',
      [id, userId]
    );
    if (!owned.length) return 0;

    await executor.execute('DELETE FROM maintenance WHERE car_id = ?', [id]);
    await executor.execute('DELETE FROM car_km_logs WHERE car_id = ?', [id]);
    const [result] = await executor.execute('DELETE FROM cars WHERE id = ? AND user_id = ?', [id, userId]);
    return result.affectedRows;
  }

  static async updateKm(id, km) {
    const [result] = await db.execute('UPDATE cars SET current_km = ? WHERE id = ?', [km, id]);
    return result.affectedRows;
  }
}

module.exports = Car;
