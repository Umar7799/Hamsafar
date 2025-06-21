const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getIO } = require('../socket');
// POST /conversations
const createConversation = async (req, res) => {
  const { senderId, receiverId, participantIds } = req.body;

  let participants = participantIds;

  if (!participants) {
    if (!senderId || !receiverId) {
      return res.status(400).json({ message: 'senderId and receiverId are required.' });
    }
    if (senderId === receiverId) {
      return res.status(400).json({ message: 'You cannot create a conversation with yourself.' });
    }
    participants = [senderId, receiverId];
  }

  const uniqueIds = [...new Set(participants)];
  if (uniqueIds.length < 2) {
    return res.status(400).json({ message: 'A conversation requires at least 2 unique participants.' });
  }

  const sortedIds = [...uniqueIds].sort();

  try {
    const existingConversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { id: sortedIds[0] }
        }
      },
      include: { participants: true }
    });

    const matchedConversation = existingConversations.find(conv => {
      const convIds = conv.participants.map(p => p.id).sort();
      return convIds.length === sortedIds.length && convIds.every((id, i) => id === sortedIds[i]);
    });

    if (matchedConversation) {
      return res.status(200).json(matchedConversation);
    }

    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          connect: sortedIds.map(id => ({ id }))
        }
      },
      include: {
        participants: true
      }
    });

    res.status(201).json(conversation);
  } catch (err) {
    console.error('🔴 Error creating conversation:', err);
    res.status(500).json({ message: 'Failed to create conversation', error: err.message });
  }
};

// GET /conversations
const getUserConversations = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: No user ID found in request' });
  }

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { id: userId }
        }
      },
      include: {
        participants: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    res.json(conversations);
  } catch (err) {
    console.error('🔴 Error fetching conversations:', err);
    res.status(500).json({ message: 'Failed to fetch conversations', error: err.message });
  }
};

// POST /messages
const sendMessage = async (req, res) => {
    const { conversationId, text } = req.body;
    const senderId = req.user?.id;
  
    if (!senderId) {
      return res.status(401).json({ message: 'Unauthorized: No sender ID' });
    }
  
    if (!conversationId || !text || text.trim() === '') {
      return res.status(400).json({ message: 'conversationId and non-empty text are required' });
    }
  
    try {
      const io = getIO(); // ✅ Socket.IO instance
  
      // ✅ Save message to DB
      const message = await prisma.message.create({
        data: {
          text,
          conversation: { connect: { id: conversationId } },
          sender: { connect: { id: senderId } }
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
  
      // ✅ Emit to users in the conversation room
      io.to(`conversation_${conversationId}`).emit('new_message', message);
  
      // ✅ Notify other participants privately
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { participants: true }
      });
  
      conversation.participants
        .filter(p => p.id !== senderId)
        .forEach(p => {
          io.to(`user_${p.id}`).emit('notification', {
            type: 'message',
            message: `New message from ${message.sender.name}`,
            data: message
          });
        });
  
      return res.status(201).json(message);
    } catch (err) {
      console.error('🔴 Error sending message:', err);
      return res.status(500).json({
        message: 'Failed to send message',
        error: err.message
      });
    }
  };
  
  

// GET /conversations/:id/messages
const getMessages = async (req, res) => {
  const { id } = req.params;

  try {
    const conversationId = parseInt(id);
    if (isNaN(conversationId)) {
      return res.status(400).json({ message: 'Invalid conversation ID' });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(messages);
  } catch (err) {
    console.error('🔴 Error fetching messages:', err);
    res.status(500).json({ message: 'Failed to get messages', error: err.message });
  }
};

module.exports = {
  createConversation,
  getUserConversations,
  sendMessage,
  getMessages
};
