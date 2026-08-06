const db = require('../config/database');

const getMarcas = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT DISTINCT marca FROM maintenance_plans ORDER BY marca');
    res.json(rows.map(r => r.marca));
  } catch (err) {
    console.error('getMarcas error:', err);
    res.status(500).json({ error: 'Error al obtener las marcas' });
  }
};

const getModelos = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT DISTINCT modelo FROM maintenance_plans WHERE marca = ? ORDER BY modelo',
      [req.params.marca]
    );
    res.json(rows.map(r => r.modelo));
  } catch (err) {
    console.error('getModelos error:', err);
    res.status(500).json({ error: 'Error al obtener los modelos' });
  }
};

const getVersiones = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT DISTINCT version FROM maintenance_plans
       WHERE marca = ? AND modelo = ?
         AND version NOT IN ('Diesel','EV','PHEV','Hybrid','Gasolina','Electrico','Eléctrico')
       ORDER BY version`,
      [req.params.marca, req.params.modelo]
    );
    res.json(rows.map(r => r.version));
  } catch (err) {
    console.error('getVersiones error:', err);
    res.status(500).json({ error: 'Error al obtener las versiones' });
  }
};

const getPlan = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM maintenance_plans WHERE marca = ? AND modelo = ? AND version = ? ORDER BY cada_km ASC',
      [req.params.marca, req.params.modelo, req.params.version]
    );
    res.json(rows);
  } catch (err) {
    console.error('getPlan error:', err);
    res.status(500).json({ error: 'Error al obtener el plan de mantenimiento' });
  }
};

const getAlertas = async (req, res) => {
  try {
    const { kmActual, fechaUltimoServicio } = req.query;
    const km = parseInt(kmActual) || 0;
    const fechaBase = fechaUltimoServicio ? new Date(fechaUltimoServicio) : null;

    const [rows] = await db.execute(
      'SELECT * FROM maintenance_plans WHERE marca = ? AND modelo = ? AND version = ?',
      [req.params.marca, req.params.modelo, req.params.version]
    );

    const result = rows.map(op => {
      let proximoKm = null, kmRestantes = null, proximaFecha = null, diasRestantes = null;

      if (op.cada_km) {
        proximoKm = (Math.floor(km / op.cada_km) + 1) * op.cada_km;
        kmRestantes = proximoKm - km;
      }
      if (op.cada_meses && fechaBase) {
        const fecha = new Date(fechaBase);
        fecha.setMonth(fecha.getMonth() + op.cada_meses);
        proximaFecha = fecha.toISOString().split('T')[0];
        diasRestantes = Math.ceil((fecha - new Date()) / (1000 * 60 * 60 * 24));
      }

      const alerta = (kmRestantes !== null && kmRestantes <= 2000) || (diasRestantes !== null && diasRestantes <= 30);
      return { ...op, proximoKm, kmRestantes, proximaFecha, diasRestantes, alerta };
    });

    res.json(result);
  } catch (err) {
    console.error('getAlertas error:', err);
    res.status(500).json({ error: 'Error al calcular las alertas' });
  }
};

const getAlertasByCar = async (req, res) => {
  try {
    const [cars] = await db.execute(
      'SELECT brand, model, version, current_km FROM cars WHERE id = ? AND user_id = ?',
      [req.params.carId, req.user.id]
    );
    if (!cars.length) return res.status(404).json({ error: 'Car not found' });

    const { brand, model, version, current_km } = cars[0];
    const km = parseInt(current_km) || 0;

    const [rows] = await db.execute(
      'SELECT * FROM maintenance_plans WHERE marca = ? AND modelo = ? AND version = ? AND cada_km IS NOT NULL ORDER BY cada_km ASC',
      [brand, model, version]
    );

    if (!rows.length) return res.json([]);

    const result = rows.map(op => {
      const proximoKm = (Math.floor(km / op.cada_km) + 1) * op.cada_km;
      const kmRestantes = proximoKm - km;
      const urgente = kmRestantes <= 500;
      const alerta = kmRestantes <= 2000;
      return { ...op, proximoKm, kmRestantes, alerta, urgente };
    }).sort((a, b) => a.kmRestantes - b.kmRestantes);

    res.json(result);
  } catch (err) {
    console.error('getAlertasByCar error:', err);
    res.status(500).json({ error: 'Error al calcular las alertas del vehículo' });
  }
};

const getMotorizacion = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT DISTINCT motorizacion FROM maintenance_plans WHERE marca = ? AND modelo = ? AND version = ? LIMIT 1',
      [req.params.marca, req.params.modelo, req.params.version]
    );
    res.json(rows[0] || { motorizacion: '' });
  } catch (err) {
    console.error('getMotorizacion error:', err);
    res.status(500).json({ error: 'Error al obtener la motorización' });
  }
};

module.exports = { getMarcas, getModelos, getVersiones, getPlan, getAlertas, getMotorizacion, getAlertasByCar };
