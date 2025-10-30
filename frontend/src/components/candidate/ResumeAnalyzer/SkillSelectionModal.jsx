// frontend/src/components/candidate/ResumeAnalyzer/SkillSelectionModal.jsx - ENHANCED

import React, { useState } from 'react';

export default function SkillSelectionModal({
  missingSkills,
  selectedSkills,
  onToggleSkill,
  onSelectAll,
  onDeselectAll,
  onContinue,
  onCancel,
  loading
}) {
  // ============================================
  // CUSTOM SKILL INPUT STATE
  // ============================================
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [customSkills, setCustomSkills] = useState([]);

  const selectedCount = selectedSkills.length;
  const totalCount = missingSkills.length + customSkills.length;
  const isAllSelected = selectedCount === totalCount;

  // ============================================
  // CUSTOM SKILL HANDLERS
  // ============================================
  
  const handleAddCustomSkill = () => {
    const trimmedSkill = customSkillInput.trim();
    
    if (!trimmedSkill) {
      alert('⚠️ Please enter a skill name');
      return;
    }
    
    // Check for duplicates
    if (missingSkills.includes(trimmedSkill) || customSkills.includes(trimmedSkill)) {
      alert('⚠️ This skill already exists in the list');
      return;
    }
    
    // Add to custom skills
    setCustomSkills(prev => [...prev, trimmedSkill]);
    
    // Auto-select the new custom skill
    onToggleSkill(trimmedSkill);
    
    // Clear input
    setCustomSkillInput('');
  };

  const handleRemoveCustomSkill = (skill) => {
    // Remove from custom skills
    setCustomSkills(prev => prev.filter(s => s !== skill));
    
    // Deselect if it was selected
    if (selectedSkills.includes(skill)) {
      onToggleSkill(skill);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddCustomSkill();
    }
  };

  // ============================================
  // COMBINED SKILLS LIST
  // ============================================
  
  const allSkills = [...missingSkills, ...customSkills];

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>
            🎯 Select Skills to Add
          </h2>
          <p style={styles.subtitle}>
            We found <strong>{missingSkills.length} missing skills</strong> in your resume. 
            Select which ones you'd like to add, or add your own custom skills.
          </p>
        </div>

        {/* Selection Summary + Actions */}
        <div style={styles.summary}>
          <div style={styles.summaryText}>
            <span style={styles.selectedBadge}>
              {selectedCount} of {totalCount} selected
            </span>
            {customSkills.length > 0 && (
              <span style={styles.customBadge}>
                {customSkills.length} custom
              </span>
            )}
          </div>
          <div style={styles.actions}>
            <button
              onClick={onSelectAll}
              disabled={isAllSelected || loading}
              style={{
                ...styles.button,
                ...styles.secondaryButton,
                opacity: isAllSelected ? 0.5 : 1
              }}
            >
              ✓ Select All
            </button>
            <button
              onClick={onDeselectAll}
              disabled={selectedCount === 0 || loading}
              style={{
                ...styles.button,
                ...styles.secondaryButton,
                opacity: selectedCount === 0 ? 0.5 : 1
              }}
            >
              ✗ Deselect All
            </button>
          </div>
        </div>

        {/* ============================================ */}
        {/* CUSTOM SKILL INPUT BOX */}
        {/* ============================================ */}
        <div style={styles.customSkillSection}>
          <h3 style={styles.customSkillTitle}>➕ Add Custom Skills</h3>
          <p style={styles.customSkillSubtitle}>
            Don't see a skill? Add your own below:
          </p>
          
          <div style={styles.customSkillInputGroup}>
            <input
              type="text"
              value={customSkillInput}
              onChange={(e) => setCustomSkillInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., Docker, Kubernetes, AWS Lambda..."
              disabled={loading}
              style={styles.customSkillInput}
            />
            <button
              onClick={handleAddCustomSkill}
              disabled={!customSkillInput.trim() || loading}
              style={{
                ...styles.button,
                ...styles.addButton,
                opacity: !customSkillInput.trim() ? 0.5 : 1
              }}
            >
              ➕ Add
            </button>
          </div>
        </div>

        {/* ============================================ */}
        {/* SKILLS GRID */}
        {/* ============================================ */}
        <div style={styles.skillsContainer}>
          {/* AI-Identified Skills */}
          {missingSkills.length > 0 && (
            <>
              <div style={styles.sectionHeader}>
                <span style={styles.sectionTitle}>🤖 AI-Identified Skills ({missingSkills.length})</span>
              </div>
              {missingSkills.map((skill, index) => {
                const isSelected = selectedSkills.includes(skill);
                
                return (
                  <div
                    key={`ai-${index}`}
                    onClick={() => !loading && onToggleSkill(skill)}
                    style={{
                      ...styles.skillCard,
                      ...(isSelected ? styles.skillCardSelected : {}),
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1
                    }}
                  >
                    <div style={styles.checkbox}>
                      {isSelected ? (
                        <div style={styles.checkboxChecked}>✓</div>
                      ) : (
                        <div style={styles.checkboxUnchecked}></div>
                      )}
                    </div>
                    <div style={styles.skillText}>
                      {skill}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Custom Skills */}
          {customSkills.length > 0 && (
            <>
              <div style={styles.sectionHeader}>
                <span style={styles.sectionTitle}>✨ Your Custom Skills ({customSkills.length})</span>
              </div>
              {customSkills.map((skill, index) => {
                const isSelected = selectedSkills.includes(skill);
                
                return (
                  <div
                    key={`custom-${index}`}
                    style={{
                      ...styles.skillCard,
                      ...styles.customSkillCard,
                      ...(isSelected ? styles.skillCardSelected : {}),
                      opacity: loading ? 0.6 : 1
                    }}
                  >
                    <div style={styles.checkbox}>
                      <div
                        onClick={() => !loading && onToggleSkill(skill)}
                        style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
                      >
                        {isSelected ? (
                          <div style={styles.checkboxChecked}>✓</div>
                        ) : (
                          <div style={styles.checkboxUnchecked}></div>
                        )}
                      </div>
                    </div>
                    <div 
                      style={styles.skillText}
                      onClick={() => !loading && onToggleSkill(skill)}
                    >
                      {skill}
                    </div>
                    <button
                      onClick={() => handleRemoveCustomSkill(skill)}
                      disabled={loading}
                      style={styles.removeButton}
                      title="Remove custom skill"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div style={styles.footer}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              ...styles.button,
              ...styles.cancelButton
            }}
          >
            Cancel
          </button>
          <button
            onClick={onContinue}
            disabled={selectedCount === 0 || loading}
            style={{
              ...styles.button,
              ...styles.primaryButton,
              opacity: selectedCount === 0 ? 0.5 : 1
            }}
          >
            {loading ? (
              <>
                <span style={styles.spinner}>⏳</span>
                Generating Resume...
              </>
            ) : (
              <>
                Continue with {selectedCount} Skill{selectedCount !== 1 ? 's' : ''} →
              </>
            )}
          </button>
        </div>

        {/* Helper Text */}
        {selectedCount === 0 && (
          <p style={styles.helperText}>
            ⚠️ Please select at least one skill to continue
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================
// STYLES
// ============================================
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 20
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 12,
    maxWidth: 900,
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
  },
  header: {
    padding: '30px 30px 20px',
    borderBottom: '1px solid #e0e0e0'
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: '#333'
  },
  subtitle: {
    margin: '10px 0 0',
    fontSize: 16,
    color: '#666'
  },
  summary: {
    padding: '20px 30px',
    backgroundColor: '#f8f9fa',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 15
  },
  summaryText: {
    fontSize: 16,
    display: 'flex',
    gap: 10,
    alignItems: 'center'
  },
  selectedBadge: {
    backgroundColor: '#28a745',
    color: 'white',
    padding: '6px 16px',
    borderRadius: 20,
    fontWeight: 600,
    fontSize: 14
  },
  customBadge: {
    backgroundColor: '#6f42c1',
    color: 'white',
    padding: '6px 16px',
    borderRadius: 20,
    fontWeight: 600,
    fontSize: 14
  },
  actions: {
    display: 'flex',
    gap: 10
  },
  
  // ============================================
  // CUSTOM SKILL INPUT SECTION
  // ============================================
  customSkillSection: {
    padding: '20px 30px',
    backgroundColor: '#fff9e6',
    borderBottom: '1px solid #ffe066'
  },
  customSkillTitle: {
    margin: '0 0 5px',
    fontSize: 18,
    fontWeight: 600,
    color: '#333'
  },
  customSkillSubtitle: {
    margin: '0 0 15px',
    fontSize: 14,
    color: '#666'
  },
  customSkillInputGroup: {
    display: 'flex',
    gap: 10
  },
  customSkillInput: {
    flex: 1,
    padding: '10px 15px',
    fontSize: 16,
    border: '2px solid #ddd',
    borderRadius: 8,
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit'
  },
  addButton: {
    backgroundColor: '#6f42c1',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  
  // ============================================
  // SKILLS GRID
  // ============================================
  skillsContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 30px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 12,
    alignContent: 'start'
  },
  sectionHeader: {
    gridColumn: '1 / -1',
    marginTop: 10,
    marginBottom: 5
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#555'
  },
  skillCard: {
    border: '2px solid #e0e0e0',
    borderRadius: 8,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    transition: 'all 0.2s ease',
    backgroundColor: 'white'
  },
  skillCardSelected: {
    borderColor: '#28a745',
    backgroundColor: '#f0f9f4'
  },
  customSkillCard: {
    borderColor: '#6f42c1',
    backgroundColor: '#f8f5fc'
  },
  checkbox: {
    flexShrink: 0
  },
  checkboxChecked: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#28a745',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: 16
  },
  checkboxUnchecked: {
    width: 24,
    height: 24,
    borderRadius: 4,
    border: '2px solid #ccc',
    backgroundColor: 'white'
  },
  skillText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: '1.4',
    wordBreak: 'break-word',
    cursor: 'pointer'
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#dc3545',
    color: 'white',
    fontSize: 16,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.2s',
    opacity: 0.7
  },
  
  // ============================================
  // FOOTER
  // ============================================
  footer: {
    padding: '20px 30px',
    borderTop: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 15
  },
  button: {
    padding: '12px 24px',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  primaryButton: {
    backgroundColor: '#28a745',
    color: 'white'
  },
  secondaryButton: {
    backgroundColor: 'white',
    color: '#333',
    border: '2px solid #e0e0e0'
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    color: 'white'
  },
  helperText: {
    margin: 0,
    padding: '0 30px 20px',
    fontSize: 14,
    color: '#dc3545',
    textAlign: 'center'
  },
  spinner: {
    display: 'inline-block',
    animation: 'spin 1s linear infinite'
  }
};