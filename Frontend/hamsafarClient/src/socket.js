// src/socket.js
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  withCredentials: true,
  transports: ['websocket'],
});

// ✅ Add these logs to confirm socket connection
socket.on('connect', () => {
  console.log('✅ Socket connected with id:', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('❌ Socket connection error:', err);
});

export default socket;
