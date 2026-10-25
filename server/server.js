require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db');
const pollRoutes = require('./routes/polls');
const Poll = require('./models/Poll');

// Connect to MongoDB
connectDB();

const app = express();
const httpServer = http.createServer(app);

const isProduction = process.env.NODE_ENV === 'production';

// Socket.io with CORS
const io = new Server(httpServer, {
  cors: {
    origin: isProduction ? false : ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({ origin: isProduction ? false : ['http://localhost:5173', 'http://localhost:3000'] }));
app.use(express.json());

// REST Routes
app.use('/api/polls', pollRoutes);

// Serve React production build
if (isProduction) {
  const buildPath = path.join(__dirname, '../client/build');
  app.use(express.static(buildPath));

  // Catch-all: serve index.html for any non-API route (SPA support)
  app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});
} else {
  // Dev health check
  app.get('/', (req, res) => {
    res.json({ status: 'LivePoll server is running 🚀' });
  });
}

// Socket.io events
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join a poll room
  socket.on('joinPoll', (pollId) => {
    socket.join(pollId);
    console.log(`Socket ${socket.id} joined room: ${pollId}`);
  });

  // Handle vote submission via socket
  socket.on('submitVote', async ({ pollId, optionIndex }) => {
    try {
      const poll = await Poll.findById(pollId);
      if (!poll) return;

      if (optionIndex < 0 || optionIndex >= poll.options.length) return;

      poll.options[optionIndex].votes += 1;
      poll.totalVotes += 1;
      await poll.save();

      // Broadcast updated poll to all clients in the room
      io.to(pollId).emit('pollUpdated', poll);
    } catch (err) {
      console.error('Vote error:', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 LivePoll server running on http://localhost:${PORT}`);
});