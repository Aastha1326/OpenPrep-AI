import React from 'react';

const StickyNoteOverlay = ({ annotation }) => {
  return (
    <div 
      className="sticky-note-overlay"
      style={{
        position: 'absolute',
        top: annotation.y || 50,
        left: annotation.x || 50,
        width: '150px',
        backgroundColor: '#fff9b1',
        border: '1px solid #dcd797',
        padding: '10px',
        boxShadow: '2px 2px 5px rgba(0,0,0,0.2)',
        zIndex: 10
      }}
    >
      <div style={{ fontSize: '12px', marginBottom: '5px', fontWeight: 'bold' }}>Note</div>
      <div style={{ fontSize: '14px' }}>{annotation.commentText || 'Empty note...'}</div>
    </div>
  );
};

export default StickyNoteOverlay;
