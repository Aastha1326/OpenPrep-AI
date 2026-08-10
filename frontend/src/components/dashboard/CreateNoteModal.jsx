import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, AlertCircle, Cloud, CloudRain } from 'lucide-react';
import 'react-quill/dist/quill.snow.css';
import API from '../../services/api';

const ReactQuill = lazy(() => import('react-quill'));

const CreateNoteModal = ({ isOpen, onClose, onNoteCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [noteId, setNoteId] = useState(null);
  const [autosaveStatus, setAutosaveStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const lastSavedTitle = useRef('');
  const lastSavedContent = useRef('');
  const autosaveTimer = useRef(null);

  // Load user's subjects list when modal opens
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await API.get('/subjects');
        if (res.data?.success) {
          const list = res.data.data || [];
          setSubjects(list);
          if (list.length > 0) {
            setSubjectId(list[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load subjects', err);
      }
    };

    if (isOpen) {
      fetchSubjects();
      setTitle('');
      setContent('');
      setNoteId(null);
      setAutosaveStatus('');
      lastSavedTitle.current = '';
      lastSavedContent.current = '';
    }

    return () => {
      if (autosaveTimer.current) {
        clearInterval(autosaveTimer.current);
      }
    };
  }, [isOpen]);

  // Periodic autosave trigger
  useEffect(() => {
    if (!isOpen) {
      if (autosaveTimer.current) clearInterval(autosaveTimer.current);
      return;
    }

    const performAutosave = async () => {
      // Avoid saving empty states or unmodified notes
      if (!title.trim() || !subjectId) return;
      if (!content.trim() || content === '<p><br></p>') return;
      if (title === lastSavedTitle.current && content === lastSavedContent.current) return;

      setAutosaveStatus('Auto-saving...');

      try {
        if (!noteId) {
          const formData = new FormData();
          formData.append('title', title);
          formData.append('content', content);
          formData.append('subjectId', subjectId);

          const response = await API.post('/notes', formData, {
            isBackground: true,
            headers: {
              'Content-Type': undefined,
            },
          });

          if (response.data?.success) {
            const savedNote = response.data.data;
            if (savedNote && savedNote.id) {
              setNoteId(savedNote.id);
              lastSavedTitle.current = title;
              lastSavedContent.current = content;
              setAutosaveStatus('Draft auto-saved');
            } else {
              setAutosaveStatus('Auto-save failed');
            }
          } else {
            setAutosaveStatus('Auto-save failed');
          }
        } else {
          // Update the existing note draft in background
          const response = await API.put(`/notes/${noteId}`, {
            title,
            content,
            subjectId,
          }, {
            isBackground: true,
          });

          if (response.data?.success) {
            lastSavedTitle.current = title;
            lastSavedContent.current = content;
            setAutosaveStatus('Draft auto-saved');
          } else {
            setAutosaveStatus('Auto-save failed');
          }
        }
      } catch (err) {
        console.error('Autosave error:', err);
        setAutosaveStatus('Auto-save failed');
      }
    };

    // Autosave every 10 seconds
    autosaveTimer.current = setInterval(performAutosave, 10000);

    return () => {
      if (autosaveTimer.current) clearInterval(autosaveTimer.current);
    };
  }, [isOpen, title, content, subjectId, noteId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!subjectId) {
      setError('Subject is required');
      return;
    }
    if (!content.trim() || content === '<p><br></p>') {
      setError('Content is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let response;
      if (noteId) {
        // Manual save updates the note
        response = await API.put(`/notes/${noteId}`, {
          title,
          content,
          subjectId,
        });
      } else {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('subjectId', subjectId);

        response = await API.post('/notes', formData, {
          headers: {
            'Content-Type': undefined,
          },
        });
      }

      if (onNoteCreated) {
        onNoteCreated(response.data?.data || response.data);
      }

      setTitle('');
      setContent('');
      setNoteId(null);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['clean'],
    ],
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#fdfaf3] w-full max-w-2xl rounded-sm shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-300">
              <h2 className="text-2xl font-playfair font-bold text-neutral-800">Create Note</h2>
              <button
                onClick={onClose}
                className="text-neutral-500 hover:text-neutral-800 transition-colors"
                disabled={loading}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Subject Selector */}
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-semibold text-neutral-700 mb-1"
                  >
                    Subject Category
                  </label>
                  <select
                    id="subject"
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent transition-all text-neutral-800 font-semibold"
                    disabled={loading}
                  >
                    {subjects.length === 0 ? (
                      <option value="">No subjects found - please create one first</option>
                    ) : (
                      subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Note Title */}
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-semibold text-neutral-700 mb-1"
                  >
                    Title
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter note title..."
                    className="w-full px-4 py-2 bg-white border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent transition-all"
                    disabled={loading}
                  />
                </div>

                {/* Quill Editor */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">
                    Content
                  </label>
                  <div className="bg-white rounded overflow-hidden">
                    <Suspense
                      fallback={
                        <div className="h-[300px] flex items-center justify-center text-neutral-400 text-sm animate-pulse">
                          Loading editor...
                        </div>
                      }
                    >
                      <ReactQuill
                        theme="snow"
                        value={content}
                        onChange={setContent}
                        modules={modules}
                        placeholder="Write your study notes here..."
                        className="h-[300px] mb-12"
                        readOnly={loading}
                      />
                    </Suspense>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-neutral-300 flex items-center justify-between bg-neutral-50">
              <div className="text-xs text-neutral-500 font-medium flex items-center gap-1">
                {autosaveStatus === 'Auto-saving...' && (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-neutral-400 animate-pulse" />
                    <span>Auto-saving draft...</span>
                  </>
                )}
                {autosaveStatus === 'Draft auto-saved' && (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-green-600">Draft auto-saved</span>
                  </>
                )}
                {autosaveStatus === 'Auto-save failed' && (
                  <>
                    <CloudRain className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-red-500">Auto-save suspended</span>
                  </>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 border border-neutral-300 text-neutral-700 rounded hover:bg-neutral-100 font-medium transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || subjects.length === 0}
                  className="px-6 py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded shadow-md hover:shadow-lg font-medium transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateNoteModal;
