// frontend/src/components/interview/InterviewResults.jsx - MINIMAL CHANGES
export default function InterviewResults({ results, onRestart }) {
  if (!results) return null;

  const { 
    score, 
    feedback, 
    questionsAnswered, 
    totalQuestions,
    detailedAnalysis = [],
    hasAiAnalysis = false 
  } = results;

  const getScoreColor = (score) => {
    if (score >= 80) return '#28a745';
    if (score >= 60) return '#ffc107'; 
    return '#dc3545';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };

  return (
    <div style={{ 
      maxWidth: 600, 
      margin: '0 auto', 
      padding: 20,
      textAlign: 'center' 
    }}>
      <h2>Interview Complete! 🎉</h2>
      
      {/* Score Display */}
      <div style={{ 
        padding: 30,
        border: '2px solid #e9ecef',
        borderRadius: 10,
        marginBottom: 30,
        backgroundColor: '#f8f9fa' 
      }}>
        <div style={{ 
          fontSize: 48,
          fontWeight: 'bold',
          color: getScoreColor(score),
          marginBottom: 10 
        }}>
          {Math.round(score)}%
        </div>
        
        <div style={{ 
          fontSize: 18,
          color: getScoreColor(score),
          fontWeight: 'bold',
          marginBottom: 15 
        }}>
          {getScoreLabel(score)}
        </div>
        
        <div style={{ fontSize: 14, color: '#666' }}>
          You answered {questionsAnswered} out of {totalQuestions} questions
        </div>

        {/* ✅ ADD: AI Analysis Indicator */}
        {hasAiAnalysis && (
          <div style={{ 
            marginTop: 15,
            padding: 8,
            backgroundColor: '#d4edda',
            borderRadius: 4,
            color: '#155724',
            fontSize: 12
          }}>
            🤖 <strong>AI Analysis Complete!</strong>
          </div>
        )}
      </div>

      {/* Feedback */}
      <div style={{ 
        textAlign: 'left',
        marginBottom: 30 
      }}>
        <h3>Feedback & Suggestions:</h3>
        <ul style={{ lineHeight: 1.6 }}>
          {feedback && feedback.map((item, index) => (
            <li key={index} style={{ marginBottom: 10 }}>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* ✅ ADD: AI Analysis Details */}
      {hasAiAnalysis && detailedAnalysis && detailedAnalysis.length > 0 && (
        <div style={{ 
          textAlign: 'left',
          marginBottom: 30,
          border: '1px solid #ddd',
          borderRadius: 8,
          padding: 20,
          backgroundColor: '#f8f9fa'
        }}>
          <h3>🤖 AI-Powered Analysis</h3>
          
          {detailedAnalysis.map((analysis, index) => (
            <div key={index} style={{ 
              marginBottom: 20,
              padding: 15,
              border: '1px solid #e0e0e0',
              borderRadius: 5,
              backgroundColor: 'white'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>
                Question {index + 1}
              </h4>
              
              {/* Strengths */}
              {analysis.llmFeedback?.strengths?.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <strong style={{ color: '#28a745' }}>✅ Strengths:</strong>
                  <ul style={{ margin: '5px 0', paddingLeft: 20 }}>
                    {analysis.llmFeedback.strengths.map((strength, idx) => (
                      <li key={idx} style={{ fontSize: 14, marginBottom: 3 }}>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Improvements */}
              {analysis.llmFeedback?.improvement_tips?.length > 0 && (
                <div>
                  <strong style={{ color: '#007bff' }}>💡 Tips:</strong>
                  <ul style={{ margin: '5px 0', paddingLeft: 20 }}>
                    {analysis.llmFeedback.improvement_tips.map((tip, idx) => (
                      <li key={idx} style={{ fontSize: 14, marginBottom: 3 }}>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ 
        display: 'flex', 
        gap: 15,
        justifyContent: 'center' 
      }}>
        <button
          onClick={onRestart}
          style={{
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: 5,
            cursor: 'pointer',
            fontSize: 16
          }}
        >
          Practice Again
        </button>
        
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: 5,
            cursor: 'pointer',
            fontSize: 16
          }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}