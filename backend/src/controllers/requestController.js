const Request = require('../models/Request');
const User = require('../models/User');
const Car = require('../models/Car');
const db = require('../config/database');
const { isNonEmptyString, isValidEmail } = require('../utils/validation');

const SUPPORTED_TYPES = ['delete_vehicle', 'edit_user_data'];
const EDITABLE_FIELDS = ['name', 'email'];
const VALID_STATUSES = ['pending', 'approved', 'rejected', 'all'];

const createRequest = async (req, res) => {
  try {
    const { type, payload } = req.body;

    if (!SUPPORTED_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Unsupported request type' });
    }

    let cleanPayload;

    if (type === 'delete_vehicle') {
      if (!payload || !payload.car_id) {
        return res.status(400).json({ error: 'payload.car_id is required' });
      }

      // El coche tiene que existir y ser del usuario.
      const car = await Car.findByIdAndUserId(payload.car_id, req.user.id);
      if (!car) {
        return res.status(404).json({ error: 'Car not found' });
      }

      const pending = await Request.findPendingByUserAndType(req.user.id, 'delete_vehicle');
      if (pending.some((r) => String(r.payload?.car_id) === String(car.id))) {
        return res.status(409).json({ error: 'Ya hay una solicitud pendiente para borrar este vehículo' });
      }

      // Se guarda una copia de los datos del coche para que el gestor vea qué
      // se va a borrar (y quede en el historial aunque el coche ya no exista).
      cleanPayload = {
        car_id: car.id,
        plate: car.plate,
        brand: car.brand,
        model: car.model,
      };
    }

    if (type === 'edit_user_data') {
      if (!payload || !EDITABLE_FIELDS.includes(payload.field) || payload.new_value === undefined) {
        return res.status(400).json({ error: 'payload must include field (name or email) and new_value' });
      }

      const newValue = typeof payload.new_value === 'string' ? payload.new_value.trim() : payload.new_value;

      if (payload.field === 'name' && !isNonEmptyString(newValue, 100)) {
        return res.status(400).json({ error: 'El nombre no es válido (máximo 100 caracteres)' });
      }

      if (payload.field === 'email') {
        if (!isValidEmail(newValue)) {
          return res.status(400).json({ error: 'El email no es válido' });
        }
        const existing = await User.findByEmail(newValue);
        if (existing && existing.id !== req.user.id) {
          return res.status(409).json({ error: 'Ese email ya lo usa otra cuenta' });
        }
      }

      if (newValue === req.user[payload.field]) {
        return res.status(400).json({ error: 'El valor nuevo es igual al actual' });
      }

      cleanPayload = {
        field: payload.field,
        old_value: req.user[payload.field],
        new_value: newValue,
      };
    }

    const requestId = await Request.create(req.user.id, type, cleanPayload);
    res.status(201).json({ id: requestId, message: 'Request created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error creating request' });
  }
};

const listRequests = async (req, res) => {
  try {
    const { status } = req.query;

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Estado no válido' });
    }

    let requests;
    if (!status) {
      requests = await Request.findPending();
    } else if (status === 'all') {
      requests = await Request.findAll();
    } else {
      requests = await Request.findByStatus(status);
    }

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error retrieving requests' });
  }
};

// Marca como rechazada una solicitud que ya no se puede aplicar, para que no
// se quede atascada en la lista de pendientes.
const autoReject = async (requestId, managerId, note) => {
  try {
    await Request.updateStatus(requestId, 'rejected', managerId, note);
  } catch (err) {
    console.error('autoReject error:', err);
  }
};

const approveRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request is not pending' });
    }

    const connection = await db.getConnection();
    let conflict = null;
    try {
      await connection.beginTransaction();

      // Primero se "reserva" la solicitud: si otro gestor la aprobó o rechazó
      // a la vez, este UPDATE no afecta a ninguna fila.
      const claimed = await Request.updateStatus(request.id, 'approved', req.user.id, req.body?.note, connection);
      if (claimed === 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'Request is not pending' });
      }

      if (request.type === 'delete_vehicle') {
        const deleted = await Car.delete(request.payload.car_id, request.user_id, connection);
        if (deleted === 0) {
          conflict = 'El vehículo ya no existe';
        }
      } else if (request.type === 'edit_user_data') {
        try {
          await User.updateField(request.user_id, request.payload.field, request.payload.new_value, connection);
        } catch (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            conflict = 'Ese email ya lo usa otra cuenta';
          } else {
            throw err;
          }
        }
      }

      if (conflict) {
        await connection.rollback();
      } else {
        await connection.commit();
      }
    } catch (txError) {
      await connection.rollback();
      throw txError;
    } finally {
      connection.release();
    }

    if (conflict) {
      await autoReject(request.id, req.user.id, `Rechazada automáticamente: ${conflict}`);
      return res.status(409).json({ error: `${conflict}. La solicitud se ha marcado como rechazada.` });
    }

    res.json({ message: 'Request approved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error approving request' });
  }
};

const rejectRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request is not pending' });
    }

    const updated = await Request.updateStatus(request.id, 'rejected', req.user.id, req.body?.note);
    if (updated === 0) {
      return res.status(400).json({ error: 'Request is not pending' });
    }
    res.json({ message: 'Request rejected successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error rejecting request' });
  }
};

module.exports = { createRequest, listRequests, approveRequest, rejectRequest };
