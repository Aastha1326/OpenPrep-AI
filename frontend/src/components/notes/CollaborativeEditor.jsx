import React, { useState, useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { socket, connectSocket } from '../../services/socket';
import { FaUserPlus, FaCheck } from 'react-icons/fa';
import CollaboratorAvatars from './CollaboratorAvatars';

// Helper to determine initials and color based on name
const getCollaboratorColor = (userId) => {
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6'];
  const hash = userId ? userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
  return colors[hash % colors.length];
};

export default function CollaborativeEditor({ noteId, currentUser = {} }) {
  const [loaded, setLoaded] = useState(false);
  const [content, setContent] = useState('');
  const [collaborators, setCollaborators] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');

  const textareaRef = useRef(null);
  const ydocRef = useRef(null);
  const ytextRef = useRef(null);
  const localUpdateRef = useRef(false);

  // Character-by-character diff algorithm to prevent textarea cursor jump
  const diffAndApply = (ytext, oldStr, newStr) => {
    let start = 0;
    while (start < oldStr.length && start < newStr.length && oldStr[start] === newStr[start]) {
      start++;
    }
    let endOld = oldStr.length;
    let endNew = newStr.length;
    while (endOld > start && endNew > start && oldStr[endOld - 1] === newStr[endNew - 1]) {
      endOld--;
      endNew--;
    }
    if (endOld > start) {
      ytext.delete(start, endOld - start);
    }
    if (endNew > start) {
      ytext.insert(start, newStr.slice(start, endNew));
    }
  };

  useEffect(() => {
    // 1. Initialize Yjs Y.Doc
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('content');
    ydocRef.current = ydoc;
    ytextRef.current = ytext;

    // Connect socket
    connectSocket();

    const username = currentUser.name || 'Anonymous Peer';
    const userId = currentUser.id || 'anon';
    const userColor = getCollaboratorColor(userId);

    // Join Yjs collaboration room
    socket.emit('yjs-join-room', { noteId, username, userId });

    // Step 1: Initial load
    socket.on('yjs-sync-step-1', (payload) => {
      try {
        const arr = new Uint8Array(
          atob(payload)
            .split('')
            .map((c) => c.charCodeAt(0))
        );
        Y.applyUpdate(ydoc, arr);
        setContent(ytext.toString());
        setLoaded(true);
      } catch (err) {
        console.error('Failed to parse initial sync packet:', err);
      }
    });

    // Handle remote Yjs updates
    socket.on('yjs-update', (payload) => {
      try {
        const arr = new Uint8Array(
          atob(payload)
            .split('')
            .map((c) => c.charCodeAt(0))
        );
        localUpdateRef.current = true;
        Y.applyUpdate(ydoc, arr);
        
        // Retain cursor position
        const textarea = textareaRef.current;
        if (textarea) {
          const selectionStart = textarea.selectionStart;
          const selectionEnd = textarea.selectionEnd;
          setContent(ytext.toString());
          setTimeout(() => {
            textarea.selectionStart = selectionStart;
            textarea.selectionEnd = selectionEnd;
          }, 0);
        } else {
          setContent(ytext.toString());
        }
        localUpdateRef.current = false;
      } catch (err) {
        console.error('Failed to apply update update:', err);
      }
    });

    // Local Yjs document changes observer
    const handleYTextChange = (event) => {
      if (localUpdateRef.current) return;

      const stateUpdate = Y.encodeStateAsUpdate(ydoc);
      const base64Update = btoa(
        String.fromCharCode.apply(null, stateUpdate)
      );

      // Send update payload to server
      socket.emit('yjs-update', { noteId, payload: base64Update });
    };

    ytext.observe(handleYTextChange);

    // Awareness: Broadcast cursor presence
    const handleSelection = () => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const payload = {
        userId,
        username,
        color: userColor,
        cursorOffset: textarea.selectionStart,
      };

      socket.emit('yjs-awareness', { noteId, payload });
    };

    // Track active collaborators presence
    socket.on('yjs-awareness', (peerData) => {
      setCollaborators((prev) => {
        const filtered = prev.filter((p) => p.userId !== peerData.userId);
        return [...filtered, peerData];
      });
    });

    const checkInviteUrl = async () => {
      try {
        const res = await API.post(`/notes/${noteId}/share`);
        if (res.data?.success) {
          const domain = window.location.origin;
          setInviteUrl(`${domain}${res.data.data.inviteLink}`);
        }
      } catch (err) {
        console.error(err);
      }
    };
    checkInviteUrl();

    // Attach listeners
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('keyup', handleSelection);
      textarea.addEventListener('click', handleSelection);
    }

    return () => {
      ytext.unobserve(handleYTextChange);
      socket.off('yjs-sync-step-1');
      socket.off('yjs-update');
      socket.off('yjs-awareness');
      if (textarea) {
        textarea.removeEventListener('keyup', handleSelection);
        textarea.removeEventListener('click', handleSelection);
      }
    };
  }, [noteId, currentUser]);

  const handleTextareaChange = (e) => {
    const newVal = e.target.value;
    setContent(newVal);

    if (ytextRef.current) {
      localUpdateRef.current = true;
      diffAndApply(ytextRef.current, ytextRef.current.toString(), newVal);
      localUpdateRef.current = false;
    }
  };

  const handleCopyInvite = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Collaborative Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-neutral-900 border border-neutral-850 p-4 rounded-3xl gap-4">
        <div className="flex items-center gap-3">
          <CollaboratorAvatars collaborators={collaborators} />
        </div>
        
        {inviteUrl && (
          <button
            onClick={handleCopyInvite}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg hover:shadow-indigo-500/10"
          >
            {copiedLink ? <FaCheck className="text-emerald-400" /> : <FaUserPlus />}
            <span>{copiedLink ? 'Copied Link!' : 'Invite Collaborator'}</span>
          </button>
        )}
      </div>

      {/* Editor Canvas */}
      {!loaded ? (
        <div className="h-64 flex flex-col items-center justify-center bg-neutral-900 border border-neutral-850 rounded-3xl">
          <span className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-2" />
          <p className="text-xs text-stone-400 font-semibold">Synchronizing CRDT document states...</p>
        </div>
      ) : (
        <div className="relative w-full border border-neutral-850 rounded-3xl overflow-hidden bg-neutral-900 shadow-xl">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaChange}
            placeholder="Start typing your collaborative notes here..."
            className="w-full min-h-[400px] p-6 bg-transparent text-stone-200 text-sm font-mono outline-none resize-none leading-relaxed"
            aria-label="Collaborative note editor"
          />
        </div>
      )}
    </div>
  );
}
