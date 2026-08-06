const Car = require('../models/Car');
const Maintenance = require('../models/Maintenance');
const db = require('../config/database');

const getUserAlerts = async (req, res) => {
  try {
    const userId = req.user.id;
    const cars = await Car.findByUserId(userId);
    
    // Get all maintenance types
    const [maintenanceTypes] = await db.execute(
      'SELECT id, name, interval_km FROM maintenance_types ORDER BY id'
    );
    
    const alerts = [];

    for (const car of cars) {
      const maintenanceRecords = await Maintenance.findByCarId(car.id);
      
      // Group by type_id to find the latest
      const latestMaintenances = {};
      maintenanceRecords.forEach(record => {
        if (!latestMaintenances[record.type_id] || latestMaintenances[record.type_id].km < record.km) {
          latestMaintenances[record.type_id] = record;
        }
      });

      // Check alerts for each maintenance type
      for (const maintenanceType of maintenanceTypes) {
        const typeId = maintenanceType.id;
        const typeName = maintenanceType.name;
        const intervalKm = maintenanceType.interval_km;

        let lastRecord = latestMaintenances[typeId];
        
        // If no record exists, treat as if last maintenance was at 0 km
        if (!lastRecord) {
          lastRecord = {
            km: 0,
            type_name: typeName,
            interval_km: intervalKm,
            type_id: typeId
          };
        }

        const distanceSinceLast = car.current_km - lastRecord.km;

        if (distanceSinceLast >= intervalKm) {
          alerts.push({
            car_id: car.id,
            car_name: `${car.brand} ${car.model} (${car.plate})`,
            type_id: typeId,
            type_name: typeName,
            message: `Toca revisar: ${typeName}. Llevas ${distanceSinceLast - intervalKm} km de retraso.`,
            overdue_km: distanceSinceLast - intervalKm,
            last_maintenance_km: lastRecord.km
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
