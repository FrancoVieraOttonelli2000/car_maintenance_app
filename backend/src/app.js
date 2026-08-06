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

const app = express();

app.use(cors());
app.use(express.json());

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
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app;
