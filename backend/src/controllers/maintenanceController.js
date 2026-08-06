const Maintenance = require('../models/Maintenance');
const Car = require('../models/Car');
const db = require('../config/database');

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

const createMaintenance = async (req, res) => {
  try {
    const { car_id, type_id, km, date, notes, workshop, own_breakdown } = req.body;

    const car = await Car.findByIdAndUserId(car_id, req.user.id);
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    const maintenanceId = await Maintenance.create({ car_id, type_id, km, date, notes, workshop, own_breakdown });
    res.status(201).json({ id: maintenanceId, message: 'Maintenance record created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error creating maintenance record' });
  }
};

module.exports = { getMaintenanceTypes, getCarMaintenance, createMaintenance };
