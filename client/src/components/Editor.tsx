
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { okaidia } from '@uiw/codemirror-theme-okaidia';

type Props = {
  language: string;
  code: string;
  onCodeChange: (code: string) => void;
};

const Editor: React.FC<Props> = ({ language, code, onCodeChange }) => {
  const extensions = language === 'javascript' ? [javascript({ jsx: true })] : [python()];

  return (
    <CodeMirror
      value={code}
      height="calc(100vh - 70px)" // Adjust height to fill screen below header
      theme={okaidia}
      extensions={extensions}
      onChange={(value) => onCodeChange(value)}
      className="text-lg"
    />
  );
};

export default Editor;
