const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a new booking
const createBooking = async (req, res) => {
  const user = req.user;
  const { rideId } = req.body;

  if (user.role !== 'PASSENGER') {
    return res.status(403).json({ message: 'Only passengers can book rides' });
  }

  try {
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: { bookings: true, driver: true },
    });

    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.bookings.length >= ride.seats) {
      return res.status(400).json({ message: 'No available seats' });
    }

    const existing = await prisma.booking.findFirst({
      where: { rideId, userId: user.userId },
    });

    if (existing) {
      return res.status(400).json({ message: 'You already booked this ride' });
    }

    const booking = await prisma.booking.create({
      data: {
        rideId,
        userId: user.userId,
      },
    });

    res.status(201).json({ message: 'Booking successful', booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Booking failed' });
  }
};

// Get bookings for current passenger
const getMyBookings = async (req, res) => {
  const user = req.user;

  if (user.role !== 'PASSENGER') {
    return res.status(403).json({ message: 'Only passengers can view bookings' });
  }

  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: user.userId },
      include: {
        ride: {
          include: {
            driver: {
              select: {
                id: true, 
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not retrieve bookings' });
  }
};

// Cancel a booking
// Cancel a booking (by passenger or ride's driver)
const cancelBooking = async (req, res) => {
  const user = req.user;
  const { bookingId } = req.params;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId) },
      include: {
        ride: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Allow only the passenger who booked OR the driver of the ride to cancel
    const isPassenger = booking.userId === user.userId;
    const isDriver = booking.ride.driverId === user.userId;

    if (!isPassenger && !isDriver) {
      return res.status(403).json({ message: 'Unauthorized to cancel this booking' });
    }

    await prisma.booking.delete({ where: { id: booking.id } });

    res.json({ message: 'Booking cancelled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to cancel booking' });
  }
};


// Accept a booking
const acceptBooking = async (req, res) => {
  const { id } = req.params;

  try {
    const booking = await prisma.booking.update({
      where: { id: parseInt(id) },
      data: { status: 'ACCEPTED' },
      include: { user: true, ride: true },
    });

    res.json({ booking });
  } catch (err) {
    console.error('Accept Booking Error:', err);
    res.status(500).json({ message: 'Failed to accept booking' });
  }
};

// Reject a booking
const rejectBooking = async (req, res) => {
  const { id } = req.params;

  try {
    const booking = await prisma.booking.update({
      where: { id: parseInt(id) },
      data: { status: 'REJECTED' },
      include: { user: true, ride: true },
    });

    res.json({ booking });
  } catch (err) {
    console.error('Reject Booking Error:', err);
    res.status(500).json({ message: 'Failed to reject booking' });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  cancelBooking,
  acceptBooking,
  rejectBooking,
};
