import React, { useState } from 'react';
import { X, Tag } from 'lucide-react';

export const TagSelectorModal = ({ isOpen, onClose, selectedTags = [], onSave }) => {
  const [tags, setTags] = useState(selectedTags);
  const [input, setInput] = useState('');

  if (!isOpen) return null;

  const handleAddTag = (e) => {
    e.preventDefault();
    const newTag = input.trim().toLowerCase();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
    setInput('');
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSave = () => {
    onSave(tags);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Tag size={18} /> Manage Tags
          </h3>
          <button onClick={onClose} className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-blue-900 dark:hover:text-blue-100">
                  <X size={12} />
                </button>
              </span>
            ))}
            {tags.length === 0 && <span className="text-sm text-gray-500">No tags added yet.</span>}
          </div>
          
          <form onSubmit={handleAddTag} className="flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Add a new tag..."
              className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              type="submit"
              disabled={!input.trim()}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Add
            </button>
          </form>
        </div>
        
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
            Save Tags
          </button>
        </div>
      </div>
    </div>
  );
};
