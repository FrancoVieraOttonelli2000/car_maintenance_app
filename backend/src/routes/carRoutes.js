const express = require('express');
const router = express.Router();
const { getUserCars, getCarById, createCar, updateCarKm } = require('../controllers/carController');
const { protect } = require('../middleware/authMiddleware');

router.get('/user/:userId', protect, getUserCars);
router.post('/', protect, createCar);
router.get('/:id', protect, getCarById);
// No direct DELETE route: deleting a car goes through POST /api/requests
// (type: 'delete_vehicle') so a manager has to approve it first.
// approveRequest calls Car.delete(...) on the model directly.
router.post('/:id/km', protect, updateCarKm);

module.exports = router;
