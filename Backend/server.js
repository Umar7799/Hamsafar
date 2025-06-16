// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const http = require('http');

const authRoutes = require('./routes/auth');
const authenticateToken = require('./middleware/authMiddleware');
const rideRoutes = require('./routes/rides');
const bookingRoutes = require('./routes/bookings');
const ratingRoutes = require('./routes/ratings');
const messagingRoutes = require('./routes/messaging');

const socket = require('./socket');

const app = express();
const server = http.createServer(app);
const io = socket.init(server); // ✅ Initialize socket with the server

const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/conversations', messagingRoutes);

app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: 'You accessed a protected route!', user: req.user });
});

app.get('/', (req, res) => {
  res.send('Hamsafar backend running...');
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = { server }; // You no longer need to export `io`
