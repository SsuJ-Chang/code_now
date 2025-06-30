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

    newSocket.on('initial-code', (data: { python: string, javascript: string }) => {
      setPythonCode(data.python);
      setJavascriptCode(data.javascript);
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

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    if (socket) {
      socket.emit('language-change', lang);
    }
  };

  const handleCodeChange = (code: string) => {
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
        <Editor 
          language={language} 
          code={currentCode} 
          onCodeChange={handleCodeChange} 
        />
      </main>
    </div>
  );
}

export default App;
