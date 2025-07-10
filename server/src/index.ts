console.log(`Server Code Version: ${Math.random().toString(36).substring(2, 8)}`); // Unique identifier

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
let currentLanguage = 'javascript'; // 追蹤當前語言

// 儲存所有連線的 Socket ID，用於計算當前編輯者數量
const connectedEditors = new Set<string>();
const MAX_EDITORS = parseInt(process.env.MAX_EDITORS || '2', 10); // 確保這裡的預設值與 docker-compose.yml 都一致
console.log(`Server initialized with MAX_EDITORS: ${MAX_EDITORS}`); // 新增日誌

io.on('connection', (socket) => {
  console.log('a user connected');

  let canEdit = true;
  if (connectedEditors.size >= MAX_EDITORS) {
    canEdit = false;
    console.log(`User ${socket.id} connected as viewer (max editors reached). Current editors: ${connectedEditors.size}/${MAX_EDITORS}`);
  } else {
    connectedEditors.add(socket.id);
    console.log(`User ${socket.id} connected as editor. Current editors: ${connectedEditors.size}/${MAX_EDITORS}`);
  }

  console.log(`Emitting initial-state for ${socket.id}: canEdit=${canEdit}`);
  socket.emit('initial-state', {
    python: pythonCode,
    javascript: javascriptCode,
    language: currentLanguage, // 傳送當前語言
    canEdit: canEdit,
    maxEditors: MAX_EDITORS,
    currentEditors: connectedEditors.size
  });

  console.log(`Current connections: ${io.engine.clientsCount}, Editable connections: ${connectedEditors.size}/${MAX_EDITORS}`); // 新增日誌

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
    currentLanguage = lang; // 更新當前語言
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
    if (canEdit) {
      connectedEditors.delete(socket.id);
      console.log(`Editor ${socket.id} disconnected. Current editors: ${connectedEditors.size}/${MAX_EDITORS}`);
      io.emit('editor-count-update', { currentEditors: connectedEditors.size, maxEditors: MAX_EDITORS });
    }
    else {
      console.log(`Viewer ${socket.id} disconnected.`);
    }
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