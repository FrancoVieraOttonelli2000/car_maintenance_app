const db = require('../config/database');

class CarKmLog {
  static async create(carId, km, date) {
    const [result] = await db.execute(
      'INSERT INTO car_km_logs (car_id, km, date) VALUES (?, ?, ?)',
      [carId, km, date ? new Date(date) : new Date()]
    );
    return result.insertId;
  }
}

module.exports = CarKmLog;
