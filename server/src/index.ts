import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*", // Allow all origins for simplicity, or specify in production
    methods: ["GET", "POST"]
  }
});

let pythonCode = '# Start typing Python code...';
let javascriptCode = '// Start typing JavaScript code...';

io.on('connection', (socket) => {
  console.log('a user connected');

  // Send the current code to the new user
  socket.emit('initial-code', { python: pythonCode, javascript: javascriptCode });

  socket.on('code-update', (data: { language: string, code: string }) => {
    if (data.language === 'python') {
      pythonCode = data.code;
    } else {
      javascriptCode = data.code;
    }
    // Broadcast the new code to all other clients
    socket.broadcast.emit('code-update', data);
  });

  socket.on('language-change', (lang: string) => {
    // Broadcast the language change to all clients
    io.emit('language-change', lang);
  });

  // Handle cursor and selection updates
  socket.on('cursor-selection-update', (data: { ranges: { from: number, to: number }[] }) => {
    const color = '#FFFFFF'; // Default color for cursor
    // Broadcast cursor and selection to all other clients, including the color
    socket.broadcast.emit('cursor-selection-update', { userId: socket.id, color, ...data });
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    // Broadcast that a user disconnected so their cursor/selection can be removed
    socket.broadcast.emit('user-disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});