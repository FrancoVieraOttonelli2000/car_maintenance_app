const express = require('express');
const router = express.Router();
const { getMarcas, getModelos, getVersiones, getPlan, getAlertas, getMotorizacion, getAlertasByCar } = require('../controllers/maintenancePlanController');
const { protect } = require('../middleware/authMiddleware');

router.get('/marcas', protect, getMarcas);
router.get('/modelos/:marca', protect, getModelos);
router.get('/versiones/:marca/:modelo', protect, getVersiones);
router.get('/motorizacion/:marca/:modelo/:version', protect, getMotorizacion);
router.get('/plan/:marca/:modelo/:version', protect, getPlan);
router.get('/alertas-car/:carId', protect, getAlertasByCar);
router.get('/alertas/:marca/:modelo/:version', protect, getAlertas);

module.exports = router;
