// Simple HTTP + WebSocket server for the mobile controller.
// It serves the controller UI and forwards control events
// (move/look and their hold variants) to all connected clients.
// It also relays minimap images from the game to the controller.
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
// Allow web clients on the local network to connect
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Serve the controller web page and assets from /public
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', socket => {
  // A new device (game or controller) has connected
  console.log('controller connected', socket.id);

  // One-step movement (sent on tap or click)
  socket.on('move', dir => {
    console.log('[server] move', dir);
    io.emit('move', dir); // broadcast to all clients
  });

  // One-step look left/right (sent on tap or click)
  socket.on('look', dir => {
    console.log('[server] look', dir);
    io.emit('look', dir);
  });

  // Hold start/stop events for smooth movement/rotation while pressed
  socket.on('move_start', dir => {
    console.log('[server] move_start', dir);
    io.emit('move_start', dir);
  });
  socket.on('move_stop', dir => {
    console.log('[server] move_stop', dir);
    io.emit('move_stop', dir);
  });
  socket.on('look_start', dir => {
    console.log('[server] look_start', dir);
    io.emit('look_start', dir);
  });
  socket.on('look_stop', dir => {
    console.log('[server] look_stop', dir);
    io.emit('look_stop', dir);
  });

  // Receive a minimap image (Data URL) from the game and push it to everyone.
  socket.on('minimap_frame', dataUrl => {
    // Broadcast latest minimap image to all clients
    io.emit('minimap_frame', dataUrl);
  });

  // Client disconnected
  socket.on('disconnect', () => console.log('controller disconnected', socket.id));
});

// Start the server on port 4000
server.listen(4000, () => console.log('controller at http://localhost:4000'));
