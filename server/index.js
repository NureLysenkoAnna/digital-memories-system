require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const postRoutes = require('./routes/postRoutes');
const groupMemberRoutes = require('./routes/groupMemberRoutes');

const app = express();

// HTTP сервер на базі Express
const server = http.createServer(app);
const FRONTEND_URL = process.env.FRONTEND_URL;

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true // Дозволяє передавати кукі/токени, якщо потрібно
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  // console.log(`Клієнт підключився: ${socket.id}`);
  
  socket.on('disconnect', () => {
    // console.log(`Клієнт відключився: ${socket.id}`);
  });
});

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/groups/:groupId/members', groupMemberRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/posts', postRoutes);

app.get('/', (req, res) => {
  res.send('Сервер системи працює.');
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Сервер запущено на порту ${PORT}`);
});