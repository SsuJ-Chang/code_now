import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"]
  }
});

let pythonCode = process.env.DEFAULT_PYTHON_CODE || '# Start typing Python code...';
let javascriptCode = process.env.DEFAULT_JAVASCRIPT_CODE || '// Start typing JavaScript code...';

// 儲存所有連線的 Socket ID，用於計算當前編輯者數量
const connectedEditors = new Set<string>();
const MAX_EDITORS = parseInt(process.env.MAX_EDITORS || '2', 10);

io.on('connection', (socket) => {
  console.log('a user connected');

  let canEdit = true;
  if (connectedEditors.size >= MAX_EDITORS) {
    canEdit = false;
    console.log(`User ${socket.id} connected as viewer (max editors reached).`);
  } else {
    connectedEditors.add(socket.id);
    console.log(`User ${socket.id} connected as editor. Current editors: ${connectedEditors.size}`);
  }

  // Send the current code and editing permission to the new user
  socket.emit('initial-state', {
    python: pythonCode,
    javascript: javascriptCode,
    canEdit: canEdit,
    maxEditors: MAX_EDITORS,
    currentEditors: connectedEditors.size
  });

  socket.on('code-update', (data: { language: string, code: string }) => {
    if (!canEdit) {
      console.log(`Viewer ${socket.id} attempted to update code.`);
      return; // 沒有編輯權限，直接返回
    }
    if (data.language === 'python') {
      pythonCode = data.code;
    } else {
      javascriptCode = data.code;
    }
    // Broadcast the new code to all other clients
    socket.broadcast.emit('code-update', data);
  });

  socket.on('language-change', (lang: string) => {
    if (!canEdit) {
      console.log(`Viewer ${socket.id} attempted to change language.`);
      return; // 沒有編輯權限，直接返回
    }
    // Broadcast the language change to all clients
    io.emit('language-change', lang);
  });

  // Handle cursor and selection updates
  socket.on('cursor-selection-update', (data: { ranges: { from: number, to: number }[] }) => {
    if (!canEdit) {
      // console.log(`Viewer ${socket.id} attempted to update cursor/selection.`); // 游標更新可以允許，但如果嚴格限制，則取消註釋
      return;
    }
    const color = '#FFFFFF'; // Default color for cursor
    // Broadcast cursor and selection to all other clients, including the color
    socket.broadcast.emit('cursor-selection-update', { userId: socket.id, color, ...data });
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    if (canEdit) { // 只有編輯者斷開時才從集合中移除
      connectedEditors.delete(socket.id);
      console.log(`Editor ${socket.id} disconnected. Current editors: ${connectedEditors.size}`);
      // 通知所有客戶端當前編輯者數量可能已減少
      io.emit('editor-count-update', { currentEditors: connectedEditors.size, maxEditors: MAX_EDITORS });
    }
    // Broadcast that a user disconnected so their cursor/selection can be removed
    socket.broadcast.emit('user-disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

app.get('/', (req, res) => {
  res.send('Code Now Server is running!');
});