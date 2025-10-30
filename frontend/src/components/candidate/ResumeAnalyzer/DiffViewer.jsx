// frontend/src/components/candidate/ResumeAnalyzer/DiffViewer.jsx

import React, { useMemo } from 'react';

export default function DiffViewer({ originalText, optimizedText, addedSkills }) {
  // Calculate statistics
  const stats = useMemo(() => {
    const originalLines = originalText.split('\n').filter(l => l.trim()).length;
    const optimizedLines = optimizedText.split('\n').filter(l => l.trim()).length;
    const addedLines = optimizedLines - originalLines;
    
    return {
      originalLines,
      optimizedLines,
      addedLines,
      addedSkillsCount: addedSkills.length
    };
  }, [originalText, optimizedText, addedSkills]);

  // Render optimized text with skill highlights
  const renderHighlightedText = (text, skills) => {
    let highlightedText = text;
    const highlightPositions = [];
    
    // Find positions of each skill
    skills.forEach(skill => {
      const regex = new RegExp(`(${escapeRegex(skill)})`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        highlightPositions.push({
          start: match.index,
          end: match.index + match[0].length,
          skill: match[0]
        });
      }
    });
    
    // Sort by position
    highlightPositions.sort((a, b) => a.start - b.start);
    
    // Build highlighted text
    let result = [];
    let lastIndex = 0;
    
    highlightPositions.forEach((pos, idx) => {
      // Add text before highlight
      if (pos.start > lastIndex) {
        result.push(
          <span key={`text-${idx}`}>
            {text.substring(lastIndex, pos.start)}
          </span>
        );
      }
      
      // Add highlighted skill
      result.push(
        <span key={`highlight-${idx}`} style={styles.highlight}>
          {pos.skill}
        </span>
      );
      
      lastIndex = pos.end;
    });
    
    // Add remaining text
    if (lastIndex < text.length) {
      result.push(
        <span key="text-end">
          {text.substring(lastIndex)}
        </span>
      );
    }
    
    return result.length > 0 ? result : text;
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>📊 Before & After Comparison</h3>
      
      {/* Statistics Bar */}
      <div style={styles.statsBar}>
        <div style={styles.stat}>
          <span style={styles.statLabel}>Original Lines:</span>
          <span style={styles.statValue}>{stats.originalLines}</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statLabel}>Optimized Lines:</span>
          <span style={styles.statValue}>{stats.optimizedLines}</span>
        </div>
        <div style={styles.stat}>
          <span style={{...styles.statLabel, ...styles.addedLabel}}>Added:</span>
          <span style={{...styles.statValue, ...styles.addedValue}}>
            +{stats.addedLines} lines
          </span>
        </div>
        <div style={styles.stat}>
          <span style={{...styles.statLabel, ...styles.addedLabel}}>Skills:</span>
          <span style={{...styles.statValue, ...styles.addedValue}}>
            +{stats.addedSkillsCount}
          </span>
        </div>
      </div>

      {/* Side-by-Side Comparison */}
      <div style={styles.comparisonContainer}>
        {/* Original Resume */}
        <div style={styles.column}>
          <div style={styles.columnHeader}>
            <span style={styles.columnTitle}>📄 Original Resume</span>
          </div>
          <div style={styles.textContent}>
            <pre style={styles.textPre}>
              {originalText}
            </pre>
          </div>
        </div>

        {/* Optimized Resume */}
        <div style={styles.column}>
          <div style={{...styles.columnHeader, ...styles.optimizedHeader}}>
            <span style={styles.columnTitle}>✨ Optimized Resume</span>
            <span style={styles.badge}>
              {stats.addedSkillsCount} skills added
            </span>
          </div>
          <div style={styles.textContent}>
            <pre style={styles.textPre}>
              {renderHighlightedText(optimizedText, addedSkills)}
            </pre>
          </div>
        </div>
      </div>

      {/* Added Skills Legend */}
      <div style={styles.legend}>
        <div style={styles.legendTitle}>
          <span style={styles.highlightExample}>Highlighted text</span>
          <span> = Skills added to your resume</span>
        </div>
        <div style={styles.skillsList}>
          {addedSkills.map((skill, index) => (
            <span key={index} style={styles.skillTag}>
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper function to escape regex special characters
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================
// STYLES
// ============================================
const styles = {
  container: {
    marginBottom: 30
  },
  title: {
    fontSize: 22,
    fontWeight: 600,
    marginBottom: 20,
    color: '#333'
  },
  
  // Statistics Bar
  statsBar: {
    display: 'flex',
    gap: 20,
    marginBottom: 20,
    padding: '15px 20px',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    flexWrap: 'wrap'
  },
  stat: {
    display: 'flex',
    gap: 8,
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: 500
  },
  statValue: {
    fontSize: 16,
    fontWeight: 700,
    color: '#333'
  },
  addedLabel: {
    color: '#28a745'
  },
  addedValue: {
    color: '#28a745'
  },
  
  // Comparison Container
  comparisonContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20,
    marginBottom: 20
  },
  column: {
    border: '2px solid #dee2e6',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'white'
  },
  columnHeader: {
    backgroundColor: '#f8f9fa',
    padding: '12px 16px',
    borderBottom: '2px solid #dee2e6',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  optimizedHeader: {
    backgroundColor: '#d4edda',
    borderBottom: '2px solid #c3e6cb'
  },
  columnTitle: {
    fontWeight: 600,
    fontSize: 16,
    color: '#333'
  },
  badge: {
    backgroundColor: '#28a745',
    color: 'white',
    padding: '4px 12px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600
  },
  textContent: {
    backgroundColor: 'white',
    maxHeight: 500,
    overflowY: 'auto',
    padding: 16
  },
  textPre: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.6,
    color: '#333',
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word'
  },
  
  // Highlighting
  highlight: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '2px 4px',
    borderRadius: 3,
    fontWeight: 600,
    border: '1px solid #c3e6cb'
  },
  
  // Legend
  legend: {
    padding: '15px 20px',
    backgroundColor: '#d4edda',
    borderRadius: 8,
    border: '2px solid #c3e6cb'
  },
  legendTitle: {
    fontSize: 14,
    marginBottom: 12,
    color: '#155724',
    display: 'flex',
    alignItems: 'center',
    gap: 5
  },
  highlightExample: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '2px 6px',
    borderRadius: 3,
    fontWeight: 600,
    border: '1px solid #c3e6cb',
    fontFamily: 'monospace'
  },
  skillsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8
  },
  skillTag: {
    backgroundColor: '#28a745',
    color: 'white',
    padding: '4px 10px',
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 500
  }
};