const Request = require('../models/Request');
const User = require('../models/User');
const Car = require('../models/Car');
const db = require('../config/database');

const SUPPORTED_TYPES = ['delete_vehicle', 'edit_user_data'];
const EDITABLE_FIELDS = ['name', 'email'];

const createRequest = async (req, res) => {
  try {
    const { type, payload } = req.body;

    if (!SUPPORTED_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Unsupported request type' });
    }

    if (type === 'delete_vehicle') {
      if (!payload || !payload.car_id) {
        return res.status(400).json({ error: 'payload.car_id is required' });
      }
    }

    if (type === 'edit_user_data') {
      if (!payload || !EDITABLE_FIELDS.includes(payload.field) || payload.new_value === undefined) {
        return res.status(400).json({ error: 'payload must include field (name or email) and new_value' });
      }
    }

    const requestId = await Request.create(req.user.id, type, payload);
    res.status(201).json({ id: requestId, message: 'Request created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error creating request' });
  }
};

const listRequests = async (req, res) => {
  try {
    const { status } = req.query;

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
    try {
      await connection.beginTransaction();

      if (request.type === 'delete_vehicle') {
        await Car.delete(request.payload.car_id, request.user_id, connection);
      } else if (request.type === 'edit_user_data') {
        await User.updateField(request.user_id, request.payload.field, request.payload.new_value, connection);
      }

      await Request.updateStatus(request.id, 'approved', req.user.id, req.body?.note, connection);

      await connection.commit();
    } catch (txError) {
      await connection.rollback();
      throw txError;
    } finally {
      connection.release();
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

    await Request.updateStatus(request.id, 'rejected', req.user.id, req.body?.note);
    res.json({ message: 'Request rejected successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error rejecting request' });
  }
};

module.exports = { createRequest, listRequests, approveRequest, rejectRequest };
