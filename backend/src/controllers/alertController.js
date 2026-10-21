const Car = require('../models/Car');
const Maintenance = require('../models/Maintenance');
const db = require('../config/database');
const { calcularPlanCoche } = require('./maintenancePlanController');

// Avisos de mantenimiento de todos los coches del usuario (pantalla Avisos y
// los inicios de cliente y gestor).
//
// - Si el coche tiene plan de fábrica (marca/modelo/versión en
//   maintenance_plans), los avisos salen de ese plan: las operaciones vencidas
//   por km o por tiempo. Es lo mismo que se ve en la ficha del coche.
// - Si no lo tiene, se usan los tipos genéricos (maintenance_types).
//
// En los tipos genéricos, si un tipo nunca se ha registrado, se toma como punto de partida el km con
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
      const carName = `${car.brand} ${car.model} (${car.plate})`;

      const plan = await calcularPlanCoche(car);
      if (plan.length) {
        for (const op of plan.filter((o) => o.vencido)) {
          const overdueKm = op.kmRestantes !== null && op.kmRestantes <= 0 ? -op.kmRestantes : null;
          const overdueDays = op.diasRestantes !== null && op.diasRestantes <= 0 ? -op.diasRestantes : null;
          alerts.push({
            source: 'plan',
            car_id: car.id,
            car_name: carName,
            type_id: null,
            type_name: op.operacion,
            message: overdueKm !== null
              ? `Toca revisar: ${op.operacion}. Llevas ${overdueKm} km de retraso.`
              : `Toca revisar: ${op.operacion}. Lleva ${overdueDays} días vencido.`,
            overdue_km: overdueKm,
            overdue_days: overdueDays,
            due_km: op.proximoKm,
            last_maintenance_km: op.ultimoKm,
          });
        }
        continue;
      }

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
            source: 'generic',
            car_id: car.id,
            car_name: carName,
            type_id: typeId,
            type_name: typeName,
            message: `Toca revisar: ${typeName}. Llevas ${distanceSinceLast - intervalKm} km de retraso.`,
            overdue_km: distanceSinceLast - intervalKm,
            last_maintenance_km: lastRecord ? lastRecord.km : null,
          });
        }
      }
    }

    // Los más atrasados primero.
    alerts.sort((a, b) => (b.overdue_km ?? 0) - (a.overdue_km ?? 0));
    res.json(alerts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error retrieving alerts' });
  }
};

module.exports = { getUserAlerts };
