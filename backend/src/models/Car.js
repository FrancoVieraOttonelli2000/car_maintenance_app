const db = require('../config/database');

class Car {
  static async create(car) {
    const { user_id, plate, brand, model, engine, fuel, year, current_km, version } = car;
    const [result] = await db.execute(
      'INSERT INTO cars (user_id, plate, brand, model, engine, fuel, year, current_km, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [user_id, plate, brand, model, engine, fuel, year, current_km, version || null]
    );
    return result.insertId;
  }

  static async findByUserId(userId) {
    const [rows] = await db.execute('SELECT * FROM cars WHERE user_id = ?', [userId]);
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

  static async delete(id, userId, executor = db) {
    const [result] = await executor.execute('DELETE FROM cars WHERE id = ? AND user_id = ?', [id, userId]);
    return result.affectedRows;
  }

  static async updateKm(id, km) {
    const [result] = await db.execute('UPDATE cars SET current_km = ? WHERE id = ?', [km, id]);
    return result.affectedRows;
  }
}

module.exports = Car;
