const express = require('express');
const router = express.Router();
const { getMarcas, getModelos, getVersiones, getPlan, getAlertas, getMotorizacion, getAlertasByCar } = require('../controllers/maintenancePlanController');
const { protect, requireSubscription } = require('../middleware/authMiddleware');

router.use(protect, requireSubscription);

router.get('/marcas', getMarcas);
router.get('/modelos/:marca', getModelos);
router.get('/versiones/:marca/:modelo', getVersiones);
router.get('/motorizacion/:marca/:modelo/:version', getMotorizacion);
router.get('/plan/:marca/:modelo/:version', getPlan);
router.get('/alertas-car/:carId', getAlertasByCar);
router.get('/alertas/:marca/:modelo/:version', getAlertas);

module.exports = router;
