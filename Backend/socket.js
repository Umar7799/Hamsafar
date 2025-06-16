// socket.js
let io;

module.exports = {
  init: (server) => {
    const { Server } = require('socket.io');
    io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || '*',
        methods: ['GET', 'POST']
      }
    });

    io.on('connection', (socket) => {
      console.log(`🟢 Client connected: ${socket.id}`);

      socket.on('join_conversation', (conversationId) => {
        socket.join(`conversation_${conversationId}`);
        console.log(`👥 ${socket.id} joined conversation ${conversationId}`);
      });

      socket.on('join_user_room', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`🔔 ${socket.id} joined user room ${userId}`);
      });

      socket.on('typing', ({ conversationId, userId }) => {
        socket.to(`conversation_${conversationId}`).emit('typing', { userId });
      });

      socket.on('stop_typing', ({ conversationId, userId }) => {
        socket.to(`conversation_${conversationId}`).emit('stop_typing', { userId });
      });

      socket.on('mark_as_read', async ({ messageId, userId }) => {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        try {
          const existing = await prisma.messageRead.findUnique({
            where: {
              messageId_readerId: { messageId, readerId: userId }
            }
          });

          if (!existing) {
            const read = await prisma.messageRead.create({
              data: { messageId, readerId: userId }
            });

            const message = await prisma.message.findUnique({ where: { id: messageId } });

            if (message?.conversationId) {
              io.to(`conversation_${message.conversationId}`).emit('message_read', {
                messageId,
                userId,
                readAt: read.readAt
              });
            }
          }
        } catch (err) {
          console.error('🔴 Error in mark_as_read:', err);
        } finally {
          await prisma.$disconnect();
        }
      });

      socket.on('disconnect', () => {
        console.log(`🔴 Client disconnected: ${socket.id}`);
      });
    });

    return io;
  },

  getIO: () => {
    if (!io) throw new Error("Socket.io not initialized");
    return io;
  }
};
