const db = require('../config/database');

class Maintenance {
  static async create(maintenance) {
    const { car_id, type_id, km, date, notes, workshop, own_breakdown } = maintenance;
    const [result] = await db.execute(
      'INSERT INTO maintenance (car_id, type_id, km, date, notes, workshop, own_breakdown) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [car_id, type_id, km, date, notes, workshop || null, own_breakdown || false]
    );
    return result.insertId;
  }

  static async findByCarId(carId) {
    const [rows] = await db.execute(`
      SELECT m.*, mt.name as type_name, mt.interval_km
      FROM maintenance m
      JOIN maintenance_types mt ON m.type_id = mt.id
      WHERE m.car_id = ?
      ORDER BY m.date DESC, m.km DESC
    `, [carId]);
    return rows;
  }
}

module.exports = Maintenance;
