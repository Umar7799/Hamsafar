const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getRideById = async (req, res) => {
  const { rideId } = req.params;

  try {
    const ride = await prisma.ride.findUnique({
      where: { id: parseInt(rideId) },
      include: {
        driver: {
          select: { id: true, name: true, email: true, phone: true },
        },
        bookings: {
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        },
        ratings: {
          select: {
            id: true,
            score: true,
            comment: true,
            toUserId: true,
            fromUserId: true,
          },
        },
      },
    });

    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    res.json({ ride });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch ride' });
  }
};




const createRide = async (req, res) => {
  const { from, to, date, time, price, seats } = req.body;
  const user = req.user;

  if (user.role !== 'DRIVER') {
    return res.status(403).json({ message: 'Only drivers can create rides' });
  }

  try {
    const ride = await prisma.ride.create({
      data: {
        from,
        to,
        date: new Date(date),
        time,
        price: parseFloat(price),
        seats: parseInt(seats),
        driverId: user.userId,
      },
    });

    res.status(201).json({ message: 'Ride created successfully', ride });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating ride' });
  }
};

const searchRides = async (req, res) => {
  const {
    from,
    to,
    dateFrom,
    dateTo,
    priceMin,
    priceMax
  } = req.query;

  if (!from || !to) {
    return res.status(400).json({ message: 'from and to are required' });
  }

  try {
    const rides = await prisma.ride.findMany({
      where: {
        from: { contains: from, mode: 'insensitive' },
        to: { contains: to, mode: 'insensitive' },
        ...(dateFrom || dateTo
          ? {
              date: {
                ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
                ...(dateTo ? { lte: new Date(dateTo) } : {}),
              },
            }
          : {}),
        ...(priceMin || priceMax
          ? {
              price: {
                ...(priceMin ? { gte: parseFloat(priceMin) } : {}),
                ...(priceMax ? { lte: parseFloat(priceMax) } : {}),
              },
            }
          : {}),
      },
      include: {
        driver: {
          select: { id: true, name: true, email: true, phone: true },
        },
        bookings: true,
      },
      orderBy: { date: 'asc' },
    });

    res.json({ rides });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while searching rides' });
  }
};


const updateRide = async (req, res) => {
  const rideId = parseInt(req.params.rideId);
  const user = req.user;
  const { from, to, date, time, price, seats } = req.body;

  try {
    if (isNaN(rideId)) return res.status(400).json({ message: 'Invalid ride ID' });

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.driverId !== user.userId) return res.status(403).json({ message: 'Unauthorized' });

    const updated = await prisma.ride.update({
      where: { id: rideId },
      data: {
        from,
        to,
        date: new Date(date),
        time,
        price: parseFloat(price),
        seats: parseInt(seats),
      },
    });

    res.json({ message: 'Ride updated', ride: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Update failed' });
  }
};




const deleteRide = async (req, res) => {
  const user = req.user;
  const { rideId } = req.params;

  try {
    const ride = await prisma.ride.findUnique({ where: { id: parseInt(rideId) } });

    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.driverId !== user.userId) return res.status(403).json({ message: 'Unauthorized' });

    await prisma.ride.delete({ where: { id: ride.id } });

    res.json({ message: 'Ride deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete ride' });
  }
};



const getRidePassengers = async (req, res) => {
  const { rideId } = req.params;
  const user = req.user;

  try {
    // First, confirm this ride exists and is owned by this driver
    const ride = await prisma.ride.findUnique({
      where: { id: parseInt(rideId) }
    });

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.driverId !== user.userId) {
      return res.status(403).json({ message: 'You do not own this ride' });
    }

    // Get passengers
    const bookings = await prisma.booking.findMany({
      where: { rideId: ride.id },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        }
      }
    });

    const passengers = bookings.map(b => b.user);

    res.json({ passengers });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching passengers' });
  }
};



const getDriverRides = async (req, res) => {
  const user = req.user;

  if (user.role !== 'DRIVER') {
    return res.status(403).json({ message: 'Only drivers can view their rides' });
  }

  try {
    const rides = await prisma.ride.findMany({
      where: { driverId: user.userId },
      orderBy: { date: 'asc' },
      include: {
        bookings: {
          include: {
            user: {
              select: { name: true, email: true, phone: true }
            }
          }
        }
      }
    });


    res.json({ rides });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching rides' });
  }
  console.log('GET /api/rides called')

};




module.exports = { createRide, searchRides, getRidePassengers, getDriverRides, updateRide, deleteRide, getRideById };
