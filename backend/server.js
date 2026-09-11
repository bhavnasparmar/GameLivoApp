const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const mongoose = require('mongoose');
require('dotenv').config();

const swaggerSpec = require('./config/swagger');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  },
});

const PORT = process.env.PORT || 5000;

// ─── Optional Database Connection ────────────────────────────────────────────
if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('🍃 MongoDB Connected successfully'))
    .catch(err => console.warn('⚠️ MongoDB connection error (using in-memory):', err.message));
}

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Standard API Response Formatter
const responseWrapper = (req, res, next) => {
  res.success = (data = {}, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  };

  res.error = (message = 'Error', statusCode = 400, data = null) => {
    return res.status(statusCode).json({
      success: false,
      message,
      data,
    });
  };

  next();
};

app.use(responseWrapper);

// ─── Swagger Documentation UI ────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'GameLivo API Docs',
  customCss: '.swagger-ui .topbar { background-color: #0F3628; }',
}));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/auth', require('./routes/auth.routes'));
app.use('/user', require('./routes/user.routes'));
app.use('/friends', require('./routes/friends.routes'));
app.use('/games', require('./routes/games.routes'));
app.use('/lobby', require('./routes/lobby.routes'));
app.use('/match', require('./routes/match.routes'));
app.use('/rewards', require('./routes/rewards.routes'));
app.use('/notifications', require('./routes/notifications.routes'));
app.use('/leaderboard', require('./routes/leaderboard.routes'));
app.use('/support', require('./routes/support.routes'));

// Health check
app.get('/health', (req, res) => {
  res.success({ status: 'UP', swagger: '/api-docs', timestamp: new Date() }, 'GameLivo API is running healthy');
});

// ─── Socket.IO Real-time Gameplay ────────────────────────────────────────────
io.on('connection', socket => {
  console.log('⚡ Player connected:', socket.id);

  socket.on('lobby:join', ({ lobbyId, player }) => {
    socket.join(lobbyId);
    io.to(lobbyId).emit('lobby:player_joined', { player });
  });

  socket.on('lobby:leave', ({ lobbyId, playerId }) => {
    socket.leave(lobbyId);
    io.to(lobbyId).emit('lobby:player_left', { playerId });
  });

  socket.on('game:roll_dice', ({ matchId, playerId, diceValue }) => {
    io.to(matchId).emit('game:dice_rolled', { playerId, diceValue });
  });

  socket.on('game:move_token', ({ matchId, playerId, tokenId, steps, newPosition }) => {
    io.to(matchId).emit('game:token_moved', { playerId, tokenId, steps, newPosition });
  });

  socket.on('game:chat_message', ({ matchId, sender, message }) => {
    io.to(matchId).emit('game:new_chat', { sender, message, timestamp: new Date() });
  });

  socket.on('disconnect', () => {
    console.log('❌ Player disconnected:', socket.id);
  });
});

// ─── 404 & Error Handling ────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

server.listen(PORT, () => {
  console.log(`🚀 GameLivo API Server running on http://localhost:${PORT}`);
  console.log(`📖 Swagger API Docs available at http://localhost:${PORT}/api-docs`);
});

module.exports = { app, server, io };
