import React from 'react';

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: '#FFE900' },
  { name: 'Green', value: '#90EE90' },
  { name: 'Pink', value: '#FF9EDB' },
  { name: 'Blue', value: '#8AC7FF' },
];

const SelectionContextMenu = ({ position, onHighlight, onAddNote, onConvertToFlashcard }) => {
  if (!position) return null;

  return (
    <div
      className="selection-context-menu"
      role="menu"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: '#333',
        padding: '6px',
        borderRadius: '6px',
        position: 'absolute',
        top: position.top,
        left: position.left,
        zIndex: 100,
      }}
    >
      {HIGHLIGHT_COLORS.map((c) => (
        <button
          key={c.value}
          type="button"
          role="menuitem"
          style={{ backgroundColor: c.value, width: '20px', height: '20px', borderRadius: '3px', border: 'none', cursor: 'pointer' }}
          onClick={() => onHighlight(c.value)}
          title={`Highlight ${c.name}`}
          aria-label={`Highlight ${c.name}`}
        />
      ))}
      <div style={{ width: '1px', height: '20px', backgroundColor: '#555' }} />
      <button
        type="button"
        role="menuitem"
        onClick={onAddNote}
        className="px-2 py-1 text-xs text-white rounded hover:bg-neutral-700"
      >
        Add Note
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={onConvertToFlashcard}
        className="px-2 py-1 text-xs text-white rounded hover:bg-neutral-700"
      >
        Convert to Flashcard
      </button>
    </div>
  );
};

export default SelectionContextMenu;