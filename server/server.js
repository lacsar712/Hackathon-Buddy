const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/match', require('./routes/match'));
app.use('/api/github', require('./routes/github'));
app.use('/api/hackathons', require('./routes/hackathon'))

// Health check
app.get('/', (req, res) => res.json({ message: 'Hackathon Buddy API running 🚀' }));

// Initialize Editor Socket
require('./sockets/editorSocket')(io);

const Message = require('./models/Message');

// --- Socket.io Real-time Chat ---
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Join a project chat room
  socket.on('join_room', async (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room: ${roomId}`);

    try {
      // Fetch existing messages from DB
      const history = await Message.find({ roomId }).sort({ timestamp: 1 }).limit(100);
      socket.emit('room_history', history);
    } catch (err) {
      console.error('Error fetching chat history:', err);
    }
  });

  // Handle sending a message
  socket.on('send_message', async (data) => {
    const { roomId, message, sender } = data;
    
    try {
      const newMessage = new Message({
        roomId,
        sender,
        message,
        timestamp: new Date()
      });

      await newMessage.save();

      // Broadcast to all in room
      io.to(roomId).emit('receive_message', newMessage);
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error:', err));
