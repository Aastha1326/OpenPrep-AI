/**
 * @fileoverview Text viewer that renders overlapping highlights and opens a sidebar thread panel.
 */
import React, { useState } from 'react';

const InteractiveHighlightViewer = ({ noteText, highlights, activeHighlightId, setActiveHighlightId, onAddReply }) => {
  const [replyText, setReplyText] = useState('');

  // Sort highlights by start offset to render correctly
  const sortedHighlights = [...highlights].sort((a, b) => a.startOffset - b.startOffset);

  const renderTextWithHighlights = () => {
    const elements = [];
    let lastIndex = 0;

    sortedHighlights.forEach((hl) => {
      // Text before highlight
      if (hl.startOffset > lastIndex) {
        elements.push(
          <span key={`text-${lastIndex}`}>
            {noteText.substring(lastIndex, hl.startOffset)}
          </span>
        );
      }

      // Highlighted text
      elements.push(
        <span
          key={`hl-${hl.id}`}
          onClick={() => setActiveHighlightId(hl.id)}
          className={`cursor-pointer transition-opacity hover:opacity-80 border-b-2 ${
            activeHighlightId === hl.id ? 'border-gray-800 dark:border-gray-200 opacity-100' : 'border-transparent'
          }`}
          style={{ backgroundColor: hl.color + '66' }} // Add transparency
          title={`Highlighted by user ${hl.userId}`}
        >
          {hl.highlightedText}
        </span>
      );

      lastIndex = hl.endOffset;
    });

    // Remaining text
    if (lastIndex < noteText.length) {
      elements.push(
        <span key={`text-${lastIndex}`}>
          {noteText.substring(lastIndex)}
        </span>
      );
    }

    return elements;
  };

  const activeHighlight = highlights.find((h) => h.id === activeHighlightId);

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeHighlightId) return;
    onAddReply(activeHighlightId, replyText.trim());
    setReplyText('');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Text Area */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
        <p className="text-lg leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
          {renderTextWithHighlights()}
        </p>
      </div>

      {/* Sidebar Thread Panel */}
      <div className="w-full lg:w-80 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col">
        {activeHighlight ? (
          <>
            <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Selected Text</p>
              <p className="text-sm text-gray-800 dark:text-gray-200 italic border-l-4 pl-3" style={{ borderColor: activeHighlight.color }}>
                "{activeHighlight.highlightedText}"
              </p>
              <div className="flex gap-2 mt-3">
                <button className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">Resolve</button>
                <button className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50">Delete</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {activeHighlight.comments.map((comment) => (
                <div key={comment.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">User {comment.userId.slice(-4)}</span>
                    <span className="text-[10px] text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{comment.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleReplySubmit} className="mt-auto">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Add to the discussion..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                rows={3}
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="w-full mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Post Reply
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-4">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Click on a highlighted section of the text to view or join the discussion.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveHighlightViewer;
