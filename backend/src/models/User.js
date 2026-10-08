const db = require('../config/database');

class User {
  static async create(user) {
    const { name, email, password, role } = user;
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, password, role || 'client']
    );
    return result.insertId;
  }

  static async findByEmail(email) {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  }

  static async findAll() {
    const [rows] = await db.execute('SELECT id, name, email, role, created_at FROM users ORDER BY id');
    return rows;
  }

  static async updateRole(id, role) {
    const [result] = await db.execute('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    return result.affectedRows;
  }

  static async updateField(id, field, value, executor = db) {
    const COLUMN_UPDATES = {
      name: 'UPDATE users SET name = ? WHERE id = ?',
      email: 'UPDATE users SET email = ? WHERE id = ?',
    };

    const query = COLUMN_UPDATES[field];
    if (!query) {
      throw new Error(`Field not allowed: ${field}`);
    }

    const [result] = await executor.execute(query, [value, id]);
    return result.affectedRows;
  }
}

module.exports = User;
