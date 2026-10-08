const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Verifica el JWT y carga el usuario desde la base de datos en cada petición.
// Así el rol siempre es el actual (si un gestor promueve a alguien, o se
// borra un usuario, no hay que esperar a que caduque el token de 30 días).
const protect = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ error: 'Not authorized, token failed' });
  }

  try {
    const [rows] = await db.execute(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [decoded.id]
    );
    if (!rows.length) {
      return res.status(401).json({ error: 'Not authorized, user not found' });
    }
    req.user = rows[0]; // { id, name, email, role }
    next();
  } catch (error) {
    console.error('protect error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const requireManager = (req, res, next) => {
  if (req.user?.role !== 'manager') {
    return res.status(403).json({ error: 'Manager access required' });
  }
  next();
};

// El muro de pago se aplica aquí, en el servidor. La app también redirige a
// la pantalla de suscripción, pero eso solo es comodidad: quien llame a la
// API directamente sin suscripción recibe un 402.
// Los gestores no pagan suscripción.
const requireSubscription = async (req, res, next) => {
  if (req.user?.role === 'manager') return next();

  try {
    const [rows] = await db.execute(
      "SELECT id FROM subscriptions WHERE user_id = ? AND status = 'active' AND expires_at > NOW()",
      [req.user.id]
    );
    if (!rows.length) {
      return res.status(402).json({
        error: 'Necesitas una suscripción activa',
        code: 'SUBSCRIPTION_REQUIRED',
      });
    }
    next();
  } catch (error) {
    console.error('requireSubscription error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { protect, requireManager, requireSubscription };
