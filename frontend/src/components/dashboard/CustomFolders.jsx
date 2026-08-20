import React, { useState, useEffect } from 'react';
import { FolderPlus, Folder, Trash2 } from 'lucide-react';

export default function CustomFolders() {
  const [folders, setFolders] = useState([]);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('openprep_custom_folders');
    if (saved) {
      setFolders(JSON.parse(saved));
    } else {
      setFolders([{ id: 1, name: 'General Subjects', color: 'bg-blue-100 text-blue-800' }]);
    }
  }, []);

  const saveFolders = (newFolders) => {
    setFolders(newFolders);
    localStorage.setItem('openprep_custom_folders', JSON.stringify(newFolders));
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const colors = [
      'bg-blue-100 text-blue-800', 
      'bg-green-100 text-green-800', 
      'bg-purple-100 text-purple-800', 
      'bg-amber-100 text-amber-800', 
      'bg-rose-100 text-rose-800'
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newFolder = {
      id: Date.now(),
      name: newFolderName,
      color: randomColor,
      count: 0
    };
    
    saveFolders([...folders, newFolder]);
    setNewFolderName('');
  };

  const handleDelete = (id) => {
    saveFolders(folders.filter(f => f.id !== id));
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold font-playfair text-slate-900 dark:text-white flex items-center gap-2">
          <Folder className="w-5 h-5 text-indigo-500" />
          Subject Folders
        </h2>
      </div>

      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          placeholder="New folder name..."
          className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800 dark:text-slate-100"
        />
        <button 
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl transition-colors"
        >
          <FolderPlus className="w-5 h-5" />
        </button>
      </form>

      <div className="grid grid-cols-2 gap-4">
        {folders.map(folder => (
          <div 
            key={folder.id} 
            className={`p-4 rounded-xl flex flex-col justify-between group cursor-pointer hover:shadow-md transition-all border border-transparent dark:border-slate-600 ${folder.color.split(' ')[0]} dark:bg-slate-700/50`}
          >
            <div className="flex justify-between items-start">
              <Folder className={`w-8 h-8 mb-2 ${folder.color.split(' ')[1]} dark:text-slate-300`} />
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(folder.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-500 transition-opacity bg-white/50 dark:bg-slate-800/50 rounded-full"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate text-sm">
              {folder.name}
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
              {folder.count || Math.floor(Math.random() * 5)} items
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
