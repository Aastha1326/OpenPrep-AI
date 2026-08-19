const Y = require('yjs');

describe('Yjs CRDT Document Synchronization Unit Tests', () => {
  it('instantiates empty ydocs and resolves conflicting text edits deterministically', () => {
    const ydoc1 = new Y.Doc();
    const ydoc2 = new Y.Doc();

    const text1 = ydoc1.getText('content');
    const text2 = ydoc2.getText('content');

    // User 1 types 'Hello'
    text1.insert(0, 'Hello');

    // Sync User 1 update to User 2
    const update1 = Y.encodeStateAsUpdate(ydoc1);
    Y.applyUpdate(ydoc2, update1);

    expect(text2.toString()).toBe('Hello');

    // Concurrent edits: User 1 inserts ' World', User 2 prepends 'Hey '
    text1.insert(5, ' World');
    text2.insert(0, 'Hey ');

    const update1_2 = Y.encodeStateAsUpdate(ydoc1);
    const update2_2 = Y.encodeStateAsUpdate(ydoc2);

    Y.applyUpdate(ydoc1, update2_2);
    Y.applyUpdate(ydoc2, update1_2);

    // CRDT converges to same result without server central mediation
    expect(text1.toString()).toBe(text2.toString());
    expect(text1.toString()).toContain('Hello');
    expect(text1.toString()).toContain('World');
    expect(text1.toString()).toContain('Hey');
  });

  it('correctly exports and imports binary state updates', () => {
    const ydoc = new Y.Doc();
    const text = ydoc.getText('content');
    text.insert(0, 'Collaborative study note text');

    const state = Y.encodeStateAsUpdate(ydoc);
    expect(state).toBeInstanceOf(Uint8Array);

    const loadedDoc = new Y.Doc();
    Y.applyUpdate(loadedDoc, state);

    expect(loadedDoc.getText('content').toString()).toBe('Collaborative study note text');
  });
});
