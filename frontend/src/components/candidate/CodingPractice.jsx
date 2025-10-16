import CodeEditor from '../coding/CodeEditor';
import { codingService } from '../../services/codingService';
import { useState } from 'react';

export default function CodingPractice() {
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRunCode = async (sourceCode, languageId) => {
    try {
      setIsLoading(true);
      setOutput('Executing code...');
      
      // Submit code
      const submitResponse = await codingService.submitCode(sourceCode, languageId);
      
      if (!submitResponse.token) {
        setOutput('Error: Failed to submit code');
        return;
      }

      // Poll for results
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        const results = await codingService.getSubmissionResults(submitResponse.token);
        
        if (results.status && results.status.id > 2) { // Status > 2 means completed
          const output = results.stdout || results.stderr || results.compile_output || 'No output';
          setOutput(`Status: ${results.status.description}\nOutput:\n${output}`);
          break;
        }
        
        attempts++;
      }
      
      if (attempts === maxAttempts) {
        setOutput('Timeout: Code execution took too long');
      }
      
    } catch (error) {
      setOutput('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2>Coding Practice Arena</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <h3>Code Editor</h3>
          <CodeEditor onRunCode={handleRunCode} />
        </div>
        
        <div>
          <h3>Output</h3>
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: 8, 
            padding: 15, 
            minHeight: 400, 
            backgroundColor: '#f8f9fa',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap'
          }}>
            {isLoading ? 'Executing...' : output || 'Run your code to see output here'}
          </div>
        </div>
      </div>
    </div>
  );
}