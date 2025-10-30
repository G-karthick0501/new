// frontend/src/components/interview/QuestionDisplay.jsx
export default function QuestionDisplay({ question, questionNumber, totalQuestions }) {
  if (!question) return null;

  return (
    <div style={{ 
      padding: 20, 
      border: '1px solid #ddd', 
      borderRadius: 8,
      backgroundColor: '#f8f9fa',
      marginBottom: 20 
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 15 
      }}>
        <span style={{ 
          fontSize: 14, 
          color: '#666',
          fontWeight: 'bold' 
        }}>
          Question {questionNumber} of {totalQuestions}
        </span>
        
        <span style={{ 
          padding: '4px 8px', 
          backgroundColor: '#007bff', 
          color: 'white',
          borderRadius: 4,
          fontSize: 12,
          textTransform: 'capitalize'
        }}>
          {question.category || 'General'}
        </span>
      </div>
      
      <h3 style={{ 
        margin: 0, 
        lineHeight: 1.4,
        color: '#333' 
      }}>
        {question.text}
      </h3>
    </div>
  );
}