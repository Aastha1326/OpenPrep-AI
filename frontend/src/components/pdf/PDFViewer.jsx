import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import API from '../../services/api';
import PDFAnnotationToolbar from './PDFAnnotationToolbar';
import StickyNoteOverlay from './StickyNoteOverlay';
import SelectionContextMenu from './SelectionContextMenu';
import './PDFViewer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const SAVE_DEBOUNCE_MS = 400;

const PDFViewer = ({ documentId, fileUrl, subjectId }) => {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.1);
  const [annotations, setAnnotations] = useState([]);
  const [noTextLayer, setNoTextLayer] = useState(false);
  const [selectionMenu, setSelectionMenu] = useState(null); // { top, left, rects, text }
  const [pendingNote, setPendingNote] = useState(null); // { top, left, x, y, text }
  const [flashcardDraft, setFlashcardDraft] = useState(null); // { front, back }

  const pageContainerRef = useRef(null);
  const saveTimerRef = useRef(null);

  // Load previously saved annotations for this document
  useEffect(() => {
    if (!documentId) return;
    API.get(`/documents/${documentId}/annotations`)
      .then((res) => setAnnotations(res.data?.data || []))
      .catch(() => setAnnotations([]));
  }, [documentId]);

  const persistAnnotation = useCallback((payload) => {
    // Debounce so rapid successive actions don't spam the API
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      requestAnimationFrame(() => {
        API.post(`/documents/${documentId}/annotations`, payload)
          .then((res) => {
            if (res.data?.data) {
              setAnnotations((prev) => [...prev, res.data.data]);
            }
          })
          .catch(() => {});
      });
    }, SAVE_DEBOUNCE_MS);
  }, [documentId]);

  const getSelectionRects = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !pageContainerRef.current) return null;
    const range = selection.getRangeAt(0);
    const clientRects = Array.from(range.getClientRects());
    if (clientRects.length === 0) return null;

    const containerRect = pageContainerRef.current.getBoundingClientRect();
    const rects = clientRects.map((r) => ({
      x: (r.left - containerRect.left) / containerRect.width,
      y: (r.top - containerRect.top) / containerRect.height,
      width: r.width / containerRect.width,
      height: r.height / containerRect.height,
    }));

    return { rects, text: selection.toString(), boundingRect: clientRects[0], containerRect };
  };

  const handleMouseUp = () => {
    const selectionInfo = getSelectionRects();
    if (!selectionInfo) {
      setSelectionMenu(null);
      return;
    }
    const { rects, text, boundingRect, containerRect } = selectionInfo;
    setSelectionMenu({
      top: boundingRect.top - containerRect.top - 40,
      left: boundingRect.left - containerRect.left,
      rects,
      text,
    });
  };

  const saveHighlight = (color) => {
    if (!selectionMenu) return;
    persistAnnotation({
      pageNumber,
      rectsData: selectionMenu.rects,
      color,
      commentText: null,
    });
    setSelectionMenu(null);
    window.getSelection()?.removeAllRanges();
  };

  const openAddNote = () => {
    if (!selectionMenu) return;
    setPendingNote({
      top: selectionMenu.top,
      left: selectionMenu.left,
      x: selectionMenu.rects[0].x,
      y: selectionMenu.rects[0].y,
      text: '',
    });
    setSelectionMenu(null);
  };

  const saveNote = () => {
    if (!pendingNote || !pendingNote.text.trim()) {
      setPendingNote(null);
      return;
    }
    persistAnnotation({
      pageNumber,
      rectsData: [{ x: pendingNote.x, y: pendingNote.y }],
      color: '#FFE900',
      commentText: pendingNote.text.trim(),
    });
    setPendingNote(null);
  };

  const openConvertToFlashcard = () => {
    if (!selectionMenu) return;
    setFlashcardDraft({ front: selectionMenu.text, back: '' });
    setSelectionMenu(null);
  };

  const saveFlashcard = () => {
    if (!flashcardDraft || !flashcardDraft.front.trim()) {
      setFlashcardDraft(null);
      return;
    }
    API.post('/flashcards', {
      subjectId,
      front: flashcardDraft.front.trim(),
      back: flashcardDraft.back.trim(),
    }).finally(() => setFlashcardDraft(null));
  };

  // Ctrl+H applies a default yellow highlight to the current selection
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'h') {
        const selectionInfo = getSelectionRects();
        if (selectionInfo) {
          e.preventDefault();
          persistAnnotation({
            pageNumber,
            rectsData: selectionInfo.rects,
            color: '#FFE900',
            commentText: null,
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pageNumber, persistAnnotation]);

  const onPageLoadSuccess = async (page) => {
    try {
      const textContent = await page.getTextContent();
      setNoTextLayer(textContent.items.length === 0);
    } catch {
      setNoTextLayer(false);
    }
  };

  const pageAnnotations = annotations.filter((a) => a.pageNumber === pageNumber);

  return (
    <div className="pdf-viewer-container" style={{ position: 'relative' }}>
      <PDFAnnotationToolbar
        pageNumber={pageNumber}
        numPages={numPages}
        scale={scale}
        onPrevPage={() => setPageNumber((p) => Math.max(1, p - 1))}
        onNextPage={() => setPageNumber((p) => Math.min(numPages, p + 1))}
        onZoomIn={() => setScale((s) => Math.min(2.5, s + 0.1))}
        onZoomOut={() => setScale((s) => Math.max(0.5, s - 0.1))}
      />

      {noTextLayer && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 my-2">
          Text selection requires searchable PDF. OCR parsing recommended.
        </div>
      )}

      <div
        ref={pageContainerRef}
        className="pdf-document"
        style={{ position: 'relative', border: '1px solid #ccc' }}
        onMouseUp={handleMouseUp}
      >
        <Document file={fileUrl} onLoadSuccess={({ numPages: n }) => setNumPages(n)}>
          <Page pageNumber={pageNumber} scale={scale} onLoadSuccess={onPageLoadSuccess} />
        </Document>

        {pageAnnotations.map((ann) =>
          ann.commentText ? (
            <StickyNoteOverlay key={ann.id} annotation={ann} />
          ) : (
            ann.rectsData.map((r, idx) => (
              <div
                key={`${ann.id}-${idx}`}
                style={{
                  position: 'absolute',
                  top: `${r.y * 100}%`,
                  left: `${r.x * 100}%`,
                  width: `${r.width * 100}%`,
                  height: `${r.height * 100}%`,
                  backgroundColor: ann.color,
                  opacity: 0.4,
                  pointerEvents: 'none',
                }}
              />
            ))
          )
        )}

        {selectionMenu && (
          <SelectionContextMenu
            position={selectionMenu}
            onHighlight={saveHighlight}
            onAddNote={openAddNote}
            onConvertToFlashcard={openConvertToFlashcard}
          />
        )}

        {pendingNote && (
          <div
            style={{
              position: 'absolute',
              top: pendingNote.top,
              left: pendingNote.left,
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '8px',
              zIndex: 110,
              boxShadow: '2px 2px 6px rgba(0,0,0,0.2)',
            }}
          >
            <textarea
              autoFocus
              rows={3}
              style={{ width: '180px' }}
              value={pendingNote.text}
              onChange={(e) => setPendingNote({ ...pendingNote, text: e.target.value })}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
              <button type="button" onClick={() => setPendingNote(null)}>Cancel</button>
              <button type="button" onClick={saveNote}>Save</button>
            </div>
          </div>
        )}
      </div>

      {flashcardDraft && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-label="Create flashcard from highlight"
        >
          <div className="bg-white rounded-xl p-4 w-full max-w-md flex flex-col gap-2">
            <label className="text-xs font-semibold">Front</label>
            <textarea
              rows={3}
              value={flashcardDraft.front}
              onChange={(e) => setFlashcardDraft({ ...flashcardDraft, front: e.target.value })}
            />
            <label className="text-xs font-semibold">Back</label>
            <textarea
              rows={3}
              value={flashcardDraft.back}
              onChange={(e) => setFlashcardDraft({ ...flashcardDraft, back: e.target.value })}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setFlashcardDraft(null)}>Cancel</button>
              <button type="button" onClick={saveFlashcard}>Create Flashcard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFViewer;