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

  // Borra un usuario y todo lo que cuelga de él, en una sola transacción.
  // Se borra a mano en orden (historial -> coches -> solicitudes -> usuario)
  // porque las REFERENCES inline de schema.sql solo son claves foráneas
  // reales en MariaDB 10.5+, y así funciona igual en todas las versiones.
  // Las solicitudes de OTROS usuarios que resolvió este (si era gestor) se
  // conservan, con resolved_by a NULL.
  static async deleteWithData(id) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [cars] = await connection.execute('SELECT id FROM cars WHERE user_id = ?', [id]);
      for (const car of cars) {
        await connection.execute('DELETE FROM maintenance WHERE car_id = ?', [car.id]);
        await connection.execute('DELETE FROM car_km_logs WHERE car_id = ?', [car.id]);
      }
      await connection.execute('DELETE FROM cars WHERE user_id = ?', [id]);
      await connection.execute('DELETE FROM requests WHERE user_id = ?', [id]);
      await connection.execute('UPDATE requests SET resolved_by = NULL WHERE resolved_by = ?', [id]);
      await connection.execute('DELETE FROM subscription_payments WHERE user_id = ?', [id]);
      await connection.execute('DELETE FROM subscriptions WHERE user_id = ?', [id]);
      const [result] = await connection.execute('DELETE FROM users WHERE id = ?', [id]);

      await connection.commit();
      return result.affectedRows;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
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
