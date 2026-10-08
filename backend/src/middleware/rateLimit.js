// Limitador de peticiones sencillo, en memoria y sin dependencias.
// Vale para un solo proceso de Node. Si algún día se ejecutan varias
// instancias detrás de un balanceador, habría que moverlo a Redis.

const rateLimit = ({ windowMs, max, message, keyFn }) => {
  const hits = new Map(); // key -> { count, resetAt }

  // Limpieza periódica para que el Map no crezca sin límite.
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, windowMs);
  cleanup.unref();

  const middleware = (req, res, next) => {
    if (process.env.NODE_ENV === 'test' && !middleware.enabledInTests) return next();

    const key = keyFn ? keyFn(req) : req.ip;
    const now = Date.now();
    let entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }

    entry.count += 1;

    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ error: message || 'Demasiadas peticiones, inténtalo más tarde' });
    }
    next();
  };

  middleware.reset = () => hits.clear();
  middleware.enabledInTests = false;
  return middleware;
};

// Login y registro: por IP + email, para frenar ataques de fuerza bruta.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Demasiados intentos. Espera unos minutos y vuelve a probar.',
  keyFn: (req) => `${req.ip}|${String(req.body?.email || '').toLowerCase()}`,
});

// Asistente de Claude: cada consulta cuesta dinero, limitamos por usuario.
const assistantLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: 'Has hecho muchas consultas al asistente. Vuelve a intentarlo en un rato.',
  keyFn: (req) => `user:${req.user?.id || req.ip}`,
});

// Límite general para toda la API.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
});

module.exports = { rateLimit, authLimiter, assistantLimiter, apiLimiter };
