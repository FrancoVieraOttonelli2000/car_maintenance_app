const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const carRoutes = require('./routes/carRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const alertRoutes = require('./routes/alertRoutes');
const maintenancePlanRoutes = require('./routes/maintenancePlanRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const carAssistantRoutes = require('./routes/carAssistantRoutes');
const carFluidsRoutes = require('./routes/carFluidsRoutes');
const managerRoutes = require('./routes/managerRoutes');
const requestRoutes = require('./routes/requestRoutes');
const { apiLimiter } = require('./middleware/rateLimit');

const app = express();

// CORS: la app móvil nativa no envía cabecera Origin, así que no le afecta.
// Solo importa para la versión web (Expo web). Los orígenes permitidos se
// configuran en .env con CORS_ORIGINS=https://a.com,https://b.com
const DEFAULT_DEV_ORIGINS = ['http://localhost:8081', 'http://localhost:19006'];
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : DEFAULT_DEV_ORIGINS;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
}));
app.use(express.json({ limit: '100kb' }));
app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/maintenance-plans', maintenancePlanRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/car-assistant', carAssistantRoutes);
app.use('/api/car-fluids', carFluidsRoutes);
app.use('/api/managers', managerRoutes);
app.use('/api/requests', requestRoutes);

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Petición demasiado grande' });
  }
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app;
