import React, { useRef } from 'react';
import API from '../../services/api';

export default function RichTextEditor({ value, onChange }) {
  const editorRef = useRef(null);

  const handlePaste = async (e) => {
    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;

    const items = clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault(); // Prevent default base64 embedding
        const file = items[i].getAsFile();
        if (!file) continue;

        const formData = new FormData();
        formData.append('image', file);

        try {
          // Show temporary loading indicator or placeholder if desired
          const response = await API.post('/upload/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          if (response.data.success && response.data.url) {
            const imageUrl = response.data.url;
            
            // Insert image URL into the editor at current selection
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              range.deleteContents();
              
              const imgNode = document.createElement('img');
              imgNode.src = imageUrl;
              imgNode.className = 'max-w-full rounded-xl my-2 shadow-sm';
              range.insertNode(imgNode);
              
              // Trigger change event for parent form
              if (editorRef.current && onChange) {
                onChange(editorRef.current.innerHTML);
              }
            }
          }
        } catch (err) {
          console.error('Failed to upload pasted image:', err);
          alert('Failed to upload pasted screenshot. Please try again.');
        }
        break;
      }
    }
  };

  return (
    <div className="w-full border border-[#CEAB93]/60 dark:border-[#412D15] rounded-2xl overflow-hidden bg-white dark:bg-[#16120E] shadow-sm">
      <div
        ref={editorRef}
        contentEditable
        onPaste={handlePaste}
        onInput={(e) => onChange && onChange(e.currentTarget.innerHTML)}
        dangerouslySetInnerHTML={{ __html: value || '' }}
        className="p-4 min-h-[300px] focus:outline-none text-sm font-inter text-[#1F150C] dark:text-[#E1DCC9]"
        placeholder="Type your notes or paste screenshots here..."
      />
    </div>
  );
}
