import React, { useState, useEffect } from 'react';
import { Bookmark, FileText, Layout, HelpCircle } from 'lucide-react';

export const BookmarkedSection = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      // Assuming a generic endpoint or we aggregate bookmarks from different sources
      // const token = localStorage.getItem('token');
      // const res = await axios.get('/api/bookmarks', { headers: { Authorization: `Bearer ${token}` } });
      // setItems(res.data.data);
      
      // Mock data for now since endpoint wasn't fully specified in requirements
      setTimeout(() => {
        setItems([
          { id: '1', type: 'note', title: 'Chapter 5 Notes: Thermodynamics', tags: ['physics', 'important'] },
          { id: '2', type: 'flashcard', title: 'Biology Terms set 1', tags: ['bio'] },
          { id: '3', type: 'quiz', title: 'Midterm Review Quiz', tags: ['exam-prep'] }
        ]);
        setLoading(false);
      }, 500);
    } catch (err) {
      console.error('Failed to fetch bookmarks', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBookmarks();
  }, []);

  const getIcon = (type) => {
    switch(type) {
      case 'note': return <FileText size={18} className="text-blue-500" />;
      case 'flashcard': return <Layout size={18} className="text-purple-500" />;
      case 'quiz': return <HelpCircle size={18} className="text-green-500" />;
      default: return <Bookmark size={18} />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
        <Bookmark size={20} className="text-yellow-500" />
        <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Bookmarked Items</h2>
      </div>
      
      <div className="p-4">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-md"></div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Bookmark size={48} className="mx-auto mb-2 opacity-20" />
            <p>No bookmarked items yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-gray-100 dark:border-gray-800 transition-colors cursor-pointer">
                <div className="mr-4 p-2 bg-gray-50 dark:bg-gray-800 rounded-full">
                  {getIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.title}</h4>
                  <div className="flex gap-2 mt-1">
                    {item.tags?.map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <button className="text-yellow-500 hover:text-yellow-600 p-2">
                  <Bookmark size={18} fill="currentColor" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
