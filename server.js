const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, '../public')));

// Explicit root route to send index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Socket.IO signaling logic
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle call initiation
  socket.on('call-user', ({ to, signal }) => {
    console.log(`Calling user: ${to}`);
    io.to(to).emit('incoming-call', { from: socket.id, signal });
  });

  // Handle call acceptance
  socket.on('answer-call', ({ to, signal }) => {
    console.log(`Answering call from: ${to}`);
    io.to(to).emit('call-answered', { signal });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
