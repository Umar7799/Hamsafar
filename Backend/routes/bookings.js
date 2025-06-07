const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const { createBooking, getMyBookings, cancelBooking, acceptBooking, rejectBooking } = require('../controllers/bookingController');

router.post('/', authenticateToken, createBooking);
router.get('/me', authenticateToken, getMyBookings);
router.delete('/:bookingId', authenticateToken, cancelBooking);
router.patch('/:id/accept', acceptBooking);
router.patch('/:id/reject', rejectBooking);


module.exports = router;
