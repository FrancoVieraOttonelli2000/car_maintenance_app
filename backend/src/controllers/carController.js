const Car = require('../models/Car');
const CarKmLog = require('../models/CarKmLog');
const { isNonEmptyString, isValidKm, isValidYear, isValidDate, toInt } = require('../utils/validation');

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

const validateCar = (body) => {
  if (!isNonEmptyString(body.plate, 20)) return 'La matrícula es obligatoria (máximo 20 caracteres)';
  if (!isNonEmptyString(body.brand, 50)) return 'La marca es obligatoria';
  if (!isNonEmptyString(body.model, 50)) return 'El modelo es obligatorio';
  if (body.version !== undefined && body.version !== null && body.version !== '' && !isNonEmptyString(body.version, 100)) {
    return 'La versión no es válida';
  }
  if (body.engine && !isNonEmptyString(body.engine, 50)) return 'El motor no es válido (máximo 50 caracteres)';
  if (body.fuel && !isNonEmptyString(body.fuel, 30)) return 'El combustible no es válido';
  if (!isValidYear(body.year)) return 'El año no es válido';
  if (!isValidKm(body.current_km)) return 'El kilometraje no es válido';
  return null;
};

const createCar = async (req, res) => {
  const validationError = validateCar(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    // Solo se copian los campos permitidos; el dueño siempre es el del token.
    // Ya no se crean registros "Registro inicial" a 0 km: el punto de partida
    // de los avisos es cars.initial_km (el km con el que se da de alta).
    const carId = await Car.create({
      user_id: req.user.id,
      plate: req.body.plate.trim().toUpperCase(),
      brand: req.body.brand.trim(),
      model: req.body.model.trim(),
      version: req.body.version ? String(req.body.version).trim() : null,
      engine: req.body.engine ? String(req.body.engine).trim() : null,
      fuel: req.body.fuel ? String(req.body.fuel).trim() : null,
      year: toInt(req.body.year),
      current_km: toInt(req.body.current_km),
    });

    res.status(201).json({ id: carId, message: 'Car created successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un vehículo con esa matrícula' });
    }
    console.error(error);
    res.status(500).json({ error: 'Server error creating car' });
  }
};

const updateCarKm = async (req, res) => {
  try {
    const { km: rawKm, date } = req.body;
    const carId = req.params.id;

    if (!isValidKm(rawKm)) {
      return res.status(400).json({ error: 'El kilometraje no es válido' });
    }
    const km = toInt(rawKm);

    // La fecha es opcional; si viene, se acepta YYYY-MM-DD o ISO completo.
    if (date !== undefined && date !== null && Number.isNaN(new Date(date).getTime())) {
      return res.status(400).json({ error: 'La fecha no es válida' });
    }
    if (date && typeof date === 'string' && date.length === 10 && !isValidDate(date)) {
      return res.status(400).json({ error: 'La fecha no es válida' });
    }

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

module.exports = { getUserCars, getCarById, createCar, updateCarKm };
