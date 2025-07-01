

type Props = {
  language: string;
  setLanguage: (language: string) => void;
  isConnected: boolean;
};

const Header: React.FC<Props> = ({ language, setLanguage, isConnected }) => {
  return (
    <header className="bg-gray-800 p-4 flex justify-between items-center shadow-md">
      <div className="flex items-center">
        <span className="font-bold text-xl text-cyan-400">CODE NOW</span>
      </div>
      <div className="flex items-center text-sm">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-gray-700 text-white rounded px-3 py-1 mx-4 focus:outline-none focus:ring-2 focus:ring-cyan-400 hover:bg-gray-600 appearance-none"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
        </select>
        <div className="flex items-center">
          <span
            className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            title={isConnected ? 'Connected' : 'Disconnected'}
          ></span>
        </div>
      </div>
    </header>
  );
};

export default Header;
