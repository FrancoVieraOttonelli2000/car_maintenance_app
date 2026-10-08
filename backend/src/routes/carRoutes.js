const express = require('express');
const router = express.Router();
const { getUserCars, getCarById, createCar, updateCarKm } = require('../controllers/carController');
const { protect, requireSubscription } = require('../middleware/authMiddleware');

router.use(protect, requireSubscription);

router.get('/user/:userId', getUserCars);
router.post('/', createCar);
router.get('/:id', getCarById);
// No hay ruta DELETE: borrar un coche pasa por POST /api/requests
// (type: 'delete_vehicle') y un gestor tiene que aprobarlo.
router.post('/:id/km', updateCarKm);

module.exports = router;
