// frontend/src/components/coding/CodeEditor.jsx
import { useState } from 'react';
import Editor from '@monaco-editor/react';

export default function CodeEditor({ onRunCode }) {
  const [code, setCode] = useState('print("Hello World!")');
  const [language, setLanguage] = useState(71); // Python3
  const [isRunning, setIsRunning] = useState(false);

  const handleRunCode = async () => {
    setIsRunning(true);
    await onRunCode(code, language);
    setIsRunning(false);
  };

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8 }}>
      <div style={{ padding: 10, borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between' }}>
        <select 
          value={language} 
          onChange={(e) => setLanguage(Number(e.target.value))}
          style={{ padding: 5 }}
        >
          <option value={71}>Python 3</option>
          <option value={62}>Java</option>
          <option value={63}>JavaScript</option>
          <option value={54}>C++</option>
        </select>
        
        <button 
          onClick={handleRunCode}
          disabled={isRunning}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: 4,
            cursor: isRunning ? 'not-allowed' : 'pointer'
          }}
        >
          {isRunning ? 'Running...' : 'Run Code'}
        </button>
      </div>
      
      <Editor
        height="400px"
        defaultLanguage="python"
        value={code}
        onChange={(value) => setCode(value || '')}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: 'on'
        }}
      />
    </div>
  );
}