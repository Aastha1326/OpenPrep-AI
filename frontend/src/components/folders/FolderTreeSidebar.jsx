import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronRight, ChevronDown, Folder, Plus } from 'lucide-react';

const FolderNode = ({ folder, onSelect, selectedId, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isSelected = selectedId === folder.id;
  const hasChildren = folder.children && folder.children.length > 0;

  return (
    <div className="w-full">
      <div 
        className={`flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer rounded-md ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : ''}`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => onSelect(folder)}
      >
        <div 
          className="mr-1 w-4 h-4 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          {hasChildren && (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
        </div>
        <Folder size={16} className="mr-2" style={{ color: folder.color || '#6b7280' }} />
        <span className="text-sm font-medium truncate">{folder.name}</span>
      </div>
      
      {isOpen && hasChildren && (
        <div className="flex flex-col w-full mt-1">
          {folder.children.map(child => (
            <FolderNode 
              key={child.id} 
              folder={child} 
              onSelect={onSelect} 
              selectedId={selectedId} 
              level={level + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FolderTreeSidebar = ({ onFolderSelect, selectedFolderId }) => {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTree = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/folders/tree', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTree(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch folder tree', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTree();
  }, []);

  return (
    <div className="w-64 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">My Folders</h3>
        <button className="p-1 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
          <Plus size={16} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
        ) : tree.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">No folders yet.</div>
        ) : (
          tree.map(folder => (
            <FolderNode 
              key={folder.id} 
              folder={folder} 
              onSelect={onFolderSelect} 
              selectedId={selectedFolderId} 
            />
          ))
        )}
      </div>
    </div>
  );
};
