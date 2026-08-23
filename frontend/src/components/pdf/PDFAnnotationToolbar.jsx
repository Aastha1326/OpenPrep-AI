import React from 'react';

const PDFAnnotationToolbar = ({ pageNumber, numPages, scale, onPrevPage, onNextPage, onZoomIn, onZoomOut }) => {
  return (
    <div
      className="pdf-toolbar"
      style={{ padding: '10px', backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center', gap: '10px' }}
    >
      <button type="button" onClick={onPrevPage} disabled={pageNumber <= 1}>Prev</button>
      <span className="text-xs">Page {pageNumber} of {numPages || '-'}</span>
      <button type="button" onClick={onNextPage} disabled={pageNumber >= numPages}>Next</button>
      <div style={{ width: '1px', height: '20px', backgroundColor: '#ddd' }} />
      <button type="button" onClick={onZoomOut}>-</button>
      <span className="text-xs">{Math.round(scale * 100)}%</span>
      <button type="button" onClick={onZoomIn}>+</button>
      <span className="text-xs text-neutral-500 ml-auto">Tip: select text, then press Ctrl+H to highlight</span>
    </div>
  );
};

export default PDFAnnotationToolbar;