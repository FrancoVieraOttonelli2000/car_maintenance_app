const db = require('../config/database');

// MySQL's native JSON type comes back from mysql2 already parsed, but MariaDB
// stores JSON as LONGTEXT (with a json_valid CHECK) and returns it as a raw
// string, so payload is normalized here to behave the same on both engines.
const parsePayload = (row) => {
  if (row && typeof row.payload === 'string') {
    row.payload = JSON.parse(row.payload);
  }
  return row;
};

class Request {
  static async create(userId, type, payload) {
    const [result] = await db.execute(
      'INSERT INTO requests (user_id, type, payload) VALUES (?, ?, ?)',
      [userId, type, JSON.stringify(payload)]
    );
    return result.insertId;
  }

  static async findPending() {
    const [rows] = await db.execute(
      "SELECT * FROM requests WHERE status = 'pending' ORDER BY created_at DESC"
    );
    return rows.map(parsePayload);
  }

  static async findByStatus(status) {
    const [rows] = await db.execute(
      'SELECT * FROM requests WHERE status = ? ORDER BY created_at DESC',
      [status]
    );
    return rows.map(parsePayload);
  }

  static async findAll() {
    const [rows] = await db.execute('SELECT * FROM requests ORDER BY created_at DESC');
    return rows.map(parsePayload);
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM requests WHERE id = ?', [id]);
    return parsePayload(rows[0]);
  }

  static async updateStatus(id, status, resolvedBy, note, executor = db) {
    const [result] = await executor.execute(
      'UPDATE requests SET status = ?, resolved_by = ?, resolution_note = ?, resolved_at = NOW() WHERE id = ?',
      [status, resolvedBy, note || null, id]
    );
    return result.affectedRows;
  }
}

module.exports = Request;
