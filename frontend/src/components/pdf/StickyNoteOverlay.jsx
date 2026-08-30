import React, { useState } from 'react';

const StickyNoteOverlay = ({ annotation }) => {
  const [expanded, setExpanded] = useState(false);
  const point = annotation.rectsData?.[0] || { x: 0.05, y: 0.05 };

  return (
    <div
      className="sticky-note-overlay"
      role="button"
      tabIndex={0}
      onClick={() => setExpanded((prev) => !prev)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setExpanded((prev) => !prev);
        }
      }}
      aria-expanded={expanded}
      aria-label="Sticky note, click to expand or collapse"
      style={{
        position: 'absolute',
        top: `${point.y * 100}%`,
        left: `${point.x * 100}%`,
        width: expanded ? '200px' : '28px',
        backgroundColor: annotation.color || '#fff9b1',
        border: '1px solid #dcd797',
        padding: expanded ? '10px' : '4px',
        boxShadow: '2px 2px 5px rgba(0,0,0,0.2)',
        cursor: 'pointer',
        zIndex: 10,
      }}
    >
      {expanded ? (
        <>
          <div style={{ fontSize: '12px', marginBottom: '5px', fontWeight: 'bold' }}>Note</div>
          <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{annotation.commentText || 'Empty note...'}</div>
        </>
      ) : (
        <div style={{ fontSize: '14px', textAlign: 'center' }}>📝</div>
      )}
    </div>
  );
};

export default StickyNoteOverlay;