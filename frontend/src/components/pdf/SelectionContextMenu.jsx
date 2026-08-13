import React from 'react';

const SelectionContextMenu = ({ onHighlight }) => {
  return (
    <div 
      className="selection-context-menu"
      style={{
        display: 'inline-flex',
        gap: '5px',
        backgroundColor: '#333',
        padding: '5px',
        borderRadius: '4px',
        position: 'absolute',
        top: '20px', // Example positioning
        left: '200px',
        zIndex: 100
      }}
    >
      <button 
        style={{ backgroundColor: '#FFE900', width: '20px', height: '20px', border: 'none', cursor: 'pointer' }}
        onClick={() => onHighlight('#FFE900')}
        title="Highlight Yellow"
      />
      <button 
        style={{ backgroundColor: '#FF8A8A', width: '20px', height: '20px', border: 'none', cursor: 'pointer' }}
        onClick={() => onHighlight('#FF8A8A')}
        title="Highlight Red"
      />
      <button 
        style={{ backgroundColor: '#90EE90', width: '20px', height: '20px', border: 'none', cursor: 'pointer' }}
        onClick={() => onHighlight('#90EE90')}
        title="Highlight Green"
      />
    </div>
  );
};

export default SelectionContextMenu;
