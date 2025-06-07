// routes/ratings.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/authMiddleware');
const router = express.Router();

const prisma = new PrismaClient(); // ✅ Make sure PrismaClient is instantiated

// POST /api/ratings
router.post('/', authenticateToken, async (req, res) => {
    const { rideId, toUserId, score, comment } = req.body;
    const fromUserId = req.user.id;

    const parsedScore = Number(score);
    if (isNaN(parsedScore) || parsedScore < 1 || parsedScore > 5) {
        return res.status(400).json({ message: 'Score must be between 1 and 5' });
    }

    try {
        const rating = await prisma.rating.create({
            data: {
                rideId,
                fromUserId,
                toUserId,
                score: parsedScore, // ✅ use parsedScore here
                comment,
            },
        });

        res.status(201).json({ rating });
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(400).json({ message: 'You already rated this user for this ride' });
        }
        console.error(err);
        res.status(500).json({ message: 'Failed to create rating' });
    }
});

// GET /api/ratings/user/:userId
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;
  
    try {
      const ratings = await prisma.rating.findMany({
        where: { toUserId: Number(userId) },
        include: {
          fromUser: {
            select: { name: true },
          },
          ride: {
            select: { from: true, to: true, date: true },
          },
        },
      });
  
      res.json({ ratings });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to fetch ratings' });
    }
  });
  

module.exports = router;
