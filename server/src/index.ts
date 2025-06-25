import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for simplicity
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

  socket.on('language-change', (language: string) => {
    // Broadcast the language change to all clients
    io.emit('language-change', language);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
