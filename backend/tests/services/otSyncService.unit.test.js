const { processEdit, transform, applyOpToString, runReconciliationLoop, localDocuments } = require('../../services/otSyncService');
const { Note } = require('../../models');
const redisService = require('../../services/redisService');

describe('OT Revision Manager Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localDocuments.clear();
  });

  test('applyOpToString processes insert/delete/retain correctly', () => {
    const start = 'Hello World';
    // Insert "Beautiful " at pos 6 (retain 6, insert "Beautiful ")
    const op = [{ retain: 6 }, { insert: 'Beautiful ' }];
    const res = applyOpToString(start, op);
    expect(res).toBe('Hello Beautiful World');

    // Delete " World" from "Hello World" (retain 5, delete 6)
    const opDelete = [{ retain: 5 }, { delete: 6 }];
    const resDelete = applyOpToString(start, opDelete);
    expect(resDelete).toBe('Hello');
  });

  test('transform transforms concurrent character edits', () => {
    // Client 1 inserts 'x' at start: [{ insert: 'x' }]
    // Client 2 inserts 'y' at start: [{ insert: 'y' }]
    const op1 = [{ insert: 'x' }];
    const op2 = [{ insert: 'y' }];

    const trans1 = transform(op1, op2);
    // Transformed op1 should retain 1 character (for 'y') then insert 'x'
    expect(trans1).toEqual([{ retain: 1 }, { insert: 'x' }]);
  });

  test('processEdit transform outdated revision and increments counters', async () => {
    redisService.isReady = false; // test local map fallback
    vi.spyOn(Note, 'findByPk').mockResolvedValue({ id: 'note-123', content: 'Base content' });

    // Initial edit (Revision 0 -> 1)
    const res1 = await processEdit('note-123', 0, [{ retain: 12 }, { insert: '!' }], 'socket-1');
    expect(res1.revision).toBe(1);
    expect(res1.content).toBe('Base content!');

    // Outdated edit from another socket (acting on revision 0 instead of 1)
    // Client wanted to insert 'Cool ' at index 0. Concurrent history exists.
    const res2 = await processEdit('note-123', 0, [{ insert: 'Cool ' }], 'socket-2');
    expect(res2.revision).toBe(2);
    // Since socket-2 acted on rev 0, its insert is retained/transformed against socket-1's insert
    // Because it is an insert at 0, it transforms to: insert 'Cool ' then retain remaining.
    expect(res2.content).toBe('Cool Base content!');
  });

  test('runReconciliationLoop updates Note database for dirty documents', async () => {
    vi.spyOn(Note, 'update').mockResolvedValue([1]);

    localDocuments.set('note-555', {
      content: 'Updated draft',
      revision: 4,
      history: [],
      dirty: true,
    });

    await runReconciliationLoop();

    expect(Note.update).toHaveBeenCalledWith(
      { content: 'Updated draft' },
      { where: { id: 'note-555' } }
    );
    expect(localDocuments.get('note-555').dirty).toBe(false);
  });
});
