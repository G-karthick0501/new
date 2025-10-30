// frontend/src/components/candidate/ResumeAnalyzer/FileUpload.jsx

import React, { useRef } from 'react';
import { resumeAnalysisService } from '../../../services/api/resumeAnalysisApi';

export default function FileUpload({ onFilesSelected, resumeFile, jdFile, disabled }) {
  const resumeInputRef = useRef(null);
  const jdInputRef = useRef(null);

  const handleFileChange = (type, event) => {
    const file = event.target.files[0];
    onFilesSelected(type, file);
  };

  const getFileDisplayName = (file) => {
    if (!file) return '';
    const maxLength = 25;
    if (file.name.length <= maxLength) return file.name;
    const ext = file.name.split('.').pop();
    const name = file.name.substring(0, maxLength - ext.length - 4);
    return `${name}...${ext}`;
  };

  const fileCardStyle = (hasFile) => ({
    border: hasFile ? '2px solid #28a745' : '2px dashed #ccc',
    borderRadius: 8,
    padding: 20,
    textAlign: 'center',
    backgroundColor: hasFile ? '#f8fff8' : '#f8f9fa',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.3s ease',
    minHeight: 120,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  });

  return (
    <div style={{ marginBottom: 30 }}>
      <h3 style={{ marginBottom: 20 }}>Upload Files</h3>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: 20 
      }}>
        {/* Resume Upload */}
        <div 
          style={fileCardStyle(resumeFile)}
          onClick={() => !disabled && resumeInputRef.current?.click()}
        >
          <input
            ref={resumeInputRef}
            type="file"
            accept=".pdf"
            onChange={(e) => handleFileChange('resume', e)}
            style={{ display: 'none' }}
            disabled={disabled}
          />
          
          <div style={{ fontSize: 24, marginBottom: 10 }}>
            {resumeFile ? '✅' : '📄'}
          </div>
          
          <div>
            <strong>Resume (PDF)</strong>
            {resumeFile ? (
              <div style={{ marginTop: 8 }}>
                <div style={{ color: '#28a745', fontSize: 14, fontWeight: 'bold' }}>
                  {getFileDisplayName(resumeFile)}
                </div>
                <div style={{ color: '#6c757d', fontSize: 12 }}>
                  {resumeAnalysisService.formatFileSize(resumeFile.size)}
                </div>
              </div>
            ) : (
              <div style={{ color: '#6c757d', fontSize: 14, marginTop: 8 }}>
                Click to upload your resume
              </div>
            )}
          </div>
        </div>

        {/* Job Description Upload */}
        <div 
          style={fileCardStyle(jdFile)}
          onClick={() => !disabled && jdInputRef.current?.click()}
        >
          <input
            ref={jdInputRef}
            type="file"
            accept=".pdf"
            onChange={(e) => handleFileChange('jd', e)}
            style={{ display: 'none' }}
            disabled={disabled}
          />
          
          <div style={{ fontSize: 24, marginBottom: 10 }}>
            {jdFile ? '✅' : '💼'}
          </div>
          
          <div>
            <strong>Job Description (PDF)</strong>
            {jdFile ? (
              <div style={{ marginTop: 8 }}>
                <div style={{ color: '#28a745', fontSize: 14, fontWeight: 'bold' }}>
                  {getFileDisplayName(jdFile)}
                </div>
                <div style={{ color: '#6c757d', fontSize: 12 }}>
                  {resumeAnalysisService.formatFileSize(jdFile.size)}
                </div>
              </div>
            ) : (
              <div style={{ color: '#6c757d', fontSize: 14, marginTop: 8 }}>
                Click to upload job description
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* File Requirements */}
      <div style={{ 
        marginTop: 15,
        padding: 10,
        backgroundColor: '#e9ecef',
        borderRadius: 5,
        fontSize: 12,
        color: '#6c757d'
      }}>
        <strong>Requirements:</strong> PDF files only, maximum 10MB each
      </div>
    </div>
  );
}