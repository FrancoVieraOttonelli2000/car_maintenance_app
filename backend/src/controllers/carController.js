const Car = require('../models/Car');
const CarKmLog = require('../models/CarKmLog');
const Maintenance = require('../models/Maintenance');
const db = require('../config/database');

const getUserCars = async (req, res) => {
  try {
    const cars = await Car.findByUserId(req.user.id);
    res.json(cars);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error retrieving cars' });
  }
};

const getCarById = async (req, res) => {
  try {
    const car = await Car.findByIdAndUserId(req.params.id, req.user.id);
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    res.json(car);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error retrieving car' });
  }
};

const createCar = async (req, res) => {
  try {
    const carData = { ...req.body, user_id: req.user.id };
    const carId = await Car.create(carData);
    
    // Initialize maintenance records at 0 km for this car
    try {
      const [maintenanceTypes] = await db.execute(
        'SELECT id, name FROM maintenance_types ORDER BY id'
      );
      
      const today = new Date().toISOString().split('T')[0];
      
      for (const type of maintenanceTypes) {
        await Maintenance.create({
          car_id: carId,
          type_id: type.id,
          km: 0,
          date: today,
          notes: 'Registro inicial',
          workshop: null,
          own_breakdown: false
        });
      }
    } catch (initError) {
      console.warn('Warning: Could not initialize maintenance records:', initError.message);
    }
    
    res.status(201).json({ id: carId, message: 'Car created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error creating car' });
  }
};

const deleteCar = async (req, res) => {
  try {
    console.log(`DELETE car id=${req.params.id} by user id=${req.user?.id}`);
    const affectedRows = await Car.delete(req.params.id, req.user.id);
    console.log(`affectedRows=${affectedRows}`);
    if (affectedRows === 0) {
      return res.status(404).json({ error: 'Car not found or not authorized' });
    }
    res.json({ message: 'Car deleted successfully' });
  } catch (error) {
    console.error('deleteCar error:', error);
    res.status(500).json({ error: 'Server error deleting car' });
  }
};

const updateCarKm = async (req, res) => {
  try {
    const { km, date } = req.body;
    const carId = req.params.id;

    const car = await Car.findByIdAndUserId(carId, req.user.id);
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    if (km < car.current_km) {
       return res.status(400).json({ error: 'New KM cannot be less than current KM' });
    }

    await Car.updateKm(carId, km);
    await CarKmLog.create(carId, km, date);

    res.json({ message: 'Current KM updated successfully', current_km: km });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error updating KM' });
  }
};

module.exports = { getUserCars, getCarById, createCar, deleteCar, updateCarKm };
