const db = require('../config/database');

class Maintenance {
  static async create(maintenance) {
    const { car_id, type_id, plan_operacion, km, date, notes, workshop, own_breakdown } = maintenance;
    const [result] = await db.execute(
      'INSERT INTO maintenance (car_id, type_id, plan_operacion, km, date, notes, workshop, own_breakdown) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [car_id, type_id || null, plan_operacion || null, km, date, notes || null, workshop || null, own_breakdown ? 1 : 0]
    );
    return result.insertId;
  }

  // LEFT JOIN: los registros de una operación del plan no tienen type_id.
  static async findByCarId(carId) {
    const [rows] = await db.execute(`
      SELECT m.*, COALESCE(mt.name, m.plan_operacion) AS type_name, mt.interval_km
      FROM maintenance m
      LEFT JOIN maintenance_types mt ON m.type_id = mt.id
      WHERE m.car_id = ?
      ORDER BY m.date DESC, m.km DESC
    `, [carId]);
    return rows;
  }

  // Último registro (por km) de cada operación del plan de fábrica.
  static async findLatestPlanRecords(carId) {
    const [rows] = await db.execute(`
      SELECT plan_operacion, km, date
      FROM maintenance
      WHERE car_id = ? AND plan_operacion IS NOT NULL
      ORDER BY km DESC, date DESC
    `, [carId]);
    const latest = {};
    for (const row of rows) {
      if (!latest[row.plan_operacion]) latest[row.plan_operacion] = row;
    }
    return latest;
  }
}

module.exports = Maintenance;
