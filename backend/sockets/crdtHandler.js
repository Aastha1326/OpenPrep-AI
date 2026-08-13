const Y = require('yjs');
const { Note } = require('../models');

const activeDocs = {};

module.exports = (io) => {
  io.on('connection', (socket) => {
    
    socket.on('yjs-join-room', async ({ noteId, username, userId }) => {
      if (!noteId) return;

      socket.join(`note-collab-${noteId}`);

      try {
        if (!activeDocs[noteId]) {
          const note = await Note.findByPk(noteId);
          if (!note) return;

          const doc = new Y.Doc();

          if (note.docState) {
            Y.applyUpdate(doc, new Uint8Array(note.docState));
          } else if (note.content) {
            doc.getText('content').insert(0, note.content);
          }

          activeDocs[noteId] = {
            doc,
            debouncer: null,
          };
        }

        const { doc } = activeDocs[noteId];
        const stateUpdate = Y.encodeStateAsUpdate(doc);

        socket.emit('yjs-sync-step-1', Buffer.from(stateUpdate).toString('base64'));
      } catch (err) {
        console.error('Failed to load Yjs doc state:', err);
      }
    });

    socket.on('yjs-update', ({ noteId, payload }) => {
      if (!noteId || !activeDocs[noteId] || !payload) return;

      const { doc } = activeDocs[noteId];

      try {
        const updateBuffer = Buffer.from(payload, 'base64');
        Y.applyUpdate(doc, new Uint8Array(updateBuffer));

        // Broadcast binary update base64 to peer collaborators
        socket.to(`note-collab-${noteId}`).emit('yjs-update', payload);

        // Debounce database persistence
        if (activeDocs[noteId].debouncer) {
          clearTimeout(activeDocs[noteId].debouncer);
        }

        activeDocs[noteId].debouncer = setTimeout(async () => {
          try {
            const finalState = Y.encodeStateAsUpdate(doc);
            const plainText = doc.getText('content').toString();

            await Note.update(
              {
                docState: Buffer.from(finalState),
                content: plainText,
              },
              {
                where: { id: noteId },
              }
            );
          } catch (dbErr) {
            console.error('Failed to persist collaborative Yjs update:', dbErr);
          }
        }, 2000);
      } catch (err) {
        console.error('Yjs update apply failure:', err);
      }
    });

    socket.on('yjs-awareness', ({ noteId, payload }) => {
      if (!noteId || !payload) return;
      // Broadcast peer presence changes
      socket.to(`note-collab-${noteId}`).emit('yjs-awareness', payload);
    });

    socket.on('disconnect', () => {
      // Cleanups occur dynamically as rooms empty out
    });
  });
};
