const db = require('../config/database');

class MaintenanceType {
  static async findAll() {
    const [rows] = await db.execute('SELECT * FROM maintenance_types');
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM maintenance_types WHERE id = ?', [id]);
    return rows[0];
  }
}

module.exports = MaintenanceType;
