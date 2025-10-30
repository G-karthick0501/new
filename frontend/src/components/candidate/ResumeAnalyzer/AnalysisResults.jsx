// frontend/src/components/candidate/ResumeAnalyzer/AnalysisResults.jsx

import React, { useState } from 'react';

export default function AnalysisResults({ analysis, onClear }) {
  const [activeTab, setActiveTab] = useState('summary');

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const tabStyle = (isActive) => ({
    padding: '10px 20px',
    border: 'none',
    backgroundColor: isActive ? '#007bff' : 'transparent',
    color: isActive ? 'white' : '#333',
    cursor: 'pointer',
    borderRadius: '5px 5px 0 0',
    marginRight: '5px'
  });

  return (
    <div style={{ 
      border: '1px solid #ddd', 
      borderRadius: 8, 
      marginTop: 30,
      backgroundColor: 'white'
    }}>
      {/* Header */}
      <div style={{ 
        padding: 20, 
        borderBottom: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <div>
          <h3 style={{ margin: 0, color: '#28a745' }}>✅ Analysis Complete!</h3>
          <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: 14 }}>
            Analyzed on {formatDate(analysis.analysisDate)}
          </p>
          {analysis.isRestored && (
            <p style={{ margin: '2px 0 0 0', color: '#17a2b8', fontSize: 12, fontStyle: 'italic' }}>
              📄 Results restored from previous session
            </p>
          )}
        </div>
        <button
          onClick={onClear}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: 5,
            cursor: 'pointer'
          }}
        >
          Clear Results
        </button>
      </div>

      {/* Navigation Tabs */}
      <div style={{ 
        padding: '0 20px',
        borderBottom: '1px solid #ddd',
        backgroundColor: '#f8f9fa'
      }}>
        <button
          onClick={() => setActiveTab('summary')}
          style={tabStyle(activeTab === 'summary')}
        >
          📊 Summary
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          style={tabStyle(activeTab === 'skills')}
        >
          🎯 Missing Skills
        </button>
        <button
          onClick={() => setActiveTab('tips')}
          style={tabStyle(activeTab === 'tips')}
        >
          💡 Improvement Tips
        </button>
        <button
          onClick={() => setActiveTab('optimized')}
          style={tabStyle(activeTab === 'optimized')}
        >
          📝 Optimized Resume
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ padding: 20 }}>
        {activeTab === 'summary' && (
          <div>
            <h4>Analysis Summary</h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: 15,
              marginBottom: 20
            }}>
              <div style={{ 
                padding: 15, 
                border: '1px solid #e9ecef', 
                borderRadius: 8,
                textAlign: 'center',
                backgroundColor: '#fff3cd'
              }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#856404' }}>
                  {analysis.missingSkillsCount}
                </div>
                <div style={{ fontSize: 14, color: '#6c757d' }}>Missing Skills</div>
              </div>
              
              <div style={{ 
                padding: 15, 
                border: '1px solid #e9ecef', 
                borderRadius: 8,
                textAlign: 'center',
                backgroundColor: '#d1ecf1'
              }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#0c5460' }}>
                  {analysis.improvementTipsCount}
                </div>
                <div style={{ fontSize: 14, color: '#6c757d' }}>Improvement Tips</div>
              </div>
            </div>
            
            <div style={{ 
              padding: 15,
              backgroundColor: '#e8f5e8',
              borderRadius: 8,
              border: '1px solid #4caf50'
            }}>
              <h5>Files Analyzed:</h5>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li><strong>Resume:</strong> {analysis.resumeFileName}</li>
                <li><strong>Job Description:</strong> {analysis.jdFileName}</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div>
            <h4>Missing Skills ({analysis.missingSkillsCount})</h4>
            {analysis.missingSkills.length > 0 ? (
              <div>
                <p style={{ color: '#6c757d', marginBottom: 15 }}>
                  These skills appear in the job description but not in your resume:
                </p>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 8 
                }}>
                  {analysis.missingSkills.map((skill, index) => (
                    <span
                      key={index}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#fff3cd',
                        color: '#856404',
                        borderRadius: 15,
                        fontSize: 14,
                        border: '1px solid #ffeaa7'
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <div style={{ 
                  marginTop: 15,
                  padding: 10,
                  backgroundColor: '#f8f9fa',
                  borderRadius: 5,
                  fontSize: 14
                }}>
                  <strong>💡 Tip:</strong> Focus on adding the most relevant skills that match your actual experience.
                </div>
              </div>
            ) : (
              <p style={{ color: '#28a745' }}>
                Great! No missing skills detected. Your resume seems well-aligned with the job requirements.
              </p>
            )}
          </div>
        )}

        {activeTab === 'tips' && (
          <div>
            <h4>Improvement Tips ({analysis.improvementTipsCount})</h4>
            {analysis.improvementTips.length > 0 ? (
              <div>
                <p style={{ color: '#6c757d', marginBottom: 15 }}>
                  AI-generated suggestions to improve your resume:
                </p>
                <div style={{ lineHeight: 1.8 }}>
                  {analysis.improvementTips.map((tip, index) => (
                    <div
                      key={index}
                      style={{
                        padding: 15,
                        marginBottom: 10,
                        backgroundColor: '#f8f9fa',
                        borderLeft: '4px solid #007bff',
                        borderRadius: 5
                      }}
                    >
                      <strong>💡 Tip {index + 1}:</strong> {tip}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ color: '#28a745' }}>
                Your resume looks good! No specific improvement tips generated.
              </p>
            )}
          </div>
        )}

        {activeTab === 'optimized' && (
          <div>
            <h4>AI-Optimized Resume</h4>
            {analysis.optimizedResume ? (
              <div>
                <div style={{ 
                  marginBottom: 15,
                  padding: 10,
                  backgroundColor: '#d4edda',
                  borderRadius: 5,
                  color: '#155724',
                  fontSize: 14
                }}>
                  <strong>📝 Note:</strong> This is AI-generated content. Review and edit before using.
                  Make sure all information is accurate and reflects your actual experience.
                </div>
                
                <div style={{
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  padding: 20,
                  backgroundColor: '#ffffff',
                  fontFamily: 'Georgia, serif',
                  lineHeight: 1.6,
                  maxHeight: 500,
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap'
                }}>
                  {analysis.optimizedResume}
                </div>
                
                <div style={{ marginTop: 15, textAlign: 'center' }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(analysis.optimizedResume);
                      alert('Optimized resume copied to clipboard!');
                    }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: 5,
                      cursor: 'pointer'
                    }}
                  >
                    📋 Copy to Clipboard
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ color: '#6c757d' }}>
                No optimized resume content available.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}