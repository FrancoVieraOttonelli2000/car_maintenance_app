const db = require('../config/database');

const getCarFluids = async (req, res) => {
  const { carId } = req.params;
  const userId = req.user.id;

  try {
    const [cars] = await db.execute(
      'SELECT * FROM cars WHERE id = ? AND user_id = ?',
      [carId, userId]
    );
    if (!cars.length) return res.status(404).json({ error: 'Vehículo no encontrado' });

    const car = cars[0];

    // Try exact match with year range first, then fallback to brand+model only
    const [rows] = await db.execute(
      `SELECT * FROM car_fluids
       WHERE LOWER(brand) = LOWER(?) AND LOWER(model) = LOWER(?)
         AND year_from <= ? AND year_to >= ?
       ORDER BY year_from DESC LIMIT 1`,
      [car.brand, car.model, car.year, car.year]
    );

    let fluids = rows[0] || null;

    if (!fluids) {
      const [fallback] = await db.execute(
        `SELECT * FROM car_fluids
         WHERE LOWER(brand) = LOWER(?) AND LOWER(model) = LOWER(?)
         ORDER BY year_from DESC LIMIT 1`,
        [car.brand, car.model]
      );
      fluids = fallback[0] || null;
    }

    res.json({ car, fluids });
  } catch (err) {
    console.error('getCarFluids error:', err);
    res.status(500).json({ error: 'Error al obtener los fluidos del vehículo' });
  }
};

module.exports = { getCarFluids };
