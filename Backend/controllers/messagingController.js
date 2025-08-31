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

    // Now, add unreadCount for each conversation
    const enriched = await Promise.all(conversations.map(async convo => {
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: convo.id,
          senderId: { not: userId },
          reads: {
            none: {
              readerId: userId
            }
          }
        }
      });

      return {
        ...convo,
        unreadCount
      };
    }));

    res.json(enriched);
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

// GET /conversations/unread-count
const getUnreadMessageCount = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Find messages the user hasn't read yet
    const unreadCount = await prisma.message.count({
      where: {
        conversation: {
          participants: {
            some: { id: userId }
          }
        },
        senderId: { not: userId },
        reads: {
          none: {
            readerId: userId
          }
        }
      }
    });

    res.json({ unreadCount });
  } catch (err) {
    console.error('🔴 Error fetching unread count:', err);
    res.status(500).json({ message: 'Failed to fetch unread count', error: err.message });
  }
};


// POST /conversations/:id/mark-as-read
const markConversationAsRead = async (req, res) => {
  const conversationId = parseInt(req.params.id, 10);
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (isNaN(conversationId)) {
    return res.status(400).json({ message: 'Invalid conversation ID' });
  }

  try {
    // Mark unread messages in this conversation as read by this user
    // Assuming you have a 'reads' relation tracking which users have read which messages

    // Find all unread messages for this user in the conversation
    const unreadMessages = await prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: userId },  // messages not sent by the user
        reads: {
          none: {
            readerId: userId
          }
        }
      },
      select: { id: true }
    });

    // Create reads entries for each unread message
    const readEntries = unreadMessages.map(msg => ({
      messageId: msg.id,
      readerId: userId,
      readAt: new Date()
    }));

    if (readEntries.length > 0) {
      await prisma.messageRead.createMany({
        data: readEntries,
        skipDuplicates: true,
      });
      
    }

    // Optionally emit an event via socket.io that messages have been read
    const io = getIO();
    io.to(`conversation_${conversationId}`).emit('messages_read', {
      conversationId,
      readerId: userId,
      messageIds: unreadMessages.map(m => m.id)
    });

    res.json({ success: true, markedReadCount: readEntries.length });
  } catch (err) {
    console.error('🔴 Error marking conversation as read:', err);
    res.status(500).json({ message: 'Failed to mark conversation as read', error: err.message });
  }
};

module.exports = {
  createConversation,
  getUserConversations,
  sendMessage,
  getMessages,
  getUnreadMessageCount,
  markConversationAsRead,
};
