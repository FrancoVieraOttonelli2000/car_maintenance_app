const User = require('../models/User');
const db = require('../config/database');

const promoteToManager = async (req, res) => {
  try {
    const { email } = req.body;
    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'El email es obligatorio' });
    }

    const user = await User.findByEmail(email.trim());
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await User.updateRole(user.id, 'manager');

    const { password, ...safeUser } = user;
    res.json({ ...safeUser, role: 'manager' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error promoting user' });
  }
};

const listUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error retrieving users' });
  }
};

// Un gestor puede borrar a cualquier usuario (cliente o gestor) excepto a sí
// mismo. Como quien borra siempre es gestor, nunca se queda la app sin
// ningún gestor.
const deleteUser = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID de usuario no válido' });
    }
    if (id === req.user.id) {
      return res.status(400).json({ error: 'No puedes borrar tu propia cuenta' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await User.deleteWithData(id);
    res.json({ message: 'Usuario eliminado', id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor al borrar el usuario' });
  }
};

// Cifras para el panel del gestor.
const getStats = async (req, res) => {
  try {
    const [[users]] = await db.execute(
      `SELECT
         COUNT(*) AS total,
         SUM(role = 'client') AS clients,
         SUM(role = 'manager') AS managers,
         SUM(created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS newLast30Days
       FROM users`
    );
    const [[subs]] = await db.execute(
      "SELECT COUNT(*) AS active FROM subscriptions WHERE status = 'active' AND expires_at > NOW()"
    );
    const [[cars]] = await db.execute('SELECT COUNT(*) AS total FROM cars');
    const [[requests]] = await db.execute(
      `SELECT
         SUM(status = 'pending') AS pending,
         SUM(status <> 'pending' AND resolved_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS resolvedLast7Days
       FROM requests`
    );
    const [[maintenance]] = await db.execute(
      'SELECT COUNT(*) AS last30Days FROM maintenance WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)'
    );

    // SUM() devuelve NULL con la tabla vacía y DECIMAL (texto) en mysql2.
    const n = (v) => Number(v) || 0;
    res.json({
      users: {
        total: n(users.total),
        clients: n(users.clients),
        managers: n(users.managers),
        newLast30Days: n(users.newLast30Days),
      },
      subscriptions: { active: n(subs.active) },
      cars: { total: n(cars.total) },
      requests: { pending: n(requests.pending), resolvedLast7Days: n(requests.resolvedLast7Days) },
      maintenance: { last30Days: n(maintenance.last30Days) },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor al calcular las estadísticas' });
  }
};

module.exports = { promoteToManager, listUsers, deleteUser, getStats };
