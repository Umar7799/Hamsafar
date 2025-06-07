const express = require('express');
const router = express.Router();
const {
  createRide,
  searchRides,
  getRidePassengers,
  getDriverRides,
  updateRide,
  deleteRide,
  getRideById
} = require('../controllers/rideController');
const authenticateToken = require('../middleware/authMiddleware');

// ✅ POST a ride
router.post('/', authenticateToken, createRide);

// ✅ GET all rides for driver
router.get('/', authenticateToken, getDriverRides);

// ✅ Search rides
router.get('/search', searchRides);

// ✅ Get passengers for a ride
router.get('/:rideId/passengers', authenticateToken, getRidePassengers);


router.put('/:rideId', authenticateToken, updateRide);
router.delete('/:rideId', authenticateToken, deleteRide);
// ✅ Get a single ride by ID
router.get('/:rideId', authenticateToken, getRideById);



module.exports = router;
