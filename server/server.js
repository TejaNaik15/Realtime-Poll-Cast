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


app.use('/api/polls', pollRoutes);


if (isProduction) {
  const buildPath = path.join(__dirname, '../client/dist');
  app.use(express.static(buildPath));


  app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});
} else {
  
  app.get('/', (req, res) => {
    res.json({ status: 'LivePoll server is running 🚀' });
  });
}


io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);


  socket.on('joinPoll', (pollId) => {
    socket.join(pollId);
    console.log(`Socket ${socket.id} joined room: ${pollId}`);
  });


  socket.on('submitVote', async ({ pollId, optionIndex }) => {
    try {
      const poll = await Poll.findById(pollId);
      if (!poll) return;

      if (optionIndex < 0 || optionIndex >= poll.options.length) return;

      poll.options[optionIndex].votes += 1;
      poll.totalVotes += 1;
      await poll.save();

      
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
