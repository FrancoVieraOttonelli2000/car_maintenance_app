const db = require('../config/database');
const Maintenance = require('../models/Maintenance');

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

// A marca+modelo+version puede tener varias filas por motorización (p.ej. Golf
// Base = 1.0 TSI y 1.5 TSI), cada una con el catálogo completo de operaciones.
// Como la UI no distingue por motorización, nos quedamos con una fila por
// `operacion`: la de intervalo más conservador (menor cada_km, priorizando
// que tenga valor si la otra es NULL).
const DEDUP_BY_OPERACION = `
  SELECT operacion, cada_km, cada_meses, primera_vez_km, notas FROM (
    SELECT mp.*,
           ROW_NUMBER() OVER (
             PARTITION BY operacion
             ORDER BY (cada_km IS NULL) ASC, cada_km ASC, id ASC
           ) AS rn
    FROM maintenance_plans mp
    WHERE marca = ? AND modelo = ? AND version = ?
  ) t
  WHERE rn = 1
`;

const getPlan = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `${DEDUP_BY_OPERACION} ORDER BY cada_km ASC`,
      [req.params.marca, req.params.modelo, req.params.version]
    );
    res.json(rows);
  } catch (err) {
    console.error('getPlan error:', err);
    res.status(500).json({ error: 'Error al obtener el plan de mantenimiento' });
  }
};

// Calcula cuándo toca una operación del plan de fábrica.
//
// - Si el usuario ya registró esa operación (maintenance.plan_operacion), la
//   próxima vez es a los km de ese registro + cada_km. Así, registrar el
//   servicio hace que el aviso deje de salir como vencido.
// - Si nunca se registró, se sigue el calendario de fábrica (primera_vez_km y
//   luego cada cada_km), pero solo a partir del km con el que se dio de alta
//   el coche (baseKm): lo que tocaba antes de tenerlo en la app no se sabe si
//   se hizo, así que no se marca como vencido.
const calcularVencimientoKm = (op, km, { ultimoKm = null, baseKm = 0 } = {}) => {
  if (!op.cada_km) return { proximoKm: null, kmRestantes: null, vencido: false };

  let proximoKm;
  if (ultimoKm !== null && ultimoKm !== undefined) {
    proximoKm = ultimoKm + op.cada_km;
  } else {
    const anchorKm = op.primera_vez_km || op.cada_km;
    if (baseKm < anchorKm) {
      proximoKm = anchorKm;
    } else {
      const ciclos = Math.floor((baseKm - anchorKm) / op.cada_km) + 1;
      proximoKm = anchorKm + ciclos * op.cada_km;
    }
  }

  const kmRestantes = proximoKm - km; // <= 0 => vencido
  return { proximoKm, kmRestantes, vencido: kmRestantes <= 0 };
};

const calcularVencimientoFecha = (op, fechaBase) => {
  if (!op.cada_meses || !fechaBase) return { proximaFecha: null, diasRestantes: null };
  const fecha = new Date(fechaBase);
  if (Number.isNaN(fecha.getTime())) return { proximaFecha: null, diasRestantes: null };
  fecha.setMonth(fecha.getMonth() + op.cada_meses);
  return {
    proximaFecha: fecha.toISOString().split('T')[0],
    diasRestantes: Math.ceil((fecha - new Date()) / (1000 * 60 * 60 * 24)),
  };
};

const getAlertas = async (req, res) => {
  try {
    const { kmActual, fechaUltimoServicio } = req.query;
    const km = parseInt(kmActual) || 0;
    const fechaBase = fechaUltimoServicio ? new Date(fechaUltimoServicio) : null;

    const [rows] = await db.execute(
      DEDUP_BY_OPERACION,
      [req.params.marca, req.params.modelo, req.params.version]
    );

    // Simulador de la pantalla "Plan de mantenimiento" (sin coche concreto):
    // no hay historial, así que se supone que el plan se ha seguido y se
    // muestra cuándo toca cada operación a partir de los km indicados.
    // Lo que sí puede salir vencido es la parte por tiempo, si se indica la
    // fecha del último servicio.
    const result = rows.map(op => {
      const { proximoKm, kmRestantes, vencido } = calcularVencimientoKm(op, km, { baseKm: km });
      const { proximaFecha, diasRestantes } = calcularVencimientoFecha(op, fechaBase);

      const vencidoPorFecha = diasRestantes !== null && diasRestantes <= 0;
      const alerta = vencido || vencidoPorFecha
        || (kmRestantes !== null && kmRestantes <= 2000)
        || (diasRestantes !== null && diasRestantes <= 30);
      return { ...op, proximoKm, kmRestantes, proximaFecha, diasRestantes, vencido: vencido || vencidoPorFecha, alerta };
    });

    res.json(result);
  } catch (err) {
    console.error('getAlertas error:', err);
    res.status(500).json({ error: 'Error al calcular las alertas' });
  }
};

// Estado de cada operación del plan de fábrica para un coche concreto
// (con su historial). Devuelve [] si no hay plan para su marca/modelo/versión.
// Lo usan la ficha del coche y los Avisos.
const calcularPlanCoche = async (car) => {
  const km = parseInt(car.current_km) || 0;
  const baseKm = car.initial_km ?? 0;

  const [rows] = await db.execute(
    `SELECT * FROM (${DEDUP_BY_OPERACION}) deduped WHERE cada_km IS NOT NULL ORDER BY cada_km ASC`,
    [car.brand, car.model, car.version]
  );
  if (!rows.length) return [];

  const registros = await Maintenance.findLatestPlanRecords(car.id);

  return rows.map(op => {
    const ultimo = registros[op.operacion] || null;
    const { proximoKm, kmRestantes, vencido: vencidoKm } = calcularVencimientoKm(op, km, {
      ultimoKm: ultimo ? ultimo.km : null,
      baseKm,
    });
    // Por tiempo solo se puede calcular si hay un registro con fecha.
    const { proximaFecha, diasRestantes } = calcularVencimientoFecha(op, ultimo ? ultimo.date : null);
    const vencidoFecha = diasRestantes !== null && diasRestantes <= 0;

    const vencido = vencidoKm || vencidoFecha;
    const urgente = vencido || kmRestantes <= 500 || (diasRestantes !== null && diasRestantes <= 7);
    const alerta = urgente || kmRestantes <= 2000 || (diasRestantes !== null && diasRestantes <= 30);

    return {
      ...op,
      proximoKm,
      kmRestantes,
      proximaFecha,
      diasRestantes,
      ultimoKm: ultimo ? ultimo.km : null,
      ultimaFecha: ultimo ? ultimo.date : null,
      vencido,
      alerta,
      urgente,
    };
  }).sort((a, b) => a.kmRestantes - b.kmRestantes);
};

const getAlertasByCar = async (req, res) => {
  try {
    const [cars] = await db.execute(
      'SELECT id, brand, model, version, current_km, initial_km FROM cars WHERE id = ? AND user_id = ?',
      [req.params.carId, req.user.id]
    );
    if (!cars.length) return res.status(404).json({ error: 'Car not found' });

    res.json(await calcularPlanCoche(cars[0]));
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

module.exports = { getMarcas, getModelos, getVersiones, getPlan, getAlertas, getMotorizacion, getAlertasByCar, calcularVencimientoKm, calcularPlanCoche };
