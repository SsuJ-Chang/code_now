import { useState, useEffect } from 'react';
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

    // 接收 initial-state 事件，包含 canEdit 資訊
    newSocket.on('initial-state', (data: { python: string, javascript: string, canEdit: boolean, maxEditors: number, currentEditors: number }) => {
      setPythonCode(data.python);
      setJavascriptCode(data.javascript);
      setCanEdit(data.canEdit);
      if (!data.canEdit) {
        setViewOnlyMessage(`目前已達最大共筆人數 (${data.maxEditors} 人)。您目前只有觀看權限。`);
      } else {
        setViewOnlyMessage('');
      }
    });

    newSocket.on('code-update', (data: { language: string, code: string }) => {
      if (data.language === 'python') {
        setPythonCode(data.code);
      } else {
        setJavascriptCode(data.code);
      }
    });

    newSocket.on('language-change', (lang: string) => {
      setLanguage(lang);
    });

    // 處理編輯者數量更新事件
    newSocket.on('editor-count-update', (data: { currentEditors: number, maxEditors: number }) => {
      if (data.currentEditors < data.maxEditors && !canEdit) {
        // 如果編輯者數量減少且當前用戶之前沒有編輯權限，則嘗試重新獲得編輯權限
        setCanEdit(true);
        setViewOnlyMessage('現在有編輯權限了！');
        console.log('Editor slot available, you can now edit.');
      } else if (data.currentEditors >= data.maxEditors && canEdit) {
        // 如果編輯者數量達到上限且當前用戶有編輯權限，則變為觀看模式
        setCanEdit(false);
        setViewOnlyMessage(`目前已達最大共筆人數 (${data.maxEditors} 人)。您目前只有觀看權限。`);
        console.log('Max editors reached, switching to view-only mode.');
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [canEdit]); // 監聽 canEdit 變化，以便在 editor-count-update 中正確判斷

  const handleLanguageChange = (lang: string) => {
    if (!canEdit) return; // 如果沒有編輯權限，不允許切換語言
    setLanguage(lang);
    if (socket) {
      socket.emit('language-change', lang);
    }
  };

  const handleCodeChange = (code: string) => {
    if (!canEdit) return; // 如果沒有編輯權限，不允許修改程式碼
    if (language === 'python') {
      setPythonCode(code);
    } else {
      setJavascriptCode(code);
    }
    if (socket) {
      socket.emit('code-update', { language, code });
    }
  };

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
          canEdit={canEdit} // 傳遞 canEdit 屬性
        />
      </main>
    </div>
  );
}

export default App;
