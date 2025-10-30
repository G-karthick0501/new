import { useLocation, useNavigate } from 'react-router-dom';
import InterviewResults from '../components/interview/InterviewResults';

export default function InterviewResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const results = location.state?.results;

  const handleRestart = () => {
    navigate('/candidate-dashboard');
  };

  if (!results) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <h2>No interview results found</h2>
        <button 
          onClick={() => navigate('/candidate-dashboard')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <InterviewResults 
        results={results}
        onRestart={handleRestart}
      />
    </div>
  );
}
