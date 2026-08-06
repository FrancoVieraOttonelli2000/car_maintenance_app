const express = require('express');
const router = express.Router();
const { getMaintenanceTypes, getCarMaintenance, createMaintenance } = require('../controllers/maintenanceController');
const { protect } = require('../middleware/authMiddleware');

router.get('/types', protect, getMaintenanceTypes);
router.get('/cars/:id/maintenance', protect, getCarMaintenance);
router.post('/', protect, createMaintenance);

module.exports = router;
