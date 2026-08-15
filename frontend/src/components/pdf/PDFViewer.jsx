import React, { useState } from 'react';
import PDFAnnotationToolbar from './PDFAnnotationToolbar';
import StickyNoteOverlay from './StickyNoteOverlay';
import SelectionContextMenu from './SelectionContextMenu';
import './PDFViewer.css'; // Optional CSS for styling

const PDFViewer = ({ documentId }) => {
  const [annotations, setAnnotations] = useState([]);
  const [activeTool, setActiveTool] = useState(null); // 'highlight' | 'sticky' | null

  // Placeholder functions for interacting with backend API
  const handleSaveAnnotation = async (newAnnotation) => {
    // API call would go here
    setAnnotations((prev) => [...prev, newAnnotation]);
  };

  return (
    <div className="pdf-viewer-container" style={{ position: 'relative' }}>
      <PDFAnnotationToolbar activeTool={activeTool} onToolSelect={setActiveTool} />
      
      {/* Mock PDF Document Area */}
      <div className="pdf-document" style={{ border: '1px solid #ccc', minHeight: '600px', padding: '2rem' }}>
        <p>This is a mock PDF document page. In a real app, this would use pdf.js or similar.</p>
        
        <SelectionContextMenu onHighlight={(color) => handleSaveAnnotation({ type: 'highlight', color, rectsData: [] })} />
        
        {annotations.map((ann, idx) => (
          ann.type === 'sticky' ? 
            <StickyNoteOverlay key={idx} annotation={ann} /> : 
            <div key={idx} style={{ backgroundColor: ann.color || 'yellow' }}>[Highlight]</div>
        ))}
      </div>
    </div>
  );
};

export default PDFViewer;
