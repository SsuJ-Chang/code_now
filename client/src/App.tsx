import { useState, useEffect, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import Header from './components/Header';
import Editor from './components/Editor';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [language, setLanguage] = useState('javascript');
  const [pythonCode, setPythonCode] = useState('');
  const [javascriptCode, setJavascriptCode] = useState('');
  const [canEdit, setCanEdit] = useState(true); // 新增 canEdit 狀態
  const [viewOnlyMessage, setViewOnlyMessage] = useState(''); // 新增提示訊息狀態

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    newSocket.on('initial-state', (data: { python: string, javascript: string, language: string, canEdit: boolean, maxEditors: number, currentEditors: number }) => {
      setPythonCode(data.python);
      setJavascriptCode(data.javascript);
      setLanguage(data.language); // 設定初始語言
      setCanEdit(data.canEdit);
      if (!data.canEdit) {
        setViewOnlyMessage(`目前已達最大共筆人數 (${data.maxEditors} 人)。您目前只有觀看權限。`);
      } else {
        setViewOnlyMessage('');
      }
    });

    

    newSocket.on('language-change', (lang: string) => {
      setLanguage(lang);
    });

    newSocket.on('editor-count-update', (data: { currentEditors: number, maxEditors: number }) => {
      if (data.currentEditors < data.maxEditors && !canEdit) {
        setCanEdit(true);
        setViewOnlyMessage('現在有編輯權限了！');
        console.log('Editor slot available, you can now edit.');
      } else if (data.currentEditors >= data.maxEditors && canEdit) {
        setCanEdit(false);
        setViewOnlyMessage(`目前已達最大共筆人數 (${data.maxEditors} 人)。您目前只有觀看權限。`);
        console.log('Max editors reached, switching to view-only mode.');
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, []); // 空依賴項陣列確保 effect 只在掛載時執行一次

  const handleLanguageChange = useCallback((lang: string) => {
    if (!canEdit) return;
    setLanguage(lang);
    if (socket) {
      socket.emit('language-change', lang);
    }
  }, [socket, canEdit]);

  const handleCodeChange = useCallback((code: string) => {
    if (!canEdit) return;
    if (socket) {
      socket.emit('code-update', { language, code });
    }
  }, [socket, canEdit, language]);

  const currentCode = language === 'python' ? pythonCode : javascriptCode;

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col">
      <Header 
        language={language}
        setLanguage={handleLanguageChange}
        isConnected={isConnected}
      />
      <main className="flex-grow">
        {viewOnlyMessage && (
          <div className="bg-yellow-600 text-white p-2 text-center text-sm">
            {viewOnlyMessage}
          </div>
        )}
        <Editor 
          language={language}
          code={currentCode}
          onCodeChange={handleCodeChange}
          socket={socket}
          canEdit={canEdit}
        />
      </main>
    </div>
  );
}

export default App;
