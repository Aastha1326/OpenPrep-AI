import React from 'react';

const PDFAnnotationToolbar = ({ activeTool, onToolSelect }) => {
  return (
    <div className="pdf-toolbar" style={{ padding: '10px', backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd', display: 'flex', gap: '10px' }}>
      <button 
        style={{ fontWeight: activeTool === 'highlight' ? 'bold' : 'normal' }}
        onClick={() => onToolSelect(activeTool === 'highlight' ? null : 'highlight')}
      >
        Highlighter
      </button>
      <button 
        style={{ fontWeight: activeTool === 'sticky' ? 'bold' : 'normal' }}
        onClick={() => onToolSelect(activeTool === 'sticky' ? null : 'sticky')}
      >
        Sticky Note
      </button>
    </div>
  );
};

export default PDFAnnotationToolbar;
