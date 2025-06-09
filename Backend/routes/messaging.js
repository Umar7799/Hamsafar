const express = require('express');
const router = express.Router();
const {
  createConversation,
  getUserConversations,
  sendMessage,
  getMessages
} = require('../controllers/messagingController');

// ✅ Consistent name
const authenticateToken = require('../middleware/authMiddleware');

// 🔐 Protect all messaging routes
router.use(authenticateToken);

router.post('/', createConversation);
router.get('/', getUserConversations);
router.post('/messages', sendMessage);
router.get('/:id/messages', getMessages);

module.exports = router;
