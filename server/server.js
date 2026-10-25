
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const connectDB = require('./db');
const pollRoutes = require('./routes/polls');
const Poll = require('./models/Poll');

const app = express();
const httpServer = http.createServer(app);

// Connect to MongoDB
connectDB();

// Normalize URLs by removing spaces and trailing slashes
const normalizeOrigin = (url) => url.trim().replace(/\/+$/, '');

// Allowed frontend URLs
const allowedOrigins = [
  'https://realtime-poll-cast.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(normalizeOrigin)
    : []),
].filter(Boolean);

console.log('Allowed frontend origins:', allowedOrigins);

// CORS configuration for REST API
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
      return callback(null, true);
    }

    console.error('CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'LivePoll server is running 🚀' });
});

// REST API routes
app.use('/api/polls', pollRoutes);

// Socket.IO configuration
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
        return callback(null, true);
      }

      console.error('Socket.IO CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
  },
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join a poll room
  socket.on('joinPoll', (pollId) => {
    if (pollId) {
      socket.join(String(pollId));
      console.log(`Socket ${socket.id} joined room: ${pollId}`);
    }
  });

  // Submit a vote
  socket.on('submitVote', async ({ pollId, optionIndex } = {}) => {
    try {
      if (
        !pollId ||
        !Number.isInteger(optionIndex) ||
        optionIndex < 0
      ) {
        return;
      }

      const poll = await Poll.findById(pollId);

      if (!poll || optionIndex >= poll.options.length) {
        return;
      }

      poll.options[optionIndex].votes += 1;
      poll.totalVotes += 1;

      await poll.save();

      // Broadcast updated poll to clients in this poll room
      io.to(String(pollId)).emit('pollUpdated', poll);
    } catch (err) {
      console.error('Vote error:', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`LivePoll server is running on port ${PORT}`);
});
