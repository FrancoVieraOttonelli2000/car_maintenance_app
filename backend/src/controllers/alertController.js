const Car = require('../models/Car');
const Maintenance = require('../models/Maintenance');
const db = require('../config/database');

// Avisos de los tipos genéricos (maintenance_types).
// Si un tipo nunca se ha registrado, se toma como punto de partida el km con
// el que se dio de alta el coche (initial_km). Antes se suponía 0 km, y un
// coche usado de 150.000 km nacía con todos los avisos muy vencidos.
const getUserAlerts = async (req, res) => {
  try {
    const userId = req.user.id;
    const cars = await Car.findByUserId(userId);

    const [maintenanceTypes] = await db.execute(
      'SELECT id, name, interval_km FROM maintenance_types ORDER BY id'
    );

    const alerts = [];

    for (const car of cars) {
      const maintenanceRecords = await Maintenance.findByCarId(car.id);

      const latestMaintenances = {};
      maintenanceRecords.forEach(record => {
        if (record.type_id === null) return; // registros del plan de fábrica
        if (!latestMaintenances[record.type_id] || latestMaintenances[record.type_id].km < record.km) {
          latestMaintenances[record.type_id] = record;
        }
      });

      const baseKm = car.initial_km ?? 0;

      for (const maintenanceType of maintenanceTypes) {
        const typeId = maintenanceType.id;
        const typeName = maintenanceType.name;
        const intervalKm = maintenanceType.interval_km;
        if (!intervalKm) continue;

        const lastRecord = latestMaintenances[typeId];
        const lastKm = lastRecord ? lastRecord.km : baseKm;

        const distanceSinceLast = (car.current_km || 0) - lastKm;

        if (distanceSinceLast >= intervalKm) {
          alerts.push({
            car_id: car.id,
            car_name: `${car.brand} ${car.model} (${car.plate})`,
            type_id: typeId,
            type_name: typeName,
            message: `Toca revisar: ${typeName}. Llevas ${distanceSinceLast - intervalKm} km de retraso.`,
            overdue_km: distanceSinceLast - intervalKm,
            last_maintenance_km: lastRecord ? lastRecord.km : null,
          });
        }
      }
    }

    res.json(alerts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error retrieving alerts' });
  }
};

module.exports = { getUserAlerts };
