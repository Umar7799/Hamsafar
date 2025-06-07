const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const authRoutes = require('./routes/auth');
const authenticateToken = require('./middleware/authMiddleware');
const rideRoutes = require('./routes/rides');
const bookingRoutes = require('./routes/bookings');
const ratingRoutes = require('./routes/ratings');


const app = express();
const prisma = new PrismaClient();

// ✅ Apply middlewares
app.use(cors());
app.use(express.json());

// ✅ API routes
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/ratings', ratingRoutes);


// ✅ Protected route
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: 'You accessed a protected route!', user: req.user });
});

// ✅ Basic root route
app.get('/', (req, res) => {
  res.send('Hamsafar backend running...');
});

// ✅ Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
