const Maintenance = require('../models/Maintenance');
const Car = require('../models/Car');
const CarKmLog = require('../models/CarKmLog');
const db = require('../config/database');
const { isValidKm, isValidDate, toInt, isNonEmptyString } = require('../utils/validation');

const getMaintenanceTypes = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, name, interval_km FROM maintenance_types ORDER BY id');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error retrieving maintenance types' });
  }
};

const getCarMaintenance = async (req, res) => {
  try {
    const car = await Car.findByIdAndUserId(req.params.id, req.user.id);
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    const records = await Maintenance.findByCarId(req.params.id);
    const mappedRecords = records.map(record => ({
      id: record.id,
      tipo_de_mantenimiento: record.type_name,
      plan_operacion: record.plan_operacion,
      fecha: record.date,
      km: record.km,
      notas: record.notes,
      taller: record.workshop,
      averia_propia: record.own_breakdown
    }));
    res.json(mappedRecords);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error retrieving maintenance records' });
  }
};

// Un registro puede ser de un tipo genérico (type_id) o de una operación del
// plan de fábrica del coche (plan_operacion). Registrar una operación del
// plan es lo que hace que su aviso deje de salir como vencido.
const createMaintenance = async (req, res) => {
  try {
    const { car_id, type_id, plan_operacion, km, date, notes, workshop, own_breakdown } = req.body;

    const hasType = type_id !== undefined && type_id !== null && type_id !== '';
    const hasPlanOp = isNonEmptyString(plan_operacion, 255);
    if (hasType === hasPlanOp) {
      return res.status(400).json({ error: 'Indica un tipo de servicio o una operación del plan (solo uno)' });
    }
    if (!isValidKm(km)) {
      return res.status(400).json({ error: 'El kilometraje no es válido' });
    }
    if (!isValidDate(date)) {
      return res.status(400).json({ error: 'La fecha no es válida (formato YYYY-MM-DD)' });
    }
    if (date > new Date().toISOString().split('T')[0]) {
      return res.status(400).json({ error: 'La fecha no puede ser futura' });
    }
    if (notes && (typeof notes !== 'string' || notes.length > 2000)) {
      return res.status(400).json({ error: 'Las notas son demasiado largas' });
    }
    if (workshop && !isNonEmptyString(workshop, 150)) {
      return res.status(400).json({ error: 'El nombre del taller no es válido' });
    }

    if (car_id === undefined || car_id === null) {
      return res.status(404).json({ error: 'Car not found' });
    }
    const car = await Car.findByIdAndUserId(car_id, req.user.id);
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    const kmInt = toInt(km);

    if (hasType) {
      const [types] = await db.execute('SELECT id FROM maintenance_types WHERE id = ?', [toInt(type_id) ?? -1]);
      if (!types.length) {
        return res.status(400).json({ error: 'Tipo de servicio no válido' });
      }
    } else {
      const [ops] = await db.execute(
        'SELECT 1 FROM maintenance_plans WHERE marca = ? AND modelo = ? AND version = ? AND operacion = ? LIMIT 1',
        [car.brand, car.model, car.version, plan_operacion.trim()]
      );
      if (!ops.length) {
        return res.status(400).json({ error: 'Esa operación no está en el plan de mantenimiento de este coche' });
      }
    }

    const maintenanceId = await Maintenance.create({
      car_id,
      type_id: hasType ? toInt(type_id) : null,
      plan_operacion: hasPlanOp ? plan_operacion.trim() : null,
      km: kmInt,
      date,
      notes,
      workshop: workshop ? workshop.trim() : null,
      own_breakdown: !!own_breakdown,
    });

    // Si el servicio se hizo con más km de los que tenía apuntados el coche,
    // se actualiza también el kilometraje actual.
    if (kmInt > (car.current_km || 0)) {
      await Car.updateKm(car.id, kmInt);
      await CarKmLog.create(car.id, kmInt, date);
    }
    res.status(201).json({ id: maintenanceId, message: 'Maintenance record created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error creating maintenance record' });
  }
};

module.exports = { getMaintenanceTypes, getCarMaintenance, createMaintenance };
