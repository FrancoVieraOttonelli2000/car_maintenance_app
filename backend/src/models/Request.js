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

  // Incluye el nombre y email de quien creó la solicitud, para que el gestor
  // sepa de quién es sin tener que cruzarlo con la lista de usuarios.
  static async findByStatus(status) {
    const where = status ? 'WHERE r.status = ?' : '';
    const [rows] = await db.execute(
      `SELECT r.*, u.name AS user_name, u.email AS user_email
       FROM requests r
       LEFT JOIN users u ON u.id = r.user_id
       ${where}
       ORDER BY r.created_at DESC, r.id DESC`,
      status ? [status] : []
    );
    return rows.map(parsePayload);
  }

  static async findPending() {
    return Request.findByStatus('pending');
  }

  static async findAll() {
    return Request.findByStatus(null);
  }

  static async findPendingByUserAndType(userId, type) {
    const [rows] = await db.execute(
      "SELECT * FROM requests WHERE user_id = ? AND type = ? AND status = 'pending'",
      [userId, type]
    );
    return rows.map(parsePayload);
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM requests WHERE id = ?', [id]);
    return parsePayload(rows[0]);
  }

  // Solo cambia el estado si la solicitud sigue pendiente. Si dos gestores
  // aprueban a la vez, solo uno de los dos UPDATE afecta a la fila.
  static async updateStatus(id, status, resolvedBy, note, executor = db) {
    const [result] = await executor.execute(
      "UPDATE requests SET status = ?, resolved_by = ?, resolution_note = ?, resolved_at = NOW() WHERE id = ? AND status = 'pending'",
      [status, resolvedBy, note ? String(note).slice(0, 255) : null, id]
    );
    return result.affectedRows;
  }
}

module.exports = Request;
