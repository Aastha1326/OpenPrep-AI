import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import { Highlighter, MessageSquare, Sparkles, Check } from 'lucide-react';

export default function AnnotatedRichTextEditor({ initialContent, onSave }) {
  const [annotations, setAnnotations] = useState([]); // [{ id, text, color, comment }]
  const [activeComment, setActiveComment] = useState('');
  const [selectedHighlightText, setSelectedHighlightText] = useState(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight.configure({ multicolor: true }),
    ],
    content: initialContent || '<p>Start typing or highlighting your lecture notes here...</p>',
  });

  if (!editor) return null;

  const setHighlightColor = (colorCode) => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    
    if (!selectedText) {
      alert('Please select some text to highlight first.');
      return;
    }

    editor.chain().focus().toggleHighlight({ color: colorCode }).run();
    
    // Prompt or trigger margin comment addition
    setSelectedHighlightText({ text: selectedText, color: colorCode, from, to });
  };

  const handleAddStickyNote = () => {
    if (!selectedHighlightText || !activeComment.trim()) return;

    const newAnnotation = {
      id: Date.now(),
      highlightedText: selectedHighlightText.text,
      color: selectedHighlightText.color,
      comment: activeComment.trim(),
    };

    setAnnotations([...annotations, newAnnotation]);
    setActiveComment('');
    setSelectedHighlightText(null);
  };

  const handleSaveNote = () => {
    const noteJson = editor.getJSON();
    const payload = {
      content: noteJson,
      annotations,
    };
    if (onSave) onSave(payload);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 font-inter text-[#1F150C] dark:text-[#E1DCC9]">
      <div className="flex justify-between items-center mb-4 bg-[#FFFBE9] dark:bg-[#16120E] p-4 rounded-2xl border border-[#CEAB93]/60 dark:border-[#412D15] shadow-sm">
        {/* Multi-Color Highlight Toolbar */}
        <div className="flex items-center gap-2">
          <Highlighter className="w-4 h-4 text-amber-500 mr-1" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C6A53] dark:text-[#C4BA9D]">Highlight:</span>
          <button onClick={() => setHighlightColor('#FEF08A')} className="w-6 h-6 rounded-full bg-yellow-200 border border-yellow-400 cursor-pointer" title="Yellow" />
          <button onClick={() => setHighlightColor('#BBF7D0')} className="w-6 h-6 rounded-full bg-green-200 border border-green-400 cursor-pointer" title="Green" />
          <button onClick={() => setHighlightColor('#FBCFE8')} className="w-6 h-6 rounded-full bg-pink-200 border border-pink-400 cursor-pointer" title="Pink" />
          <button onClick={() => setHighlightColor('#BFDBFE')} className="w-6 h-6 rounded-full bg-blue-200 border border-blue-400 cursor-pointer" title="Blue" />
        </div>

        <button
          onClick={handleSaveNote}
          className="px-4 py-2 rounded-xl btn-primary-theme font-bold text-xs shadow cursor-pointer flex items-center gap-1.5"
        >
          <Check className="w-4 h-4" /> Save Note & Annotations
        </button>
      </div>

      {/* Editor & Side Margin Sticky Notes Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor Pane (2 Columns) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#16120E] border border-[#CEAB93]/60 dark:border-[#412D15] rounded-3xl p-6 shadow-sm min-h-[450px]">
          <EditorContent editor={editor} className="prose dark:prose-invert max-w-none focus:outline-none text-sm" />
        </div>

        {/* Side Margin Sticky Notes Pane (1 Column) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C6A53] dark:text-[#C4BA9D]">Margin Sticky Notes</h3>
          </div>

          {selectedHighlightText && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-3 animate-fade-in">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">Add Sticky Note for Selection:</span>
              <p className="text-xs italic bg-white/50 dark:bg-black/20 p-2 rounded-lg truncate">"{selectedHighlightText.text}"</p>
              <textarea
                value={activeComment}
                onChange={(e) => setActiveComment(e.target.value)}
                placeholder="Type your margin note or revision comment..."
                className="w-full p-2.5 bg-white dark:bg-[#251D17] border border-[#CEAB93]/40 dark:border-[#412D15] rounded-xl text-xs focus:outline-none"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setSelectedHighlightText(null)} className="px-3 py-1.5 text-xs text-neutral-500 hover:underline">Cancel</button>
                <button onClick={handleAddStickyNote} className="px-4 py-1.5 rounded-xl btn-primary-theme font-bold text-xs shadow">Attach Note</button>
              </div>
            </div>
          )}

          {annotations.length === 0 && !selectedHighlightText && (
            <div className="p-6 bg-[#FFFBE9]/50 dark:bg-[#16120E] border border-[#CEAB93]/30 dark:border-[#412D15] rounded-2xl text-center text-xs text-[#8C6A53] dark:text-[#C4BA9D]">
              Select text in your notes and pick a highlight color to attach side margin sticky notes.
            </div>
          )}

          {annotations.map((item) => (
            <div key={item.id} className="p-4 bg-[#FFFBE9] dark:bg-[#16120E] border border-[#CEAB93]/50 dark:border-[#412D15] rounded-2xl shadow-sm space-y-2 relative">
              <div className="absolute left-0 top-4 bottom-4 w-1.5 rounded-r" style={{ backgroundColor: item.color }} />
              <p className="text-[11px] font-bold text-[#8C6A53] dark:text-[#C4BA9D] truncate pl-2">Ref: "{item.highlightedText}"</p>
              <p className="text-xs font-medium pl-2">{item.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
