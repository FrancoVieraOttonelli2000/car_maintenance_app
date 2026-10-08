const express = require('express');
const router = express.Router();
const { getMaintenanceTypes, getCarMaintenance, createMaintenance } = require('../controllers/maintenanceController');
const { protect, requireSubscription } = require('../middleware/authMiddleware');

router.use(protect, requireSubscription);

router.get('/types', getMaintenanceTypes);
router.get('/cars/:id/maintenance', getCarMaintenance);
router.post('/', createMaintenance);

module.exports = router;
